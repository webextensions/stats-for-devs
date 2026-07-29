#!/usr/bin/env bash

cd "$(dirname "$0")" # Change directory to the folder containing this file (scripts/health-checks/checks/)
cd ../../../         # Change directory to project's root folder

# Lints only the frontend CSS files changed in the working tree - the union of staged, unstaged,
# and untracked files (run by the stylelint:changed-files / stylelint:changed-files:fix npm
# scripts). Read-only verify - never auto-fixes unless "--fix" is passed.
#
# Sibling of "stylelint-staged-files.sh" (which covers only the staged set) and of the eslint-*
# wrappers next to it; shares their portability approach: paths are read NUL-delimited (handles
# spaces / newlines in filenames) into an array via a "while read" loop (not "readarray", a
# bash 4.0+ builtin absent on macOS bash 3.2), and stylelint is skipped entirely when nothing
# changed - the portable equivalent of GNU-only "xargs -r".
#
# "stylelint" resolves via PATH: this script is always invoked through "node --run ...", which adds
# node_modules/.bin to PATH. "--allow-empty-input" keeps the run green when every passed file is
# excluded by .stylelintignore (e.g. only vendored third-party CSS changed).

# Skip listed paths missing from the working tree (e.g. staged-then-deleted files) - stylelint
# errors on paths it cannot find.
#
# ":(glob)" pathspec magic is required: git's default fnmatch pathspecs need "**/" to match at
# least one directory, silently missing CSS files directly under frontend/src/; wildmatch
# (":(glob)") lets "**/" match zero or more directories.
files=()
while IFS= read -r -d '' file; do
    if [ -e "$file" ]; then
        files+=("$file")
    fi
done < <(
    {
        git diff --cached --name-only --diff-filter=ACMRU -z -- ':(glob)frontend/src/**/*.css'
        git diff --name-only --diff-filter=ACMRU -z -- ':(glob)frontend/src/**/*.css'
        git ls-files --others --exclude-standard -z -- ':(glob)frontend/src/**/*.css'
    } | sort -z -u
)

if [ ${#files[@]} -eq 0 ]; then
    exit 0
fi

exec stylelint --allow-empty-input "$@" "${files[@]}"
