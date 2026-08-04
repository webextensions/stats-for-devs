# Why the standalone widget bundles are extra tsdown passes (and their gotchas)

## What

The `template-widget` branch adds two script-tag/CDN artifacts to the library build:
`dist/widget.js` (unminified, development react) and `dist/widget.min.js` (minified, production
react) - IIFE bundles of [frontend/lib/src/widget/standalone.ts](../../frontend/lib/src/widget/standalone.ts)
with `react` / `react-dom` bundled in, defining `window.TemplateWidget` and never auto-mounting.
They are passes 2 and 3 of the config ARRAY in
[frontend/lib/tsdown.config.ts](../../frontend/lib/tsdown.config.ts) (pass 1 is the unchanged ESM
library build - see [react-template-build-tooling.md](./react-template-build-tooling.md) for why
tsdown at all).

## Why

- **Extra tsdown passes, not Vite library mode**: one toolchain for everything published. Vite
  stays the demo-harness/app bundler. tsdown natively covers what the standalone build needs:
  `format: 'iife'`, `globalName`, `deps.alwaysBundle` (react bundled in, with `deps.onlyBundle`
  as a loud allowlist), per-pass `minify`, and `define` for `process.env.NODE_ENV`.
- **Three passes, not one**: an IIFE needs a SINGLE entry per pass, and the twins differ in
  `minify` + the baked `NODE_ENV` value. Passes 2-3 set `clean: false` (tsdown's default `clean`
  would wipe the earlier passes' output) and `dts: false` (declarations are meaningless for an
  IIFE).
- **Two twins with NODE_ENV baked**: a plain browser page has no `process`, so the literal must
  be compiled away; `widget.js` keeps development react for readable debugging, `widget.min.js`
  is the production CDN target (the `unpkg` / `jsdelivr` fields in
  [package.json.ts](../../package.json.ts)).
- **The global defines twice, on purpose**: tsdown's `globalName` IIFE wrapper covers classic
  `<script src>` loads, and `standalone.ts` ALSO assigns `globalThis.TemplateWidget` explicitly -
  because the `"./widget.js"` exports subpath can be evaluated as a MODULE (a bundler side-effect
  import), where the wrapper's `var` stays module-scoped and would never reach `window`. This is
  also why the publint warning on those subpaths ("written in CJS, interpreted as ESM") is
  accepted: publint sniffs the IIFE shape, but module evaluation works via the explicit
  assignment. Script loading never auto-mounts (predictable on SPAs; consumers call
  `TemplateWidget.mount(...)` explicitly).
- **No JS CSS injection**: light-DOM consumers (ESM and script-tag alike) link/import
  `dist/style.css`; only shadow mounts carry styles, inside the shadow root. One CSS story per
  mode, no injected `<style>` surprises in the host page's `<head>`.

## The `?inline` raw-text gotcha

The shadow-DOM path needs a CSS Module's compiled text to apply inside the shadow root. Vite
inlines the COMPILED text for `*.module.css?inline`, but `@tsdown/css` (which builds the
published artifacts) deliberately skips CSS-module compilation for `?inline` ids and inlines the
RAW text - its selectors would not match the scoped class names the component renders.
[frontend/lib/src/widget/scopeCssModuleText.ts](../../frontend/lib/src/widget/scopeCssModuleText.ts)
bridges this at runtime: given the raw text and the class-name map (the module's ordinary
import), it rewrites `.local` selectors to `.scoped` - and degrades to a no-op under Vite, where
the text arrives already compiled. Do not "simplify" the dual import + rewrite away without
checking `@tsdown/css`'s `?inline` behavior first.

## Invariants

- Only pass 1 may `clean` `dist/` and emit declarations; passes 2-3 keep `clean: false` and
  `dts: false`.
- `GLOBAL_NAME` / `STANDALONE_BASENAME` in the tsdown config, the global property assigned in
  `standalone.ts`, and the `exports` / `unpkg` / `jsdelivr` paths in `package.json.ts` must stay
  in sync (fork checklist: [docs/init/CUSTOMIZE/CUSTOMIZE-widget.md](../init/CUSTOMIZE/CUSTOMIZE-widget.md)).
- `standalone.ts` stays out of the barrel (it is side-effectful; the barrel must remain
  tree-shakable) and is registered as a knip entry in [knip.config.ts](../../knip.config.ts).
- The standalone artifacts are listed in `sideEffects` in `package.json.ts` (they assign a
  global when evaluated).

## What would make this unnecessary

If `@tsdown/css` learns to compile CSS modules for `?inline` imports, `scopeCssModuleText` can
be deleted (the dual import alone would suffice). If tsdown ever supports multiple
formats/variants of one entry in a single pass with per-variant `define`/`minify`, the config
array could collapse.
