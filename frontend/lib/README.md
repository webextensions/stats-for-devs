# frontend/lib/ - the publishable library

This directory holds the npm package this repository publishes: the stats-for-devs dev HUD (a
floating, draggable overlay of live viewport / breakpoint / performance / interaction metrics),
its colocated tests, and the library's build/type-check configs. Everything OUTSIDE it (the demo
app in [../src/](../src/), the Express server, the config-driven frontend build) is the
development/demo harness and never ships to consumers.

## Layout

```
frontend/lib/
    README.md            - this file
    tsconfig.json        - STRICT type-check zone for the library ("test:types:lib"); also read by tsdown for the .d.ts bundle
    tsdown.config.ts     - library build config array ("node --run build:lib" -> dist/ at the repo root);
                           also home of GLOBAL_NAME / STANDALONE_BASENAME (the standalone identity)
    src/
        index.ts         - public barrel + tsdown entry (the package's "." export); side-effect free, named exports only
        index.test.tsx   - public-surface wiring test
        auto.ts          - side-effect entry (the "./auto" export): importing it mounts the HUD
        eslint.config.js - nested ESLint config: re-exports ../../src/eslint.config.js (browser/React rules)
        statsForDevs/    - the widget area (near-flat; one dir per component-with-assets)
            StatsForDevs.tsx + .module.css         - the overlay panel (drag, resize, collapse, copy, thresholds)
            StatsForDevsSettings.tsx + .module.css - the in-overlay settings view (header gear)
            StatsForDevsRoot.tsx                   - show-gated root; owns the React.lazy boundary
            Sparkline/                             - inline SVG trend graph for numeric metrics
            icons/                                 - the seven icons as inline SVG components (Apache-2.0 path data)
            mount.tsx        - mountStatsForDevs()/unmountStatsForDevs() (self-mounting: own container + root)
            metrics.ts       - the 33-metric registry (7 groups) + setBuildInfo
            trackers.ts      - refcounted global listeners (pointer, scroll, touch, longtask, inspect mode)
            settings.ts      - settings shape, defaults, normalization, presets (pure)
            useSettings.ts   - localStorage-persisted settings hook ("statsForDevs.settings")
            useStatsSnapshot.ts - the rAF sampling loop + rolling histories
            viewportClamp.ts - pure drag-clamp geometry
            visibility.ts    - shown/hidden store ("statsForDevs.shown", "?statsForDevs=yes")
            visualAids.ts    - outline-all / tap-targets / crosshair / focus-highlight page aids
            windowApi.ts     - installs the window.statsForDevs console API
        widget/
            standalone.ts         - script-tag / CDN entry (own tsdown entry; NOT re-exported from the barrel)
            injectStyles.ts       - standalone-only CSS self-injection (imported solely by standalone.ts)
            scopeCssModuleText.ts - rewrites raw "?inline" CSS-module text to the compiled class names (see its header)
```

Future areas can join as `src/<area>/` siblings of `src/statsForDevs/` / `src/widget/` and be
re-exported from the same barrel.

## Build and checks

- `node --run build:lib` - tsdown runs the config array in [tsdown.config.ts](./tsdown.config.ts)
  into the git-ignored `dist/` at the repo root:
    - Library pass: ESM bundles (+ sourcemaps) of `src/index.ts` and `src/auto.ts` with `react` /
      `react-dom` (and the runtime `dependencies`) externalized, bundled `dist/index.d.ts` +
      `dist/auto.d.ts` (+ maps), and the compiled CSS Modules extracted to `dist/style.css` (the
      package's `./style.css` export). The overlay chunk stays behind the `React.lazy` boundary.
    - Standalone passes: `dist/widget.js` (unminified, development react) and
      `dist/widget.min.js` (minified, production react) - IIFE bundles of `src/widget/standalone.ts`
      with ALL runtime deps bundled in, defining `window.statsForDevs` (from the config's
      `GLOBAL_NAME`), self-injecting the widget styles and auto-mounting on `DOMContentLoaded`
      (the HUD renders nothing until shown).
  Runs automatically on `prepack` and as the `build:lib` pre-step of `node --run test` (publint
  validates the real artifacts). Why tsdown:
  [docs/because/react-template-build-tooling.md](../../docs/because/react-template-build-tooling.md); the
  standalone specifics (global-name mechanics, CSS self-injection, the `?inline` raw-text
  gotcha): [docs/because/widget-standalone-build.md](../../docs/because/widget-standalone-build.md).
- The widget's CSS-module class names are hash-free (`sfd-` + local name) - documented public
  API. The three pipelines that compile them (tsdown, the Vite demo harness, vitest) share the
  same naming config; see the header of [tsdown.config.ts](./tsdown.config.ts).
- `node --run test:types:lib` - strict type check of this zone via [tsconfig.json](./tsconfig.json)
  (the demo-app zone's [../tsconfig.json](../tsconfig.json) excludes `./lib` and stays relaxed).
- Tests are colocated `*.test.{ts,tsx}` files discovered by the single root Vitest suite; each
  DOM-needing file opts into jsdom via the `@vitest-environment jsdom` pragma (conventions:
  [.claude/rules/testing.md](../../.claude/rules/testing.md)). jsdom lacks `ResizeObserver` /
  `PerformanceObserver` / `visualViewport`, so the unit tests deliberately stop at the mount /
  visibility / settings contracts; the overlay itself is smoke-tested in a real browser via
  [demo/demo.html](../../demo/demo.html) and the dev harness (`node --run start`).
- Lint: [src/eslint.config.js](./src/eslint.config.js) re-exports the demo app's React config so
  the rules have one home; CSS is covered by the root `stylelint` script.

## Consuming the library

- Bundler consumers import the built `dist/` via the package name (and its stylesheet via
  `<package-name>/style.css`, or mount by import alone via `<package-name>/auto`); `react` /
  `react-dom` are `peerDependencies`. Script-tag / CDN consumers load `dist/widget.min.js` (the
  `unpkg` / `jsdelivr` manifest target; react bundled in, styles self-injected, auto-mounts) and
  drive it via `statsForDevs.show()` / `.hide()` / `.toggle()`. The manifest fields live in
  [package.json.ts](../../package.json.ts); usage snippets in the root [README.md](../../README.md).
- The demo app consumes the library from SOURCE
  ([../src/App/LibraryDemo/LibraryDemo.tsx](../src/App/LibraryDemo/LibraryDemo.tsx) imports
  [src/index.ts](./src/index.ts)) in both modes - in-tree `<StatsForDevsRoot />` and imperative
  self-mount - so `node --run start` shows library edits live, no `build:lib` round-trip needed.
- The tarball ships `dist/` plus `frontend/lib/src/` (so sourcemaps resolve) plus `demo/`; the
  colocated tests stay out via the `"!**/*.test.*"` negation in the `files` allowlist.
