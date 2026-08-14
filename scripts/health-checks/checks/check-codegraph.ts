#!/usr/bin/env node

/* eslint-disable n/no-process-exit */

// Reports when this repo has a CodeGraph index but the "codegraph" binary cannot be run, nudging the
// user to reinstall it. The MCP server in .mcp.json is spawned as "codegraph serve --mcp"; when the
// binary is absent the server never connects and agents silently lose the code-intelligence tools
// CLAUDE.md tells them to prefer - despite a fully built index sitting in .codegraph/.
//
// Deliberately asymmetric: a repo WITHOUT an index stays silent (indexing is the user's decision -
// see the CodeGraph section of CLAUDE.md), so only the "indexed but binary broken" state - which
// implies codegraph was once installed here - is worth reporting. The index test keys on
// .codegraph/codegraph.db, not the directory: .codegraph/ is committed with only a .gitignore, so it
// exists even in clones that were never indexed. The repo root is resolved from this file's location,
// not the CWD, because the SessionStart hook and .husky/post-checkout run from different directories.
//
// Detection spawns the binary itself, so node:child_process resolves PATH (and PATHEXT on Windows)
// natively instead of us hand-rolling a PATH scan. ENOENT means "not on PATH"; a non-zero exit means
// "on PATH but not runnable", which is what a global install left behind by a DIFFERENT nvm Node looks
// like (see .claude/rules/agent-environment-reliability.md). The nudge is a direct
// "npm install -g @colbymchenry/codegraph" rather than setup:ai - that script installs tooling every
// clone needs, while CodeGraph is opt-in per clone.
//
// Skipped in CI: CI runs no agent and has no index.
//
// Callers, both warn-only: .claude/hooks/SessionStart/report-missing-agent-tooling.sh (which also passes
// --notify) and .husky/post-checkout. That post-checkout line is also what anchors this file for knip -
// knip's husky plugin parses hook scripts but has no .claude/hooks/ plugin, so dropping the line would
// make "node --run knip" flag this file as unused.
//
// Deliberately NOT registered in the healthChecks array of ../all-is-well.ts: a missing GLOBAL binary is
// a workstation fact, not a property of the commit, so it must not block a commit for contributors who
// use no agent at all. For the same reason "--notify" must never appear in a healthChecks entry - the
// suite runs on every commit and push, and has to stay silent.
//
// Usage:
//     $ ./check-codegraph.ts                    # exits 1 when indexed but codegraph cannot be run
//     $ ./check-codegraph.ts --exit-with-code-0 # warns only (always exits 0)
//     $ ./check-codegraph.ts --notify           # also raises a desktop notification

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';

import { logger } from '../../../utils/logger.ts';

// CI has no agent to serve and no index; see header.
if (process.env.CI) {
    process.exit(0);
}

const projectRoot = path.join(import.meta.dirname, '..', '..', '..');

// No index means CodeGraph is not in use in this clone - nothing to report (see header).
if (!existsSync(path.join(projectRoot, '.codegraph', 'codegraph.db'))) {
    process.exit(0);
}

const exitWithCode0 = process.argv.includes('--exit-with-code-0');
const flagNotify = process.argv.includes('--notify');

const exitWithAppropriateCode = function (exitCode: number) {
    process.exit(exitWithCode0 ? 0 : exitCode);
};

const loggerWarnOrError = exitWithCode0 ? logger.warn : logger.error;

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

const CODEGRAPH_BINARY = 'codegraph';

const result = spawnSync(CODEGRAPH_BINARY, ['--version'], { stdio: 'ignore', timeout: 10000 });
const spawnError = result.error as NodeJS.ErrnoException | undefined;

let problem = '';
if (spawnError?.code === 'ENOENT') {
    problem = 'Not found on PATH: ' + CODEGRAPH_BINARY;
} else if (spawnError) {
    problem = 'Could not run ' + CODEGRAPH_BINARY + ': ' + spawnError.message;
} else if (result.status !== 0) {
    problem = 'On PATH, but "' + CODEGRAPH_BINARY + ' --version" exited with code ' + result.status;
}

if (problem) {
    logger.log('');
    logger.success(' ✔ Needed by: the codegraph MCP server in .mcp.json (spawned as "' + CODEGRAPH_BINARY + ' serve --mcp") - this repo has a built index in .codegraph/');
    loggerWarnOrError(' ✘ ' + problem);
    loggerWarnOrError('\nWe might want to run:');
    loggerWarnOrError('    $ npm install -g @colbymchenry/codegraph\n');

    if (flagNotify) {
        await notifyAsync(
            'Agent tooling missing',
            problem + '\nThe codegraph MCP server cannot start without it.\nRun: npm install -g @colbymchenry/codegraph'
        );
    }

    exitWithAppropriateCode(1);
}
