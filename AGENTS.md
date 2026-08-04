# AGENTS.md

Guidance for AI coding agents (Claude Code, Cursor, Codex, and others) working in this
repository. This is the agent-facing companion to [docs/README.md](docs/README.md):
that index is the human entry point to the development workflows, this file is the canonical agent
guide. It is plain markdown so every tool can read it directly. Claude Code reads it through the
`@AGENTS.md` import in [CLAUDE.md](CLAUDE.md); Cursor and Codex read this file natively at the
repo root.

This file is fork-owned (template merges keep your side), so it stays thin: the "Project overview"
section below is this branch's own content, and everything after it is one-line guardrails linking
to the shared homes that keep receiving template updates.

## Project overview

`stats-for-devs` - a floating, draggable dev HUD ("stats for nerds" style) showing live
viewport, breakpoint, responsiveness, mobile-input, performance and interaction metrics, plus
optional visual page aids. Forked from the `template-widget` template branch (npm packages
shipping an embeddable widget): `template-npm-package-for-react` (its full React-package layer -
`abstract-frontend-build`'s config-driven Vite (Rolldown) + React + TypeScript build under
`frontend/`, layered environment configs in `config/`, stylelint, a minimal Express server with
opt-in Vite HMR under `backend/src/server/`, plus `abstract-npm-package`'s publishable manifest
and publint) plus the widget layer on top. The package code lives under
[frontend/lib/](frontend/lib/) (see its [README](frontend/lib/README.md) for the layout): the
widget area `src/statsForDevs/` (overlay components, the 28-metric registry, trackers, settings,
visibility store, visual aids), the side-effect-free public barrel `src/index.ts` (named exports
only; `mountStatsForDevs`/`unmountStatsForDevs`, `StatsForDevsRoot`, the visibility store, the
window API installer, registry introspection, the settings model), the `src/auto.ts` side-effect
entry (the `./auto` export - importing it mounts), and `src/widget/standalone.ts` (own tsdown
entry, NOT in the barrel). tsdown (`node --run build:lib`, also the all-is-well `build:lib`
pre-step and `prepack`; config array in `frontend/lib/tsdown.config.ts`) builds the published
`dist/`: ESM bundles with react + the runtime deps externalized + bundled `index.d.ts` /
`auto.d.ts` + extracted `style.css`, plus the standalone script-tag IIFE twins `widget.js` /
`widget.min.js` (everything bundled in, `window.statsForDevs` from the config's `GLOBAL_NAME`,
styles self-injected, auto-mounts on DOMContentLoaded but renders nothing until shown; the
`unpkg` / `jsdelivr` targets - rationale and gotchas:
[docs/because/widget-standalone-build.md](docs/because/widget-standalone-build.md)). `react` / `react-dom`
are `peerDependencies`; `classnames` / `react-draggable` / `use-local-storage-state` are the
runtime `dependencies`; the demo harness's stack lives in the `dependenciesForApp` /
`dependenciesForServer` categories in `package.json.ts` (mapped to devDependencies via
`dependencyCategoriesMapping`).
Load-bearing invariants (details:
[docs/because/self-contained-decoupling.md](docs/because/self-contained-decoupling.md)): the public
surface consumers script against is stable - localStorage keys `statsForDevs.shown` /
`statsForDevs.settings`, the `?statsForDevs=yes` URL param, `#stats-for-devs-root`,
`#sfd-drag-handle`, the hash-free `sfd-` class prefix (kept identical across tsdown / Vite /
vitest via a shared `generateScopedName` - see the tsdown config header) and the
`window.statsForDevs` API; the overlay component is never re-exported from the barrel (it would
collapse the `React.lazy` boundary); no `import.meta.env` / `process.env` in library source
(host build info arrives via `mountStatsForDevs({ buildInfo })`); the barrel stays
side-effect-free and SSR-import-safe.
The library zone has its own STRICT `frontend/lib/tsconfig.json` (`test:types:lib`) and a nested
ESLint config re-exporting `frontend/src/eslint.config.js`; colocated `*.test.{ts,tsx}` tests
run in the single root Vitest suite (jsdom opted in per file via the `@vitest-environment jsdom`
pragma; jsdom lacks `ResizeObserver` / `PerformanceObserver` / `visualViewport`, so unit tests
stop at the mount/visibility/settings contracts and the overlay is smoke-tested via
[demo/demo.html](demo/demo.html), which works over `file://`).
The frontend app under `frontend/src/` is the development/demo harness - it renders the library
from source (in-tree `StatsForDevsRoot` + imperative self-mount) via
`frontend/src/App/LibraryDemo/LibraryDemo.tsx` and keeps building into the `public-*` folders.
Vision, branching tree, and the fork/merge model:
[docs/template-project/README.md](docs/template-project/README.md); the frontend build itself:
[docs/development/frontend-build.md](docs/development/frontend-build.md).

