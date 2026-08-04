# frontend/lib/ - the publishable library

This directory holds the npm package this repository publishes: the React component(s) and
hook(s), the widget layer (shadow-DOM support and the standalone script-tag entry), their
colocated tests, and the library's build/type-check configs. Everything OUTSIDE it (the demo app
in [../src/](../src/), the Express server, the config-driven frontend build) is the
development/demo harness and never ships to consumers.

## Layout

```
frontend/lib/
    README.md            - this file
    tsconfig.json        - STRICT type-check zone for the library ("test:types:lib"); also read by tsdown for the .d.ts bundle
    tsdown.config.ts     - library build config array ("node --run build:lib" -> dist/ at the repo root);
                           also home of GLOBAL_NAME / STANDALONE_BASENAME (the standalone identity)
    src/
        index.ts         - public barrel + tsdown entry (the package's "." export); named exports only
        index.test.tsx   - public-surface wiring test
        eslint.config.js - nested ESLint config: re-exports ../../src/eslint.config.js (browser/React rules)
        react/
            mount.tsx    - imperative mount()/unmount() helpers for non-React host pages
            components/
                Greeting/    - one PascalCase directory per component (.tsx + .module.css + test)
            hooks/
                useCounter/  - one directory per hook (.ts + test)
        widget/
            ShadowDomHost.tsx     - reusable shadow-root host component (adoptedStyleSheets + <style> fallback + portal)
            shadow-reset.css      - ":host { all: initial }" baseline, imported only as "?inline" text
            mount.tsx             - mountInShadowDom() + widgetStyleSheets (composes ShadowDomHost + Greeting)
            scopeCssModuleText.ts - rewrites raw "?inline" CSS-module text to the compiled class names (see its header)
            standalone.ts         - script-tag / CDN entry (own tsdown entry; NOT re-exported from the barrel)
```

Future areas can join as `src/<area>/` siblings of `src/react/` / `src/widget/` and be
re-exported from the same barrel.

## Build and checks

- `node --run build:lib` - tsdown runs the config array in [tsdown.config.ts](./tsdown.config.ts)
  into the git-ignored `dist/` at the repo root:
    - Library pass: ESM bundle (+ sourcemap) of `src/index.ts` with `react` / `react-dom`
      externalized, bundled `dist/index.d.ts` (+ map), and the compiled CSS Modules extracted to
      `dist/style.css` (the package's `./style.css` export).
    - Standalone passes: `dist/widget.js` (unminified, development react) and
      `dist/widget.min.js` (minified, production react) - IIFE bundles of `src/widget/standalone.ts`
      with react bundled in, defining `window.StatsForDevs` (from the config's `GLOBAL_NAME`)
      and never auto-mounting.
  Runs automatically on `prepack` and as the `build:lib` pre-step of `node --run test` (publint
  validates the real artifacts). Why tsdown:
  [docs/because/react-template-build-tooling.md](../../docs/because/react-template-build-tooling.md); the
  standalone/shadow specifics (incl. the `?inline` raw-text gotcha):
  [docs/because/widget-standalone-build.md](../../docs/because/widget-standalone-build.md).
- `node --run test:types:lib` - strict type check of this zone via [tsconfig.json](./tsconfig.json)
  (the demo-app zone's [../tsconfig.json](../tsconfig.json) excludes `./lib` and stays relaxed).
- Tests are colocated `*.test.{ts,tsx}` files discovered by the single root Vitest suite; each
  DOM-needing file opts into jsdom via the `@vitest-environment jsdom` pragma (conventions:
  [.claude/rules/testing.md](../../.claude/rules/testing.md)). jsdom lacks constructable
  stylesheets, so the ShadowDomHost tests exercise its `<style>`-fallback path; the built IIFE
  is smoke-testable manually (see "Consuming the library" below).
- Lint: [src/eslint.config.js](./src/eslint.config.js) re-exports the demo app's React config so
  the rules have one home; CSS is covered by the root `stylelint` script.

## Consuming the library

- Bundler consumers import the built `dist/` via the package name (and its stylesheet via
  `<package-name>/style.css`); `react` / `react-dom` are `peerDependencies`. Script-tag / CDN
  consumers load `dist/widget.min.js` (the `unpkg` / `jsdelivr` manifest target; react bundled
  in) and call `StatsForDevs.mount(...)` / `StatsForDevs.mountInShadowDom(...)` - shadow
  mounts carry their styles inside the shadow root, light mounts still need the `style.css`
  link. The manifest fields live in [package.json.ts](../../package.json.ts); usage snippets in
  the root [README.md](../../README.md).
- The demo app consumes the library from SOURCE
  ([../src/App/LibraryDemo/LibraryDemo.tsx](../src/App/LibraryDemo/LibraryDemo.tsx) imports
  [src/index.ts](./src/index.ts)) in all three modes - light, shadow, imperative - so
  `node --run start` shows library edits live, no `build:lib` round-trip needed.
- The tarball ships `dist/` plus `frontend/lib/src/` (so sourcemaps resolve); the colocated tests
  stay out via the `"!**/*.test.*"` negation in the `files` allowlist.

## Replacing the stub

`Greeting` / `useCounter` / `mount` / `mountInShadowDom` are a stub API demonstrating a
component, a hook, and the widget mounts working together. Replace them (and their tests) with
your package's real widget and widen the [src/index.ts](./src/index.ts) re-exports as you add
modules; `ShadowDomHost` and `scopeCssModuleText` are reusable utilities meant to survive the
replacement - see
[docs/init/CUSTOMIZE/CUSTOMIZE-source-code-and-tests.md](../../docs/init/CUSTOMIZE/CUSTOMIZE-source-code-and-tests.md)
and [docs/init/CUSTOMIZE/CUSTOMIZE-widget.md](../../docs/init/CUSTOMIZE/CUSTOMIZE-widget.md).
