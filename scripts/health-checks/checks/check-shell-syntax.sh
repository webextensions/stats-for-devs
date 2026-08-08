#!/usr/bin/env bash

cd "$(dirname "$0")" # Change directory to the folder containing this file
cd ../../../         # Change directory to project's root folder

# Syntax check for the repo's shell scripts: `bash -n` over every repo *.sh file plus the
# extension-less git hooks in .husky/ (their only other listed entry, README.md, is filtered out),
# discovered by `git ls-files --cached --others --exclude-standard` - tracked plus
# untracked-not-ignored, so brand-new files are checked too (matching ./check-syntax.ts). `-n` reads
# and parses a script without executing any of it, so this is safe to run over scripts that would
# otherwise delete files or push commits.
#
# This is the ONLY automated check shell scripts get here - there is no shellcheck - and the repo
# leans on shell heavily (husky hooks, agent hooks, housekeeping and check scripts), so an unnoticed
# typo in one of them would otherwise only surface when it ran. Note the scope: `bash -n` catches
# syntax errors, not quoting bugs, unset variables, or logic errors.
#
# The JS/TS counterpart is ./check-syntax.ts (`node --run syntaxlint:js`); the `syntaxlint` npm
# script runs both.
#
# Usage (from the project's root folder):
#     $ ./scripts/health-checks/checks/check-shell-syntax.sh [--verbose]
#     $ node --run syntaxlint:sh
#
# --verbose prints a per-file pass/fail line (same format as check-syntax.ts) in addition to errors.

verbose=0
if [ "$1" = "--verbose" ] || [ "$1" = "-v" ]; then
    verbose=1
fi

failed=0

while IFS= read -r -d '' file; do
    # .husky/README.md is the one non-script match of the pathspecs below.
    case "$file" in
        *.md) continue ;;
    esac

    # A listed file can be absent from the working tree (an unstaged rename/delete leaves the old
    # path in the index but not on disk). Nothing to parse - skip it rather than fail.
    if [ ! -e "$file" ]; then
        if [ "$verbose" -eq 1 ]; then
            echo " - Skipped (not on disk): $file"
        fi
        continue
    fi

    # bash already prefixes its diagnostics with the file and line number.
    if bash -n "$file"; then
        if [ "$verbose" -eq 1 ]; then
            echo " ✔ Syntax OK: $file"
        fi
    else
        failed=1
        if [ "$verbose" -eq 1 ]; then
            echo " ✘ Syntax Error: $file"
        fi
    fi
done < <(git ls-files -z --cached --others --exclude-standard -- '*.sh' '.husky/*')

if [ "$failed" -ne 0 ]; then
    echo 'Syntax errors found' >&2
    exit 1
fi

exit 0
