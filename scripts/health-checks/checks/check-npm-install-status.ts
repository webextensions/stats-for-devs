#!/usr/bin/env node

/* eslint-disable n/no-process-exit */

// Reports when the installed top-level packages under node_modules/ have drifted from the versions
// declared in package.json (dependencies + devDependencies), nudging the user to run "npm install". Only
// direct dependencies are inspected (a fast, top-level check), not the full tree.
//
// Uses the project's "semver" dependency directly for version-range matching.
//
// If package.json is missing (or readable but not parseable as JSON), this warns and - unless
// --exit-with-code-0 is passed - exits 1, instead of silently treating the dependency set as empty (mirrors
// check-node-version.ts's handling of an unreadable .nvmrc). A readable manifest that simply declares
// no dependencies is fine and passes. NOTE: a package.json malformed enough that Node cannot read it
// to determine the adjacent module type (e.g. one left with git conflict markers) makes this script
// fail to LOAD with ERR_INVALID_PACKAGE_CONFIG before the guard below runs - the suite still sees a
// non-zero exit, just not this warning. Same caveat as package.json.ts (see its header).
//
// "--notify" additionally raises a desktop notification. It is passed only by
// .claude/hooks/SessionStart/report-missing-agent-tooling.sh - never add it to a healthChecks entry in
// ../all-is-well.ts, which runs on every commit and push and has to stay silent.
//
// Usage:
//     $ ./check-npm-install-status.ts                    # exits 1 on drift (used by the health-check suite)
//     $ ./check-npm-install-status.ts --exit-with-code-0 # warns only (always exits 0)
//     $ ./check-npm-install-status.ts --notify           # also raises a desktop notification

import fs from 'node:fs';
import path from 'node:path';

import semver from 'semver';

import { logger } from '../../../utils/logger.ts';

const __dirname = import.meta.dirname;
const projectRoot = path.resolve(__dirname, '..', '..', '..');

const exitWithCode0 = process.argv.includes('--exit-with-code-0');
const flagNotify = process.argv.includes('--notify');

const exitWithAppropriateCode = function (exitCode: number) {
    process.exit(exitWithCode0 ? 0 : exitCode);
};

// A desktop notification is a decoration-only nicety (.claude/rules/first-principles.md), so the helper
// is imported only once we actually have something to report - the healthy path pays nothing for it.
// Failures are swallowed: a notification is optional and must never change this check's outcome.
const notifyAsync = async function (title: string, message: string) {
    try {
        const { notifier } = await import('../../../utils/notifier/notifier.ts');
        notifier.warn(title, message);
    } catch {
        // Ignored on purpose.
    }
};

const readFileAsJson = function (filePath: string): Record<string, unknown> | undefined {
    try {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch {
        return undefined;
    }
};

// Non-registry specifiers npm accepts as a dependency "version" that semver cannot range-match. When the
// declared value starts with one of these, we accept whatever is installed (no version comparison).
// Ref: https://docs.npmjs.com/cli/v10/commands/npm-install#description
const NON_SEMVER_PREFIXES = [
    'git+https://', 'git+http://', 'git+ssh://', 'git://',
    'https://', 'http://',
    'file:', 'link:', 'npm:', 'workspace:',
    'bitbucket:', 'gist:', 'github:', 'gitlab:'
];

const mainPackageJson = readFileAsJson(path.resolve(projectRoot, 'package.json'));
if (!mainPackageJson) {
    const message = '\nWarning: Unable to read or parse package.json\n';

    if (exitWithCode0) {
        logger.warn(message);
    } else {
        logger.error(message);
    }

    if (flagNotify) {
        await notifyAsync('Unable to read package.json', 'The declared dependencies could not be determined.');
    }

    exitWithAppropriateCode(1);
}
const allDependencies: Record<string, string> = {
    ...(mainPackageJson?.dependencies as Record<string, string> | undefined),
    ...(mainPackageJson?.devDependencies as Record<string, string> | undefined)
};

let mismatchOrInvalidFound = false;
const updateMessages: string[] = [];

for (const [packageName, range] of Object.entries(allDependencies)) {
    const installedPackageJson = readFileAsJson(path.resolve(projectRoot, 'node_modules', packageName, 'package.json'));
    const installedVersion = installedPackageJson?.version as string | undefined;
    const valid = Boolean(installedVersion && semver.valid(installedVersion));

    const match = (
        valid &&
        (
            semver.satisfies(installedVersion as string, range) ||
            NON_SEMVER_PREFIXES.some((prefix) => range.startsWith(prefix))
        )
    );

    if (!match) {
        mismatchOrInvalidFound = true;
        updateMessages.push(packageName + ' : ' + (installedVersion || 'NA') + ' -> ' + range);
    }
}

if (!mismatchOrInvalidFound) {
    exitWithAppropriateCode(0);
} else {
    const total = Object.keys(allDependencies).length;
    logger.error('\n' + updateMessages.length + '/' + total + ' npm package(s) need to be updated:');
    logger.log(' '.repeat(4) + updateMessages.join('\n    '));
    logger.error('\nWe might want to run "$ npm install"\n');

    if (flagNotify) {
        await notifyAsync(
            'npm packages out of date',
            updateMessages.length + '/' + total + ' package(s) drifted from package.json\nRun: npm install'
        );
    }

    exitWithAppropriateCode(1);
}
