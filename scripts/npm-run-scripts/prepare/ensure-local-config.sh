#!/usr/bin/env bash

# Creates the git-ignored config/config.development.local.js from its committed example when
# missing, so fresh clones and CI pass "node --run test" (whose build:dry-run health check reads
# that config) without a manual setup step. Invoked by ../prepare.sh (the "prepare" npm script,
# which runs on "npm install" / "npm ci").
#
# No-ops silently when the local file already exists or the example is absent (a fork that
# reshapes config/ must not get a broken "npm install"). Deliberately does NOT auto-create
# config.production.local.js - that tier is opt-in and has no consumer script on this branch.

cd "$(dirname "$0")" # Change directory to the folder containing this file (scripts/npm-run-scripts/prepare/)
cd ../../..          # Change directory to project's root folder

exampleFile='config/config.development.local.example.js'
localFile='config/config.development.local.js'

if [ -f "$localFile" ] || [ ! -f "$exampleFile" ]; then
    exit 0
fi

cp "$exampleFile" "$localFile"
echo "Created $localFile (git-ignored) from $exampleFile - customize it freely; git never sees it."
