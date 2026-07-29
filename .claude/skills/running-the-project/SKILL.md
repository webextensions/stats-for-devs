---
name: running-the-project
description: Use when asked to run, start, launch, serve, or demo this project, or to see a change working in the real app - covers this branch's start commands, port/URL, prerequisites, and the startup success signal for the Express server + Vite frontend build.
---

# Running the Project

## Running this branch

- `node --run start` - the Express server ([backend/src/server/server.ts](../../../backend/src/server/server.ts)) and
  the watch build ([frontend/build/build.ts](../../../frontend/build/build.ts)) run together, driven by
  `config/config.development.local.js`.
- `node --run start:app:use-hmr` - server only, with Vite in middleware mode (`USE_HMR=yes`): on-the-fly transforms +
  hot module replacement, no separate build process.
- Open http://localhost:3000/ (`PORT_NUMBER_HTTP` in [config/constants.js](../../../config/constants.js); there is no
  PORT env var).
- It started successfully when the log shows `Server (HTTP) is available at:` (or
  `Server (HTTP + Vite HMR) is available at:`) followed by the reachable URLs; a busy port prints
  `Error: Port 3000 is already in use (configured via server.access.url.http.port).`
- `node --run build:dry-run` - one-shot verification build, nothing written.

## Prerequisites

- `npm install` - its `prepare` step auto-creates the git-ignored `config/config.development.local.js` from its
  committed example, so a fresh clone runs with zero manual configuration.
- First-time workstation setup: `node --run setup`.

## Descendant branches and forks: replace the section above

This file is branch-aware by design. A `template-` branch or a fork whose run story differs from the above REPLACES
the two sections above with its own launch instructions - commands, ports/URLs, prerequisites (database, env files,
build step), and how to tell it started successfully. Overwrite them; do not append a second "how to run" next to a
stale one.

Keep this section itself, so the next branch down the family inherits the same instruction.
