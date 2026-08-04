# Why tsdown (and not Vite library mode or tsc) builds this branch's library

## What

The `template-npm-package-for-react` branch builds its publishable `dist/` (ESM bundle + bundled
`index.d.ts` + extracted `style.css`) with [tsdown](https://tsdown.dev/) (see
[frontend/lib/tsdown.config.ts](../../frontend/lib/tsdown.config.ts), run by `node --run build:lib`),
while the demo app under `frontend/src/` is built by the family's config-driven Vite (Rolldown)
build ([frontend/build/](../../frontend/build/) -> `public-*/`) and the component tests run through
the single root Vitest config ([vitest.config.js](../../vitest.config.js); DOM-needing test files opt
into jsdom via the `@vitest-environment jsdom` pragma).

## Why

- An earlier WIP of this template (npm-package-template, branch `template-react-wip`, commit
  `83c719a`) used Vite library mode. That required a multi-pass build script plus a separate
  `tsc -p src/tsconfig.dts.json` declaration emit plus an AST-based post-pass rewriting the
  `.ts`/`.tsx` import extensions inside the emitted `.d.ts` files (TypeScript does not rewrite
  extensions in declaration output - issue #61037). tsdown replaces all of that with one command:
  its `rolldown-plugin-dts` bundles the declarations (no extension problem survives bundling),
  and `@tsdown/css` compiles the CSS Modules and extracts `dist/style.css`.
- tsdown externalizes every `dependencies` / `peerDependencies` entry by default, replacing the
  WIP's hand-rolled externalization logic for `react` / `react-dom`.
- Plain `tsc` emit (no bundler) was rejected because it cannot compile CSS Modules at all.
- The family's config-driven Vite build stays for what it is good at (the demo app; Vitest is
  Vite-based anyway), matching the ecosystem split "tsdown for libraries, Vite for apps". The
  demo consumes the library from SOURCE (`frontend/src/App/LibraryDemo/LibraryDemo.tsx` imports
  the barrel), so developing the library never needs a `build:lib` round-trip.

## Invariants

- tsdown's `exports`-field auto-generation must stay OFF: `package.json` is generated from
  [package.json.ts](../../package.json.ts) and guarded by the `pkg-json-sync` check; a tool writing
  into `package.json` would fight the generator.
- The `"."` entry in the `exports` map stays a plain string (with a top-level `types` field)
  because package-cjson alphabetizes generated keys - a `{ "types", "default" }` conditions
  object would be re-sorted to `default`-first and trip publint's types-condition-must-be-first.
- The `build:lib` health check runs as a sequential PRE-STEP in
  [scripts/health-checks/all-is-well.ts](../../scripts/health-checks/all-is-well.ts) and is never
  cached: `dist/` is git-ignored, so it is invisible to the checks-execution content hash, and
  `publint` needs the real artifacts in place before it runs.

## What would make this unnecessary

If the package ever stops shipping CSS and drops sourcemapped bundling needs, plain `tsc` emit
would suffice; if package-cjson ever preserves key order, the exports map could use proper
conditions objects.
