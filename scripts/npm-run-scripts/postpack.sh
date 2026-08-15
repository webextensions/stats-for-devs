#!/usr/bin/env bash

cd "$(dirname "$0")/../.." # Change directory to the project's root folder

# Restores package.json (and package-version.json) from the source of truth (package.json.ts) after
# the paired "prepack" script (./prepack.sh) stripped dev-only install-family scripts for the
# tarball. Wired as the "postpack" script in package.json.ts. If a pack aborts before this runs, the
# stripped package.json stays on disk and the "pkg-json-sync" health check fails loudly - the fix is
# this same regeneration: "node --run housekeeping:generate-package-json". The "postpublish" script
# re-runs that regeneration after every "npm publish" upload as a safety net for a lost restore
# (see docs/because/np-publish-stripped-manifest-recovery.md).
./scripts/housekeeping/generate-package-json.sh
