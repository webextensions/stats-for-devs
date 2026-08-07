#!/usr/bin/env bash

# SessionStart hook (matcher "startup|clear"), wired in .claude/settings.json.
#
# Announces workspace context - the current branch, a worktree dirty-count one-liner, and whether
# the CodeGraph index is live - so the agent starts every session grounded in where it is working.
# The template family is branch-heavy (one project per branch), and agents have missed which branch
# is checked out or assumed CodeGraph is queryable in a clone that was never indexed. The CodeGraph
# test keys on .codegraph/codegraph.db, not the directory: .codegraph/ is committed with only its
# .gitignore, so it exists even in clones that were never indexed (the same heuristic as
# scripts/health-checks/checks/check-codegraph.ts). This hook only states status - diagnosing
# BROKEN tooling is the sibling report-missing-agent-tooling.sh hook's job.
#
# Output channel: stdout - a SessionStart "additionalContext" JSON object. Unlike the sibling hook,
# this one always emits: an announcement that goes silent when everything is normal would defeat
# its grounding purpose. Outside a git work tree it exits 0 silently (fail open).
#
# Cost: a few git subprocesses plus one node fork for the JSON emit.
#
# Reads the Claude Code hook event JSON from stdin (unused - gating on "source" is the matcher's job).
# Always exits 0; SessionStart cannot block a session anyway.

cat > /dev/null

project_dir="${CLAUDE_PROJECT_DIR:-.}"

if ! git -C "$project_dir" rev-parse --is-inside-work-tree > /dev/null 2>&1; then
    exit 0
fi

branch="$(git -C "$project_dir" branch --show-current)"
if [ -z "$branch" ]; then
    branch="detached @ $(git -C "$project_dir" rev-parse --short HEAD)"
fi

status_output="$(git -C "$project_dir" status --porcelain)"
if [ -z "$status_output" ]; then
    worktree='clean'
else
    added=0
    deleted=0
    modified=0
    renamed=0
    untracked=0
    while IFS= read -r line; do
        case "${line:0:2}" in
            '??') untracked=$((untracked + 1)) ;;
            *R*|*C*) renamed=$((renamed + 1)) ;;
            *A*) added=$((added + 1)) ;;
            *D*) deleted=$((deleted + 1)) ;;
            *) modified=$((modified + 1)) ;;
        esac
    done <<< "$status_output"

    worktree=''
    for part in "$modified modified" "$added added" "$deleted deleted" "$renamed renamed" "$untracked untracked"; do
        if [ "${part%% *}" -gt 0 ]; then
            worktree="${worktree:+$worktree, }$part"
        fi
    done
fi

if [ -f "$project_dir/.codegraph/codegraph.db" ]; then
    codegraph='index live'
else
    codegraph='index missing (CodeGraph not in use in this clone)'
fi

BRANCH="$branch" WORKTREE="$worktree" CODEGRAPH="$codegraph" node -e '
    process.stdout.write(JSON.stringify({
        hookSpecificOutput: {
            hookEventName: "SessionStart",
            additionalContext:
                "Workspace context (SessionStart hook):\n" +
                "Branch: " + process.env.BRANCH + "\n" +
                "Worktree: " + process.env.WORKTREE + "\n" +
                "CodeGraph: " + process.env.CODEGRAPH
        }
    }));
'

exit 0
