---
name: running-the-project
description: Use when asked to run, start, launch, serve, or demo this project, or to see a change working in the real app - on this branch there is no app to launch, so this skill says what "running" means here and what forks must replace.
---

# Running the Project

## This branch has no runnable app

`abstract-npm-package` is the shared base for the npm-package template branches: it layers the npm publishing baseline
on the `abstract-javascript-project` tooling and ships only a placeholder library entry point (`index.js`) - not an
app. There is no server, CLI, UI, or extension to start - do not invent a start command.

## What "running" means here

- `node --run test` - the full health-check suite, including `publint`, which proves the publishable manifest
  (`main` / `exports` / `files`) resolves. On this branch this is the closest thing to "running the project".
- `node --run test:optimize-for-change` - change-aware run for fast local iteration.
- The placeholder export is exercised by the Vitest suite (`test/index.test.js`) - there is nothing to "launch".
- Everything else executable is a documented `package.json` script (generated from `package.json.ts`, where each script
  carries a comment explaining it). Read that file rather than guessing.

If a task needs a first-time workstation setup, that is `node --run setup`.

## Descendant branches and forks: replace the section above

This file is branch-aware by design. A `template-` branch or a fork that gains a real runnable app REPLACES the two
sections above with its own launch instructions - commands, ports/URLs, prerequisites (database, env files, build
step), and how to tell it started successfully. Overwrite them; do not append a second "how to run" next to a stale
one that says there is nothing to run.

Keep this section itself, so the next branch down the family inherits the same instruction.
