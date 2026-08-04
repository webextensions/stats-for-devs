# Widget identity and the standalone bundles

Applies to: new project (this branch's widget layer - see
[frontend/lib/README.md](../../../frontend/lib/README.md) for the layout it customizes).

The standalone script-tag/CDN identity is a set of names that must stay in sync. Rename them
together:

- `GLOBAL_NAME` (`TemplateWidget` -> your window global, e.g. `MyWidget`) and
  `STANDALONE_BASENAME` (`widget` -> your artifact basename) in
  [`./frontend/lib/tsdown.config.ts`](../../../frontend/lib/tsdown.config.ts) - the single home
  of the standalone build identity.
- The explicit global assignment (property name + comment) in
  [`./frontend/lib/src/widget/standalone.ts`](../../../frontend/lib/src/widget/standalone.ts) -
  it must match `GLOBAL_NAME` (it covers the artifact being evaluated as a module, where tsdown's
  IIFE wrapper cannot reach `window`).
- In [`./package.json.ts`](../../../package.json.ts) (then regenerate - see
  [CUSTOMIZE-package-json.md](./CUSTOMIZE-package-json.md)): the `"./widget.js"` /
  `"./widget.min.js"` exports subpaths, the `unpkg` / `jsdelivr` fields, and the `sideEffects`
  entries - all follow `STANDALONE_BASENAME`.
- The knip entry `frontend/lib/src/widget/standalone.ts` in
  [`./knip.config.ts`](../../../knip.config.ts) - only its path changes if you move/rename the
  file itself.
- Usage snippets in [`./README.md`](../../../README.md) (script-tag example, build-outputs
  table).

Behavior contracts the template ships (keep, adapt, or consciously drop):

- Loading the standalone script only DEFINES the global - it never auto-mounts. Overlay-style
  widgets that want one-line activation can add an `./auto` side-effect entry instead - recipe in
  [docs/specs/todo/TODO-for-template-widget.md](../../specs/todo/TODO-for-template-widget.md).
- Light-DOM mounts are styled by `dist/style.css` (linked/imported by the consumer - no JS CSS
  injection); shadow mounts carry their styles inside the shadow root.
- `ShadowDomHost` and `scopeCssModuleText` under
  [`./frontend/lib/src/widget/`](../../../frontend/lib/src/widget/) are reusable utilities -
  keep them and only replace what renders inside (the Greeting composition in
  `widget/mount.tsx`, including its `?inline` imports and the `widgetStyleSheets` list). Why the
  `scopeCssModuleText` rewrite exists:
  [docs/because/widget-standalone-build.md](../../because/widget-standalone-build.md).
