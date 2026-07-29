#!/usr/bin/env bash

cd "$(dirname "$0")" # Change directory to the folder containing this file (scripts/health-checks/checks/)
cd ../../../         # Change directory to project's root folder

# Lints only the staged frontend CSS files (run by the stylelint:staged-files /
# stylelint:staged-files:fix npm scripts). Read-only verify - never auto-fixes / re-stages unless
# "--fix" is passed.
#
# Sibling of "eslint-staged-files.sh" and shares its portability approach: the staged paths are
# read NUL-delimited (handles spaces / newlines in filenames) into an array via a "while read" loop
# (not "readarray", a bash 4.0+ builtin absent on macOS bash 3.2), and stylelint is skipped
# entirely when no matching file is staged - the portable equivalent of GNU-only "xargs -r".
#
# "stylelint" resolves via PATH: this script is always invoked through "node --run ...", which adds
# node_modules/.bin to PATH. "--allow-empty-input" keeps the run green when every passed file is
# excluded by .stylelintignore (e.g. only vendored third-party CSS was staged).

# Skip staged paths missing from the working tree (staged-then-deleted files) - stylelint errors on
# paths it cannot find.
#
# ":(glob)" pathspec magic is required: git's default fnmatch pathspecs need "**/" to match at
# least one directory, silently missing CSS files directly under frontend/src/; wildmatch
# (":(glob)") lets "**/" match zero or more directories.
files=()
while IFS= read -r -d '' file; do
    if [ -e "$file" ]; then
        files+=("$file")
    fi
done < <(git diff --cached --name-only --diff-filter=ACMRU -z -- ':(glob)frontend/src/**/*.css')

if [ ${#files[@]} -eq 0 ]; then
    exit 0
fi

exec stylelint --allow-empty-input "$@" "${files[@]}"
