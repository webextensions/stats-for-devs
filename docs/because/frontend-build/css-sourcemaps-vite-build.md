# CSS sourcemaps in the Vite production build

## Why this exists

`build.sourcemap` drives JavaScript output maps as expected, but extracted CSS assets did not always get a usable `sourceMappingURL` / sibling `.map` in our pipeline (PostCSS, CSS Modules, `cssMinify: esbuild`, and the `SplitMultiClassAtScopePlugin` workaround). Browsers then could not jump from bundled rules back to author `.css` / `.module.css` files.

## What we do

- **`css.devSourcemap`** - Enabled when the resolved `vite.cssSourcemap` option is not `false` (defaults to mirroring `vite.sourcemap`). This keeps per-module maps flowing through the CSS transform chain.

- **`SplitMultiClassAtScopePlugin`** - When it rewrites `@scope`, it runs PostCSS `process()` with `map` options instead of returning `map: null`, so the chain is not broken for those files.

- **`CssBuildSourcemapsPlugin`** - After `vite:css`, it records each CSS module's transformed source plus `getCombinedSourcemap()`. In `generateBundle`, it merges those maps into one map per emitted `.css` file (line offsets match concatenation order from chunk metadata), using `@jridgewell/gen-mapping` and `@jridgewell/trace-mapping`.

## Configuration

In each environment's Vite block, optional **`cssSourcemap`** uses the same values as **`sourcemap`** (`false` / `'inline'` / `'source-map'` / `'hidden'`). When omitted, it mirrors **`sourcemap`**.

## Risks and follow-ups

- Plugin order and Vite internals (`viteMetadata.importedCss`, `getCombinedSourcemap`) could change in a major Vite upgrade; re-verify CSS DevTools after upgrades.
- Mappings through the `@scope` splitter are best-effort; upstream fixes for CSS Modules + `@scope` may allow dropping the splitter and simplifying maps.
- If DevTools show duplicate or wrong `sourceMappingURL` values, consider a small normalization pass rather than growing the merge plugin.
- The merge assumes the emitted `.css` asset is the plain concatenation of the captured
  post-`vite:css` module outputs. Combining `cssSourcemap` with `useMinimize` (where
  `cssMinify: 'esbuild'` rewrites the asset afterwards) therefore produces misaligned mappings -
  the shipped configs never combine them (production uses `sourcemap: false`); keep it that way or
  fix the merge first.
- Line offsets count newlines in each captured module output; a module output not ending in a
  newline would shift the mappings of all subsequent modules in the same asset.
- A chunk with multiple `importedCss` entries attributes all of its CSS module ids to each of those
  assets; with the current single-entry + vendors chunking this does not occur.

## Related files

- `frontend/build/build-config-generator.ts`
- `frontend/build/plugins/CssBuildSourcemapsPlugin/CssBuildSourcemapsPlugin.ts`
- `frontend/build/plugins/SplitMultiClassAtScopePlugin/SplitMultiClassAtScopePlugin.ts`