## Commands

- `node --run test` - run the full check suite before every commit.
- `node --run test:optimize-for-change` - change-aware suite for fast local iteration (git hooks
  always run the full `test`).
- `node --run start` - Express server + watch build together (`node --run start:app:use-hmr` for
  Vite middleware HMR instead).
- `node --run build:dry-run` - one-shot verification build, nothing written (what the
  `build:dry-run` health check runs).
- `node --run build:lib` - builds the publishable library into the git-ignored `dist/` (tsdown -
  config: [frontend/lib/tsdown.config.ts](frontend/lib/tsdown.config.ts)); also runs as the
  all-is-well `build:lib` pre-step and on `prepack`.
- `node --run housekeeping:generate-package-json` - regenerate `package.json` from
  `package.json.ts`.

The full command list and the health-check suite behind `test` are indexed in
[docs/README.md](docs/README.md).

## Source of truth: package.json.ts

- Never hand-edit `package.json` or `package-version.json` - edit
  [package.json.ts](package.json.ts), then regenerate with
  `node --run housekeeping:generate-package-json`.
- The `version` is owned by npm (`npm version`) - never hand-edit it (derivation detail: the
  header comment in `package.json.ts`).

Details: [.claude/rules/git-workflow.md](.claude/rules/git-workflow.md).

## Conventions

- ASCII punctuation only, in every file including markdown and commit messages:
  [.claude/rules/non-keyboard-characters.md](.claude/rules/non-keyboard-characters.md).
- Code style (ESM, 4-space indentation, semicolons, unix line endings, bash shebang):
  [.claude/rules/code-style.md](.claude/rules/code-style.md).
- Commits: clear, ASCII subjects - they become the `CHANGELOG.md` entries; never hand-edit
  `CHANGELOG.md`: [.claude/rules/git-workflow.md](.claude/rules/git-workflow.md).
- Fork-owned vs shared files (which files conflict on template merges - keep your side):
  [docs/template-project/file-conventions.md](docs/template-project/file-conventions.md).
- Tests: Vitest `*.test.js` files, colocated next to the source or grouped under [test/](test/):
  [.claude/rules/testing.md](.claude/rules/testing.md).

## Git and safety

- A human owns git state: never stage, unstage, commit, push, force-push, skip hooks with
  `--no-verify`, or run destructive `rm -rf` (two index-touching exceptions: `git mv` for
  intentional renames/moves, and `git add` of named resolved files to conclude a merge - the human
  still reviews before push).
- Details and enforcement: [.claude/rules/git-workflow.md](.claude/rules/git-workflow.md) and the
  deny list in [.claude/settings.json](.claude/settings.json).

## Template-sync workflow

- Common content flows in by merging the `template` branch: `node --run template:merge-to-main`;
  fork-owned files (e.g. `package.json.ts` identity) are expected to conflict - keep your side.
  Full workflow: [docs/template-project/template-sync.md](docs/template-project/template-sync.md).
- Inside this repo, base branches merge down into the higher-level template branches: the
  `/cmd-merge-base-branches` command runs the cascade (commits locally, never pushes).
  Details: [docs/template-project/template-sync.md](docs/template-project/template-sync.md).
