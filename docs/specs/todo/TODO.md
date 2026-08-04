# TODO

> TODOs for the stats-for-devs project (forked from the `template-widget` template branch).

* Done (2026-08-04): renamed the project identity from the template
  (`@webextensions/template-javascript-project` -> `stats-for-devs`); widget global is now
  `StatsForDevs`
* Done (2026-08-04): ported the real stats-for-devs functionality from the `wip` branch,
  replacing the template's stub API (`Greeting` / `useCounter`) - the dev HUD now lives under
  `frontend/lib/src/statsForDevs/`; the widget global was lowercased to `statsForDevs` (one name
  for the IIFE wrapper and the runtime-installed console API); the seven `@mui/icons-material`
  icons were inlined as local SVGs (dropping MUI + Emotion); the ported source was adapted to
  the lib zone's `strict: true`; real `description` / `keywords` landed in `package.json.ts`
* Before the first `npm publish`: confirm the unscoped npm name `stats-for-devs` is available on
  the registry

## Widget backlog (carried from the `wip` branch, roughly in value order)

* **A vanilla-JS build with no React.** The framework-agnostic extraction that
  [docs/because/self-contained-decoupling.md](../../because/self-contained-decoupling.md)
  describes: shed React, ReactDOM, `react-draggable`, `classnames` and `use-local-storage-state`
  so the drop-in bundle is a fraction of its current size. `react-draggable` is the easiest of
  those to drop - the overlay already hand-rolls an equivalent pointer-event resize interaction,
  and the drag clamp math in `frontend/lib/src/statsForDevs/viewportClamp.ts` is already pure
  and tested.
* **A screenshot in the README.** This is a visual tool; one image earns more than three
  paragraphs.
* **Publish the demo** and link it from the README (`raw.githack.com`, as `console-panel` does;
  [demo/README.md](../../../demo/README.md) already carries the link).
* **Validate scalar settings in `normalizeSettings`.** It spreads `...persisted`, so
  `updateRateHz`, `dockedCorner` and `inspectMode` are not checked against their unions - a
  hand-edited or downgraded localStorage value passes straight through. There is a test in
  `frontend/lib/src/statsForDevs/settings.test.ts` asserting the current behaviour; update it
  when this is fixed.
* **Make more of it configurable**: `container`, the URL param name, the storage-key prefix, the
  breakpoint table (currently the fixed Tailwind-style scale), the overlay z-index, and
  registering custom metrics.
* **A browser smoke test.** The unit tests deliberately stop at the mount contract, because
  jsdom has no `ResizeObserver`, `PerformanceObserver` or `visualViewport` and the test would be
  a stub farm. Playwright against `demo/demo.html` is the right tool, and would cover drag,
  resize, collapse, the settings view and the visual aids.
* **Shadow DOM for real style isolation** (detailed plan). The HUD renders into a plain
  light-DOM `<div id="stats-for-devs-root">` today; a shadow-root mount would give real style
  isolation (the CSS as an `adoptedStyleSheets` constructed sheet). Two runtime blockers, both
  removed by the vanilla-JS/no-`react-draggable` work above:
    * the drag clamp's `document.getElementById('sfd-drag-handle')` lookup in
      `frontend/lib/src/statsForDevs/StatsForDevs.tsx` (a ref would work in a shadow root);
    * `react-draggable`'s `handle="#sfd-drag-handle"` selector, which resolves against
      `ownerDocument` and cannot see into a shadow root.
  The groundwork is already in place: the standalone build carries its CSS as text inside the
  bundle (see [docs/because/widget-standalone-build.md](../../because/widget-standalone-build.md)),
  which is exactly the form a shadow root needs - the injector would retarget from
  `document.head` to the shadow root.
  **Template-family coordination** (see
  [docs/template-project/README.md](../../template-project/README.md)): this port deleted the
  `template-widget` shadow utilities (`ShadowDomHost`, `mountInShadowDom` / `widgetStyleSheets`,
  `shadow-reset.css`) because the HUD cannot use them yet - only `scopeCssModuleText` survived
  (the standalone CSS injection needs it). When shadow capability lands here, either:
    * restore/re-adopt those utilities from the `template` branch history (they keep evolving
      upstream in `template-widget`, so future template merges will keep offering them - the
      deletion is a fork-owned divergence that merges cleanly as "keep our side"); or
    * if the shadow-capable HUD shape proves generally useful, evolve `template-widget` (or an
      `abstract-*` base) upstream so future widget forks start shadow-capable, minimizing this
      fork's divergence instead of growing it.
* **Port `demo-esm.html`** from the `wip` branch: an ESM demo page importing `dist/index.js`.
  Unlike `wip`'s self-contained ESM build, this branch's `.` export keeps react external, so the
  page needs an import map (or a tiny bundling step) that supplies `react` / `react-dom` - and,
  unlike `demo/demo.html`, a static server (ES modules do not load over `file://`). Wire it into
  [demo/README.md](../../../demo/README.md) when it lands.
* **Trim the published tarball.** It is mostly sourcemaps (the drop-in bundle's map alone is
  over 1 MB). Useful when debugging the HUD itself, but worth revisiting - perhaps ship maps
  only for the ESM build.
