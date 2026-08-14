#!/usr/bin/env node

/* eslint-disable n/no-process-exit */

// Reports when "typescript-language-server" cannot be run, nudging the user to run "node --run setup:ai".
// Claude Code's LSP tool spawns "typescript-language-server --stdio"; when the binary is absent the tool
// fails with ENOENT and the agent silently loses go-to-definition, find-references, and per-file
// diagnostics - with nothing anywhere reporting why.
//
// Detection spawns the binary itself, so node:child_process resolves PATH (and PATHEXT on Windows)
// natively instead of us hand-rolling a PATH scan. ENOENT means "not on PATH"; a non-zero exit means
// "on PATH but not runnable", which is what a global install left behind by a DIFFERENT nvm Node looks
// like (see .claude/rules/agent-environment-reliability.md). Costs ~150ms when present, ~2ms when absent.
//
// Skipped in CI: CI runs no editor and no agent, and .github/workflows/ci.yml has no setup:ai step.
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
//     $ ./check-lsp-server.ts                    # exits 1 when the language server cannot be run
//     $ ./check-lsp-server.ts --exit-with-code-0 # warns only (always exits 0)
//     $ ./check-lsp-server.ts --notify           # also raises a desktop notification

import { spawnSync } from 'node:child_process';

import { logger } from '../../../utils/logger.ts';

// CI has no agent to serve and no setup:ai step; see header.
if (process.env.CI) {
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

const LSP_BINARY = 'typescript-language-server';

const result = spawnSync(LSP_BINARY, ['--version'], { stdio: 'ignore', timeout: 10000 });
const spawnError = result.error as NodeJS.ErrnoException | undefined;

let problem = '';
if (spawnError?.code === 'ENOENT') {
    problem = 'Not found on PATH: ' + LSP_BINARY;
} else if (spawnError) {
    problem = 'Could not run ' + LSP_BINARY + ': ' + spawnError.message;
} else if (result.status !== 0) {
    problem = 'On PATH, but "' + LSP_BINARY + ' --version" exited with code ' + result.status;
}

if (problem) {
    logger.log('');
    logger.success(' ✔ Needed by: the Claude Code LSP tool (it spawns "' + LSP_BINARY + ' --stdio")');
    loggerWarnOrError(' ✘ ' + problem);
    loggerWarnOrError('\nWe might want to run:');
    loggerWarnOrError('    $ node --run setup:ai\n');

    if (flagNotify) {
        await notifyAsync(
            'Agent tooling missing',
            problem + '\nThe Claude Code LSP tool does nothing without it.\nRun: node --run setup:ai'
        );
    }

    exitWithAppropriateCode(1);
}
