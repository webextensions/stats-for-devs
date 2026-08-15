#!/usr/bin/env bash

# Runs as the "version" lifecycle step of "npm version <patch|minor|major>".
#
# By that point npm has already written the new version into package.json (and package-lock.json).
# package.json.ts derives its "version" from package.json, so regenerating package.json from the
# source re-derives that new version automatically. We then regenerate package-version.json (the
# version fallback) so it tracks the new version too, regenerate CHANGELOG.md from git history, and
# stage all of them so they are part of the version commit npm is about to create.
#
# Steps that happen when a new version is created by the "npm version <patch|minor|major>" command:
#     Step 1: (Handled by the "preversion" script)
#         node --run test
#     Step 2: (Handled by the "npm version ..." command)
#         Update ./package.json (new version) and ./package-lock.json
#     Step 3: (Handled by the "version" script - this file)
#         Regenerate ./package.json from ./package.json.ts; regenerate ./package-version.json;
#         regenerate ./CHANGELOG.md from git history
#         git add ./package.json ./package-version.json ./CHANGELOG.md
#     Step 4: (Handled by the "npm version ..." command)
#         git add ./package.json ./package-lock.json
#         git commit -m "<version>" (runs the pre-commit hook)
#         git tag "v<version>"
#     Step 5: (Handled by the "postversion" script)
#         git push --follow-tags (runs the pre-push hook)

cd "$(dirname "$0")" # Change directory to the folder containing this file
cd ../../            # Change directory to project's root folder

set -e
# Echo each command as it runs: release runs are rare and non-interactive (inside "npm version",
# sometimes wrapped by tools like np), so trace output in captured logs aids post-mortem of failures.
set -x

# Regenerate package.json from package.json.ts (which derives the new "version" back from the
# package.json npm just wrote).
./node_modules/.bin/package-cjson --mode generate-package-json

# Regenerate package-version.json (the version fallback) so it tracks the new version.
./node_modules/.bin/package-cjson --mode generate-package-version-json

# Regenerate CHANGELOG.md from git history (auto-changelog reads .auto-changelog). With
# "package": true it labels the new section from package.json's version, even though npm has not
# created the tag (or the version-bump commit) yet at this point in the lifecycle.
# CHANGELOG.md is exempt from the non-keyboard-character guard (via the "exemptions" section of
# .block-non-keyboard-characters.suppressions.json), so any
# commit-subject punctuation is reproduced verbatim here - no normalization step is needed.
node --run changelog

# Stage the synced files so they are part of the version commit created by "npm version"
git add package.json package-version.json CHANGELOG.md
