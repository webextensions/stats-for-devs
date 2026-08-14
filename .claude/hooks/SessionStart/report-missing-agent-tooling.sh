#!/usr/bin/env bash

# SessionStart hook (matcher "startup|clear"), wired in .claude/settings.json.
#
# Reports agent-supporting workstation tooling that is MISSING - above all typescript-language-server,
# which Claude Code's LSP tool spawns as "typescript-language-server --stdio". When that binary is absent
# the LSP tool fails with ENOENT and the agent silently loses go-to-definition, find-references, and
# per-file diagnostics, with nothing anywhere explaining why. Node drifting from .nvmrc and a stale
# node_modules/ fail just as quietly (see .claude/rules/agent-environment-reliability.md).
#
# The detection logic is deliberately NOT here: it lives in the shared, independently runnable check
# scripts under scripts/health-checks/checks/, which .husky/post-checkout also runs warn-only (so
# non-Claude tooling gets the same nudge). This script only aggregates them. A fifth concern means a
# fifth check script, not more code here.
#
# Two channels, and only when something is actually missing - a healthy workstation gets total silence:
#   1. stdout - a SessionStart "additionalContext" JSON object, so the AGENT knows its tools are degraded
#   2. desktop notification - raised by the check scripts themselves via their opt-in "--notify" flag
# There is deliberately NO stderr block: on exit 0 a hook's stderr goes to the debug log only, never to
# the user or to Claude, so it would be write-only noise. The checks' own stderr stays visible where it
# is actually read - .husky/post-checkout and direct invocation.
#
# Cost: four node forks (~0.5s). The settings.json matcher keeps this to "startup" and "clear", the two
# sources that begin with an empty context window; the process is never even spawned on "resume",
# "compact", or "fork". A short "timeout" is set alongside the matcher because a desktop notification can
# block on D-Bus in a headless / SSH session (node-notifier runs notify-send without a timeout).
#
# FORCE_COLOR=0: the checks log through utils/logger.ts (chalk), and ANSI escapes would be embedded
# verbatim in the JSON string. Their output is captured with 2>&1 because logger.log/success write to
# stdout while logger.warn/error write to stderr.
#
# Reads the Claude Code hook event JSON from stdin (unused - gating on "source" is the matcher's job).
# Always exits 0; SessionStart cannot block a session anyway.

cat > /dev/null

report=''

for check in \
    check-node-version.ts \
    check-npm-install-status.ts \
    check-lsp-server.ts \
    check-codegraph.ts
do
    output="$(FORCE_COLOR=0 "${CLAUDE_PROJECT_DIR:-.}/scripts/health-checks/checks/$check" --exit-with-code-0 --notify 2>&1)"
    if [ -n "$output" ]; then
        report="${report}${output}"$'\n'
    fi
done

if [ -z "$report" ]; then
    exit 0
fi

REPORT="$report" node -e '
    process.stdout.write(JSON.stringify({
        hookSpecificOutput: {
            hookEventName: "SessionStart",
            additionalContext:
                "Workstation tooling check (SessionStart hook). The following was not found on the " +
                "PATH of this hook, which may differ from the PATH of an interactive shell. Anything " +
                "depending on it fails silently - notably the LSP tool, which does nothing at all " +
                "without typescript-language-server:\n\n" +
                process.env.REPORT +
                "\nThis is informational. Do not run the fixes unprompted, do not raise this again " +
                "unless it blocks a tool you actually tried to use, and proceed with the request " +
                "normally."
        }
    }));
'

exit 0
