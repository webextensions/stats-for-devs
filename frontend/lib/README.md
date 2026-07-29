# frontend/lib/ - the publishable library

This directory holds the npm package this repository publishes: the React component(s) and
hook(s), their colocated tests, and the library's build/type-check configs. Everything OUTSIDE it
(the demo app in [../src/](../src/), the Express server, the config-driven frontend build) is the
development/demo harness and never ships to consumers.

## Layout

```
frontend/lib/
    README.md            - this file
    tsconfig.json        - STRICT type-check zone for the library ("test:types:lib"); also read by tsdown for the .d.ts bundle
    tsdown.config.ts     - library build config ("node --run build:lib" -> dist/ at the repo root)
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
```

Future non-React areas can join as `src/<area>/` siblings of `src/react/` and be re-exported from
the same barrel.

## Build and checks

- `node --run build:lib` - tsdown bundles `src/index.ts` into the git-ignored `dist/` at the repo
  root: ESM bundle (+ sourcemap) with `react` / `react-dom` externalized, bundled `dist/index.d.ts`
  (+ map), and the compiled CSS Modules extracted to `dist/style.css` (the package's
  `./style.css` export). Runs automatically on `prepack` and as the `build:lib` pre-step of
  `node --run test` (publint validates the real artifacts). Why tsdown:
  [because/react-template-build-tooling.md](../../because/react-template-build-tooling.md).
- `node --run test:types:lib` - strict type check of this zone via [tsconfig.json](./tsconfig.json)
  (the demo-app zone's [../tsconfig.json](../tsconfig.json) excludes `./lib` and stays relaxed).
- Tests are colocated `*.test.{ts,tsx}` files discovered by the single root Vitest suite; each
  DOM-needing file opts into jsdom via the `@vitest-environment jsdom` pragma (conventions:
  [.claude/rules/testing.md](../../.claude/rules/testing.md)).
- Lint: [src/eslint.config.js](./src/eslint.config.js) re-exports the demo app's React config so
  the rules have one home; CSS is covered by the root `stylelint` script.

## Consuming the library

- Published consumers import the built `dist/` via the package name (and its stylesheet via
  `<package-name>/style.css`); `react` / `react-dom` are `peerDependencies`. The manifest fields
  live in [package.json.ts](../../package.json.ts).
- The demo app consumes the library from SOURCE
  ([../src/App/LibraryDemo/LibraryDemo.tsx](../src/App/LibraryDemo/LibraryDemo.tsx) imports
  [src/index.ts](./src/index.ts)), so `node --run start` shows library edits live - no
  `build:lib` round-trip needed.
- The tarball ships `dist/` plus `frontend/lib/src/` (so sourcemaps resolve); the colocated tests
  stay out via the `"!**/*.test.*"` negation in the `files` allowlist.

## Replacing the stub

`Greeting` / `useCounter` / `mount` are a stub API demonstrating a component and a hook working
together. Replace them (and their tests) with your package's real components/hooks and widen the
[src/index.ts](./src/index.ts) re-exports as you add modules - see
[docs/init/CUSTOMIZE/CUSTOMIZE-source-code-and-tests.md](../../docs/init/CUSTOMIZE/CUSTOMIZE-source-code-and-tests.md).
