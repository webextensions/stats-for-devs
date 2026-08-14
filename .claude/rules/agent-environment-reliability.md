---
description: Recurring agent-shell environment failure modes - nvm/PATH resolution, native-addon ABI mismatches, watch-mode commands in bounded shells
---

# Agent Environment Reliability

Recurring failure modes from past agent sessions. Following this reduces retries, timeouts, and
"fixed in chat but not in reality" drift.

## Node.js resolution vs nvm on `PATH`

- In agent terminals, `nvm use` alone may not win: an IDE-provided `node` can sit earlier on `PATH`
  (symptom: `nvm use` prints the `.nvmrc` version, but `node --version` stays wrong). Treat
  `command -v node` + `node --version` as the source of truth, not `nvm current`.
- Fix by prepending the `.nvmrc` version's nvm `bin` directory to `PATH`, then `hash -r` - in the
  **same shell invocation** as the command that needs it. Agent tools often run each shell
  invocation separately; do not assume an `export PATH=...` from a prior command still applies.
- Subprocesses (`node --run test`, git hooks) spawn `node` via `PATH` too - a parent shell fixed
  interactively does not help them unless `PATH` is actually corrected.
- If `npm install` fails or the wrong Node runs scripts, fix `PATH` first - do not retry the
  install against a broken environment.

## Native addons after a Node version switch

- Native addons (compiled via `node-gyp` or prebuilds) are built against a specific Node ABI.
  Switching the active Node version without rebuilding crashes at require-time with an ABI
  mismatch (`NODE_MODULE_VERSION` error).
- Fix: with the `.nvmrc` Node active (verified as above), run `npm rebuild <package>` - or a clean
  `npm install` when other dependencies may also be stale.

## Vite dry-run and strict warnings

- The custom logger in [frontend/build/build.ts](../../frontend/build/build.ts) can treat
  Vite/Rolldown warnings as errors (e.g. the one-shot `node --run build:dry-run`). New toolchain
  messages may fail the build until added to `IGNORABLE_WARNING_PATTERNS` there or adjusted via
  Rolldown `checks` in
  [frontend/build/build-config-generator.ts](../../frontend/build/build-config-generator.ts).
- If `build:dry-run` exits `1` despite "built in Xs", read the warning line, not only Rollup's
  success banner.

## Paths ignored by Cursor (`.cursorignore`)

- If `Read` / `Write` cannot access a path (often under `temp/`, `.cache/`, or other directories
  listed in [.cursorignore](../../.cursorignore)), use the terminal to read or create the file, or
  ask to place the artifact outside ignored paths. Do not assume the file is missing when the
  editor tool is blocked.

## One-shot vs watch commands (timeouts)

- Watch-mode scripts do not exit - they are wrong for a bounded agent shell run unless explicitly
  backgrounded. For verification, prefer one-shot variants (dry-run / `--run` / `do-not-watch`
  style scripts) where they exist.
- Give long-running commands (`npm install`, full test suites) an adequate timeout - default short
  timeouts kill legitimate work; prefer scoped scripts first for faster feedback.
