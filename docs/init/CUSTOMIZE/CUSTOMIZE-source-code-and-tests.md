# Source code and tests

Applies to: new project, and template branches that introduce a layout.

This branch ships the stats-for-devs library layout under
[`./frontend/lib/`](../../../frontend/lib/) (see its [README](../../../frontend/lib/README.md) for
the full tree; the template's stub API was already replaced by the real widget), demoed by the
frontend-family app under `frontend/src/`:

- [`./frontend/lib/src/index.ts`](../../../frontend/lib/src/index.ts) - the public barrel and the
  tsdown build entry (`main` / `types` / `exports` in `package.json.ts` point at its build output
  in `dist/` - see [`./frontend/lib/tsdown.config.ts`](../../../frontend/lib/tsdown.config.ts)).
  Named exports only.
- [`./frontend/lib/src/statsForDevs/`](../../../frontend/lib/src/statsForDevs/) - the widget
  area: overlay components (one PascalCase directory per component-with-assets, e.g.
  `Sparkline/`), hooks, and the framework-free logic modules, with colocated tests.
- [`./frontend/lib/src/widget/`](../../../frontend/lib/src/widget/) - the standalone script-tag
  layer: `standalone.ts` (the IIFE entry), `injectStyles.ts` and `scopeCssModuleText.ts` - see
  [CUSTOMIZE-widget.md](./CUSTOMIZE-widget.md).
- Colocated tests (`*.test.{ts,tsx}`, discovered by the single root
  [`./vitest.config.js`](../../../vitest.config.js); each DOM-needing file opts into jsdom via
  the `@vitest-environment jsdom` pragma).
- [`./frontend/src/App/LibraryDemo/LibraryDemo.tsx`](../../../frontend/src/App/LibraryDemo/LibraryDemo.tsx) -
  renders the library inside the demo app (`node --run start`) in both modes (in-tree component,
  imperative self-mount), importing the library from source so the dev build / HMR sees
  library edits without a rebuild (customizing the demo app itself:
  [CUSTOMIZE-frontend-build.md](./CUSTOMIZE-frontend-build.md)).

Forks replacing this API with their own: replace the area and its tests wholesale (conventions:
[testing.md](../../../.claude/rules/testing.md)); widen the `frontend/lib/src/index.ts`
re-exports as you add modules. The generic
[`./test/sanity.test.js`](../../../test/sanity.test.js) can stay or be removed.
