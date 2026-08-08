#!/usr/bin/env node

// Long-lived watcher for "package.json.ts" and the "utils/package-json-utils/" helper module it
// computes its dependency fields with. Whenever one of those sources changes on disk, this re-runs
// "./generate-package-json.sh" so "package.json" and "package-version.json" never drift from their
// sources of truth.
//
// ".vscode/tasks.json" starts this watcher through "runOptions": { "runOn": "folderOpen" } and it
// then stays alive for the life of the editor window. Because the trigger is the file WRITE (not a
// save keystroke), it also covers autosave, "Save All", AI-agent writes and "git checkout".
//
// Why DIRECTORIES are watched instead of the files:
//     node:fs "watch()" on a single path binds to that path's inode (inotify on Linux, kqueue on
//     macOS). Editors, formatters and "git checkout" routinely replace a file by writing a
//     temporary file and renaming it over the original, which swaps the inode. The old watch then
//     goes silent - permanently, and WITHOUT emitting an error or closing, so the process looks
//     healthy while doing nothing. Watching the containing directory and filtering on the reported
//     filename survives that (the rename is an event on the directory) and also recovers when the
//     file is deleted and recreated.
//
// Other behaviours:
//     - Runs the generator once at startup, so an edit made while the watcher was down is picked up.
//     - Debounces bursts (a single save emits more than one event) and never runs two generator
//       processes at once; a change arriving mid-run queues exactly one follow-up run.
//     - A failing generator is reported and the watcher keeps running.
//     - Re-establishes a watch, after a back-off, if it errors out.
//
// Usage (from any directory - paths are resolved from this file's own location):
//     $ ./scripts/housekeeping/watch-package-json.ts
//     $ node --run housekeeping:generate-package-json:watch
//
// NOTE: This process NEVER exits on its own. Do not run it from an agent session without a timeout -
// use "node --run housekeeping:generate-package-json" for a one-shot regeneration instead.

import fs from 'node:fs';
import path from 'node:path';

import { execa } from 'execa';

import { logger } from '../../utils/logger.ts';

const __dirname = import.meta.dirname;
const projectRoot = path.join(__dirname, '..', '..');

const WATCHED_FILE_NAME = 'package.json.ts';
const HELPERS_DIR_RELATIVE_PATH = path.join('utils', 'package-json-utils');
const helpersDirPath = path.join(projectRoot, HELPERS_DIR_RELATIVE_PATH);
const generatorPath = path.join(projectRoot, 'scripts', 'housekeeping', 'generate-package-json.sh');

// A single save emits more than one event (a truncate plus a write, or a rename plus a change);
// collapse them into one generator run.
const DEBOUNCE_MS = 250;

// Back-off before re-establishing a watch that errored out (for example when the inotify watch limit
// is hit, or a directory is briefly replaced).
const WATCH_RETRY_MS = 2000;

let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let flagGeneratorRunning = false;
let flagRunPending = false;
let lastKnownSignature = '';

// "HH:MM:SS" - a log that stays open all day is unreadable without it.
const getTimestamp = function (): string {
    return new Date().toTimeString().slice(0, 8);
};

// Size, mtime and inode of every watched source file ("package.json.ts" plus the .ts files under
// "utils/package-json-utils/"); a momentarily absent file contributes an empty entry (an atomic save
// leaves a short window with no file at the path). Only used on platforms where "watch()" reports no
// filename.
const readWatchedFilesSignature = function (): string {
    const filePaths = [path.join(projectRoot, WATCHED_FILE_NAME)];
    try {
        for (const entry of fs.readdirSync(helpersDirPath)) {
            if (entry.endsWith('.ts')) {
                filePaths.push(path.join(helpersDirPath, entry));
            }
        }
    } catch (err) {
        // The helpers directory being momentarily absent is treated like an absent file.
    }

    return filePaths
        .map(function (filePath) {
            try {
                const stats = fs.statSync(filePath);
                return `${filePath}:${stats.size}:${stats.mtimeMs}:${stats.ino}`;
            } catch (err) {
                return `${filePath}:`;
            }
        })
        .join('\n');
};

