# Frontend Build

The frontend build architecture carried by the `abstract-frontend-build` branch (and everything
built on it). Like the rest of the docs, this is a pointer map to self-documenting sources of
truth - the `build:*` / `server:*` / `start:*` / `stylelint*` script comments in
[package.json.ts](../../package.json.ts) document each command.

## Build pipeline (Vite on Rolldown)

- Orchestrator: [frontend/build/build.ts](../../frontend/build/build.ts) - a CLI over Vite's JS
  API (`--watch`, `--dry-run`, `--bundle-index` / `--bundle-admin`, `--env config=...`) that captures Vite warnings
  and treats critical ones as build errors. `--dry-run` runs the full pipeline with
  `build.write: false` (nothing written, no desktop notifications) - that is the `build:dry-run`
  health check.
- Per-bundle config generation:
  [frontend/build/build-config-generator.ts](../../frontend/build/build-config-generator.ts) -
  CSS Modules, the React Compiler pass, vendor chunk splitting, output filename patterns, and the
  custom plugins under [frontend/build/plugins/](../../frontend/build/plugins/) (HTML bootstrap +
  static copy, CSS build sourcemaps, the `@scope` splitting workaround).
- Multi-bundle capable: the `vite.configs` array in the config layer lists the HTML entries to
  build (this branch configures only `['index.html']`; child branches add more, e.g. an admin
  bundle) and `--bundle-*` flags select among them. Note: the selection is not fully generic - a
  child branch adding a differently-named bundle also extends `filterConfigs` / `getConfigName` in
  `build.ts`.

## Config layering (config/)

Environment configs deep-merge (`extend`) over
[config/config.common.js](../../config/config.common.js):
`config.common.js` -> `config.development._.js` -> `config.development.local.js` (and the
`production` tiers alike). The `config/*.local.js` tiers are git-ignored machine-local files,
auto-created from their committed `*.local.example.js` siblings on `npm install` when missing
(via the `prepare` step `scripts/npm-run-scripts/prepare/ensure-local-config.sh`) - customize the
copy freely; git never sees it. The same
config file drives both the build
(`--env config="./config/config.development.local.js"`) and the server (`--config ...`); the
`vite` block holds build knobs (mode, `publicDirectory`, sourcemaps, output patterns), the
`server` block the Express settings, and `application.frontEnd` is inlined into `index.html` as
`window.frontEndConfig`.

Build output lands in the config-driven `publicDirectory` (`public-development-local`,
`public-production-live`, ...), which is git-ignored (`/public-*/`).

## Serving locally

- `node --run start` - the Express server
  ([backend/src/server/server.ts](../../backend/src/server/server.ts)) and the watch build run
  together (`concurrently`); the server serves the `publicDirectory` statically with an SPA
  fallback and cache headers tuned for the `ensure-freshness` / content-hash output patterns.
- `node --run start:app:use-hmr` - server only, with Vite mounted in middleware mode
  (`USE_HMR=yes`): on-the-fly transforms + hot module replacement, no separate build process.
- On startup the server logs every reachable URL (local IPs + `/etc/hosts` hostnames, via
  `local-ip-addresses-and-hostnames`, with `PREFERRED_HOSTNAMES_FOR_LOCAL_DEVELOPMENT` from
  [config/app-customizations.js](../../config/app-customizations.js) listed first); when
  `server.nonProductionDevTools.flagNotifyServerPathsOnLaunch` is enabled (development tiers) it
  also raises a desktop notification with the same list.

## Dev overlays

The vendored console-panel + stats.js files (see
[copy-files-from-to.cjson](../../copy-files-from-to.cjson), refreshed via
`node --run copy-files-from-to`) load only when `application.frontEnd.showDevTools` is enabled -
wiring in
[frontend/src/appUtils/devOverlays/loadDevOverlays.ts](../../frontend/src/appUtils/devOverlays/loadDevOverlays.ts).

## CSS linting

`node --run stylelint` (config: [stylelint.config.js](../../stylelint.config.js); vendored
third-party CSS is excluded via [.stylelintignore](../../.stylelintignore)). Staged/changed-file
variants mirror the `eslint:*` pairs. The frontend sources also get their own ESLint config
([frontend/src/eslint.config.js](../../frontend/src/eslint.config.js) - browser globals + React
rules; ESLint v10 applies the config file nearest to each linted file).

## Type checking

`frontend/` has its own [frontend/tsconfig.json](../../frontend/tsconfig.json) (jsx + `bundler`
module resolution) checked by `node --run test:types:frontend`; the root
[tsconfig.json](../../tsconfig.json) excludes `frontend/` and covers everything else (including
`backend/` and `config/`).
