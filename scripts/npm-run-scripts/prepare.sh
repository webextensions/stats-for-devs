#!/usr/bin/env bash

# Entry point for the "prepare" npm script (runs on "npm install" / "npm ci"): executes the steps
# under scripts/npm-run-scripts/prepare/ (each step's header documents what and why), then installs
# the Git hooks in .husky/ via husky. "|| true" keeps installs working in environments where husky
# is unavailable (e.g. CI with --omit=dev).

cd "$(dirname "$0")" # Change directory to the folder containing this file (scripts/npm-run-scripts/)

./prepare/ensure-local-config.sh

cd ../.. # Change directory to project's root folder (husky expects to run from the repo root)
husky || true
