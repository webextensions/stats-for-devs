# Why the standalone widget bundles are extra tsdown passes (and their gotchas)

## What

This branch ships two script-tag/CDN artifacts alongside the library build: `dist/widget.js`
(unminified, development react) and `dist/widget.min.js` (minified, production react) - IIFE
bundles of [frontend/lib/src/widget/standalone.ts](../../frontend/lib/src/widget/standalone.ts)
with ALL runtime deps bundled in (react, react-dom, react-draggable, ...), defining
`window.statsForDevs`, self-injecting the widget styles and auto-mounting on `DOMContentLoaded`
(the HUD renders nothing until shown). They are passes 2 and 3 of the config ARRAY in
[frontend/lib/tsdown.config.ts](../../frontend/lib/tsdown.config.ts) (pass 1 is the ESM library
build - see [react-template-build-tooling.md](./react-template-build-tooling.md) for why tsdown
at all).

## Why

- **Extra tsdown passes, not Vite library mode**: one toolchain for everything published. Vite
  stays the demo-harness/app bundler. tsdown natively covers what the standalone build needs:
  `format: 'iife'`, `globalName`, `deps.alwaysBundle` (everything bundled in, with
  `deps.onlyBundle` as a loud allowlist), per-pass `minify`, and `define` for `process.env`.
- **Three passes, not one**: an IIFE needs a SINGLE entry per pass, and the twins differ in
  `minify` + the baked `NODE_ENV` value. Passes 2-3 set `clean: false` (tsdown's default `clean`
  would wipe the earlier passes' output) and `dts: false` (declarations are meaningless for an
  IIFE). Pass 2-3 also set `outputOptions.codeSplitting: false` - an IIFE is a single file, so
  the `React.lazy` boundary inlines there (it survives in source because it still gates
  RENDERING, and the ESM pass keeps the real code split).
- **Two twins with `process.env` compiled away, twice over**: a plain browser page has no
  `process`. The specific `'process.env.NODE_ENV'` define lets react's `=== 'production'`
  branches constant-fold (without it the drop-in build measured ~120 kB gzip heavier); the bare
  `'process.env'` object define catches every OTHER key - `react-draggable` reads
  `process.env.DRAGGABLE_DEBUG`, which would otherwise throw at drag time. `widget.js` keeps
  development react for readable debugging, `widget.min.js` is the production CDN target (the
  `unpkg` / `jsdelivr` fields in [package.json.ts](../../package.json.ts)).
- **The global defines twice, on purpose - and the wrapper wins**: tsdown's `globalName` IIFE
  wrapper (`var statsForDevs = (function () { ... })()`) covers classic `<script src>` loads,
  and `standalone.ts` ALSO assigns `window.statsForDevs` explicitly - because the
  `"./widget.js"` exports subpath can be evaluated as a MODULE (a bundler side-effect import),
  where the wrapper's `var` stays module-scoped and would never reach `window`. The wrapper's
  assignment runs AFTER the module body and overwrites the explicit one with the module's export
  value - which is why `standalone.ts` must have a SINGLE default export that IS the full api
  object (named exports would make the global a namespace object instead). Both the explicit
  assignment and `installStatsForDevsWindowApi()` merge via `Object.assign`, so every evaluation
  order converges on the full api. This is also why the publint warning on those subpaths
  ("written in CJS, interpreted as ESM") is accepted: publint sniffs the IIFE shape, but module
  evaluation works via the explicit assignment.
- **The standalone twins self-inject their CSS** (a deliberate deviation from the template's
  no-injection model): the drop-in promise is ONE script tag, over `file://` too, so the
  compiled CSS ships inside the bundle and
  [frontend/lib/src/widget/injectStyles.ts](../../frontend/lib/src/widget/injectStyles.ts) writes
  one `<style data-stats-for-devs="1">` into `document.head` at evaluation. Any pre-existing
  `[data-stats-for-devs]` element wins (nothing is injected), so a strict-CSP consumer can
  hand-link `dist/style.css` with that attribute instead. The ESM library pass stays
  injection-free: bundler consumers import `<package>/style.css` (extracted `dist/style.css`).
  CSS-as-text-in-the-bundle is also the model a future shadow-DOM mount needs (a document-level
  stylesheet cannot pierce a shadow boundary; the injector would simply retarget).

## The `?inline` raw-text gotcha

The self-injection path needs a CSS Module's compiled text. Vite inlines the COMPILED text for
`*.module.css?inline`, but `@tsdown/css` (which builds the published artifacts) deliberately
skips CSS-module compilation for `?inline` ids and inlines the RAW text - its selectors would
not match the scoped class names the component renders.
[frontend/lib/src/widget/scopeCssModuleText.ts](../../frontend/lib/src/widget/scopeCssModuleText.ts)
bridges this at runtime: given the raw text and the class-name map (the module's ordinary
import), it rewrites `.local` selectors to `.scoped` - and degrades to a no-op under Vite, where
the text arrives already compiled. Do not "simplify" the dual import + rewrite away without
checking `@tsdown/css`'s `?inline` behavior first.

Related: the widget's scoped names are hash-free (`sfd-` + local name, via
`generateScopedName: 'sfd-[local]'`) because the `sfd-` class prefix is documented public API.
Every pipeline compiling these modules must produce identical names - the tsdown passes, the
Vite demo harness ([frontend/build/build-config-generator.ts](../../frontend/build/build-config-generator.ts))
and vitest ([vitest.config.js](../../vitest.config.js)).

## Invariants

- Only pass 1 may `clean` `dist/` and emit declarations; passes 2-3 keep `clean: false` and
  `dts: false`.
- `GLOBAL_NAME` / `STANDALONE_BASENAME` in the tsdown config, the global property assigned in
  `standalone.ts`, and the `exports` / `unpkg` / `jsdelivr` paths in `package.json.ts` must stay
  in sync (fork checklist: [docs/init/CUSTOMIZE/CUSTOMIZE-widget.md](../init/CUSTOMIZE/CUSTOMIZE-widget.md)).
- `standalone.ts` keeps a single default export - the full api object (see "the wrapper wins"
  above).
- `standalone.ts` stays out of the barrel (it is side-effectful; the barrel must remain
  tree-shakable) and is registered as a knip entry in [knip.config.ts](../../knip.config.ts), as is
  the `auto.ts` side-effect entry.
- The standalone artifacts and `dist/auto.js` are listed in `sideEffects` in `package.json.ts`
  (they assign a global / mount when evaluated).
- `injectStyles.ts` is imported ONLY by `standalone.ts` - the ESM graph must never reach it, and
  its `SHEETS` list must cover every `*.module.css` in the widget
  (frontend/lib/src/widget/standalone.test.ts asserts a known class from each sheet).

## What would make this unnecessary

If `@tsdown/css` learns to compile CSS modules for `?inline` imports, `scopeCssModuleText` can
be deleted (the dual import alone would suffice). If tsdown ever supports multiple
formats/variants of one entry in a single pass with per-variant `define`/`minify`, the config
array could collapse.
