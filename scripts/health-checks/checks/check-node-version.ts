#!/usr/bin/env node

/* eslint-disable n/no-process-exit */

// Reports a mismatch between the Node.js version in use and the one pinned in .nvmrc, nudging the user to
// run "nvm use". A bare version in .nvmrc (e.g. "1.2.34") is treated by semver as an exact match.
//
// Skipped in CI: .github/workflows/ci.yml deliberately runs the suite across a matrix of Node versions,
// so a single-version .nvmrc gate is meaningless there. This is a local "run nvm use" nudge.
//
// "--notify" additionally raises a desktop notification. It is passed only by
// .claude/hooks/SessionStart/report-missing-agent-tooling.sh - never add it to a healthChecks entry in
// ../all-is-well.ts, which runs on every commit and push and has to stay silent.
//
// Usage:
//     $ ./check-node-version.ts                    # exits 1 on mismatch (used by the health-check suite)
//     $ ./check-node-version.ts --exit-with-code-0 # warns only (always exits 0)
//     $ ./check-node-version.ts --notify           # also raises a desktop notification

import fs from 'node:fs';
import path from 'node:path';

import semver from 'semver';

import { logger } from '../../../utils/logger.ts';

const __dirname = import.meta.dirname;

// CI tests against several Node versions on purpose (see header); enforcing one exact version there would
// fail every matrix job. Skip the check in CI; it stays a hard gate locally / in the git hooks.
if (process.env.CI) {
    process.exit(0);
}

const exitWithCode0 = process.argv.includes('--exit-with-code-0');
const flagNotify = process.argv.includes('--notify');

const exitWithAppropriateCode = function (exitCode: number) {
    process.exit(exitWithCode0 ? 0 : exitCode);
};

// A desktop notification is a decoration-only nicety (.claude/rules/first-principles.md), so the helper
// is imported only once we actually have something to report - the healthy path pays nothing for it.
// Failures are swallowed: a notification is optional, and this is awaited inside the try/catch below,
// whose catch reports an unreadable .nvmrc - it must never be entered for a notification problem.
const notifyAsync = async function (title: string, message: string) {
    try {
        const { notifier } = await import('../../../utils/notifier/notifier.ts');
        notifier.warn(title, message);
    } catch {
        // Ignored on purpose.
    }
};

const nodeVersion = process.versions.node;
const loggerWarnOrError = exitWithCode0 ? logger.warn : logger.error;

try {
    const dotNvmrcPath = path.resolve(__dirname, '..', '..', '..', '.nvmrc');
    const dotNvmrcContents = fs.readFileSync(dotNvmrcPath, 'utf8').trim();
    if (!semver.satisfies(nodeVersion, dotNvmrcContents)) {
        logger.log('');
        logger.success(' ✔    .nvmrc suggests: Node JS ' + dotNvmrcContents);
        loggerWarnOrError(' ✘ Version being used: Node JS ' + nodeVersion);
        loggerWarnOrError('\nWe might want to run:');
        loggerWarnOrError('    $ nvm use\n');

        if (flagNotify) {
            await notifyAsync(
                'Wrong Node version',
                '.nvmrc suggests Node JS ' + dotNvmrcContents + ', in use: ' + nodeVersion + '\nRun: nvm use'
            );
        }

        exitWithAppropriateCode(1);
    }
} catch {
    loggerWarnOrError('\nWarning: Unable to read the .nvmrc file\n');

    if (flagNotify) {
        await notifyAsync('Unable to read .nvmrc', 'The Node version pinned for this project could not be determined.');
    }

    exitWithAppropriateCode(1);
}
