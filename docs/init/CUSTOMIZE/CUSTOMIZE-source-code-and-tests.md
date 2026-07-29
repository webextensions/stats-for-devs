# Source code and tests

Applies to: new project, and template branches that introduce a layout.

This branch ships a working React library layout with a stub API under
[`./frontend/lib/`](../../../frontend/lib/) (see its [README](../../../frontend/lib/README.md)),
demoed by the frontend-family app under `frontend/src/`:

- [`./frontend/lib/src/index.ts`](../../../frontend/lib/src/index.ts) - the public barrel and the
  tsdown build entry (`main` / `types` / `exports` in `package.json.ts` point at its build output
  in `dist/` - see [`./frontend/lib/tsdown.config.ts`](../../../frontend/lib/tsdown.config.ts)).
  Named exports only.
- [`./frontend/lib/src/react/components/Greeting/`](../../../frontend/lib/src/react/components/Greeting/) -
  the stub component (`Greeting.tsx` + `Greeting.module.css` + colocated test, one PascalCase
  directory per component), composing the stub hook.
- [`./frontend/lib/src/react/hooks/useCounter/`](../../../frontend/lib/src/react/hooks/useCounter/) -
  the stub hook (+ colocated test).
- [`./frontend/lib/src/react/mount.tsx`](../../../frontend/lib/src/react/mount.tsx) - imperative
  `mount()`/`unmount()` helpers for non-React host pages. Drop them (and the `react-dom` peer
  dependency, if nothing else needs it) when your package does not want that surface.
- [`./frontend/lib/src/widget/`](../../../frontend/lib/src/widget/) - the widget layer:
  `ShadowDomHost` + `scopeCssModuleText` (reusable utilities meant to survive the stub
  replacement), `mount.tsx` (`mountInShadowDom` + `widgetStyleSheets` - the place where the stub
  Greeting is composed into the shadow mount), and `standalone.ts` (the script-tag entry) - see
  [CUSTOMIZE-widget.md](./CUSTOMIZE-widget.md).
- Colocated tests (`*.test.{ts,tsx}`, discovered by the single root
  [`./vitest.config.js`](../../../vitest.config.js); each DOM-needing file opts into jsdom via
  the `@vitest-environment jsdom` pragma).
- [`./frontend/src/App/LibraryDemo/LibraryDemo.tsx`](../../../frontend/src/App/LibraryDemo/LibraryDemo.tsx) -
  renders the stub API inside the demo app (`node --run start`) in all three modes (light DOM,
  shadow DOM, imperative mount), importing the library from source so the dev build / HMR sees
  library edits without a rebuild (customizing the demo app itself:
  [CUSTOMIZE-frontend-build.md](./CUSTOMIZE-frontend-build.md)).

Replace the stub API and its tests wholesale with your package's real components/hooks
(conventions: [testing.md](../../../.claude/rules/testing.md)); widen the
`frontend/lib/src/index.ts` re-exports as you add modules. The generic
[`./test/sanity.test.js`](../../../test/sanity.test.js) can stay or be removed.