const runGeneratorAsync = async function (): Promise<void> {
    logger.info(`[${getTimestamp()}] A watched source changed - regenerating ...`);

    const result = await execa(generatorPath, [], {
        all: true,
        cwd: projectRoot,
        reject: false
    });

    // Refresh the baseline AFTER the run, so the generator's own writes can never look like an edit.
    lastKnownSignature = readWatchedFilesSignature();

    if (result.exitCode === 0) {
        logger.success(`[${getTimestamp()}] Regenerated "package.json" and "package-version.json".`);
    } else {
        logger.error(`[${getTimestamp()}] Regeneration failed (exit code: ${result.exitCode}). The watcher is still running.`);
        if (result.all) {
            logger.warn(result.all);
        }
    }
};

// Drains the "a run is pending" flag, one generator process at a time. Failures are swallowed here so
// that a broken "package.json.ts" can never take the watcher down.
const processPendingRunsAsync = async function (): Promise<void> {
    if (flagGeneratorRunning) {
        // The run already in flight picks up "flagRunPending" before it finishes.
        return;
    }

    flagGeneratorRunning = true;
    try {
        while (flagRunPending) {
            flagRunPending = false;
            try {
                await runGeneratorAsync();
            } catch (err) {
                logger.error(`[${getTimestamp()}] Unexpected failure while regenerating. The watcher is still running.`);
                console.error(err);
            }
        }
    } finally {
        flagGeneratorRunning = false;
    }
};

const scheduleRun = function (): void {
    flagRunPending = true;
    if (debounceTimer) {
        clearTimeout(debounceTimer);
    }
    // Deliberately not unref()'d - this timer is what keeps the process alive between events.
    debounceTimer = setTimeout(processPendingRunsAsync, DEBOUNCE_MS);
};

const handleWatchEvent = function (isRelevantFilename: (filename: string) => boolean, filename: string | null): void {
    if (typeof filename === 'string') {
        if (!isRelevantFilename(filename)) {
            // Any other entry of the watched directory, including the "package.json" we write.
            return;
        }
    } else {
        // "watch()" is documented as not always supplying the filename. Without it we cannot tell our
        // own "package.json" write apart from a real source edit, so compare the watched sources
        // against their own last known size, mtime and inode instead - otherwise the generator would
        // keep retriggering itself.
        const signature = readWatchedFilesSignature();
        if (signature === lastKnownSignature) {
            return;
        }
        lastKnownSignature = signature;
    }

    scheduleRun();
};

const startWatching = function (dirPath: string, isRelevantFilename: (filename: string) => boolean): void {
    let watcher: fs.FSWatcher;

    try {
        // The containing directory, NOT the source file itself - see the header comment on atomic saves.
        watcher = fs.watch(dirPath, { persistent: true }, function (_watchEventType, filename) {
            handleWatchEvent(isRelevantFilename, filename);
        });
    } catch (err) {
        logger.error(`[${getTimestamp()}] Could not watch "${dirPath}". Retrying in ${WATCH_RETRY_MS} ms.`);
        console.error(err);
        setTimeout(function () {
            startWatching(dirPath, isRelevantFilename);
        }, WATCH_RETRY_MS);
        return;
    }

    watcher.on('error', function (err) {
        logger.error(`[${getTimestamp()}] The watch on "${dirPath}" errored. Re-establishing it in ${WATCH_RETRY_MS} ms.`);
        console.error(err);
        watcher.close();
        setTimeout(function () {
            startWatching(dirPath, isRelevantFilename);
        }, WATCH_RETRY_MS);
    });
};

const mainAsync = async function (): Promise<void> {
    logger.info(`[${getTimestamp()}] Watching "${WATCHED_FILE_NAME}" and "${HELPERS_DIR_RELATIVE_PATH}/*.ts" in "${projectRoot}". Press Ctrl+C to stop.`);
    startWatching(projectRoot, function (filename) {
        return filename === WATCHED_FILE_NAME;
    });
    startWatching(helpersDirPath, function (filename) {
        return filename.endsWith('.ts');
    });

    // Run once at startup, so an edit made while the watcher was down is not missed.
    lastKnownSignature = readWatchedFilesSignature();
    flagRunPending = true;
    await processPendingRunsAsync();
};

try {
    await mainAsync();
} catch (err) {
    logger.error('Error: Unexpected failure in "watch-package-json"');
    console.error(err);
}
