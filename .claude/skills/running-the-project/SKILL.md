---
name: running-the-project
description: Use when asked to run, start, launch, serve, or demo this project, or to see a change working in the real app - on this branch there is no app to launch, so this skill says what "running" means here and what forks must replace.
---

# Running the Project

## This branch has no runnable app

`abstract-javascript-project` is the root base branch of the template family: it carries the shared tooling baseline
(health checks, template-sync scripts, housekeeping) and ships no source code of its own. There is no server, CLI, UI,
or extension to start - do not invent a start command, and do not go looking for an entry point that does not exist.

## What "running" means here

- `node --run test` - the full health-check suite. On this branch this is the closest thing to "running the project":
  it is what proves the repo works.
- `node --run test:optimize-for-change` - change-aware run for fast local iteration.
- Everything else executable is a documented `package.json` script (generated from `package.json.ts`, where each script
  carries a comment explaining it). Read that file rather than guessing.

If a task needs a first-time workstation setup, that is `node --run setup`.

## Descendant branches and forks: replace the section above

This file is branch-aware by design. A `template-` branch or a fork that gains a real runnable app REPLACES the two
sections above with its own launch instructions - commands, ports/URLs, prerequisites (database, env files, build
step), and how to tell it started successfully. Overwrite them; do not append a second "how to run" next to a stale
one that says there is nothing to run.

Keep this section itself, so the next branch down the family inherits the same instruction.
