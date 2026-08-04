# TODO - For `template-widget` template

> TODOs for the `template-widget` template branch itself (the embeddable-widget npm package
> template - see [docs/template-project/README.md](../../template-project/README.md)).
>
> Project-specific TODOs live in [TODO.md](./TODO.md).

* Add the deferred "Widget - Simple" flavor (vanilla JS/TS, no react - the console-panel shape):
  a parallel no-react area (e.g. `frontend/lib/src/widget-simple/` or a sibling layout) with its
  own standalone entry and tsdown IIFE pass (no `deps.alwaysBundle`, much smaller artifact), its
  own exports subpath(s), and docs. Deliberately deferred when the widget layer landed - the
  branching tree sanctions splitting into separate branches if combining the flavors gets
  unwieldy.
* Recipe for an `./auto` side-effect entry (deliberately dropped from this template): overlay
  -style forks that want one-line activation (`import '<package>/auto'`) add a small
  `frontend/lib/src/widget/auto.ts` that waits for DOM ready and mounts into a package-created
  container appended to `document.body` (the stats-for-devs shape), plus an `"./auto"` exports
  subpath, a `sideEffects` entry, a knip entry, and docs. Not shipped here because the in-flow
  Greeting stub has no sensible zero-config placement.
* Consider Vitest browser mode (Playwright Chromium) for the widget zone if a fork's widget
  outgrows jsdom: jsdom exercises only ShadowDomHost's `<style>`-fallback path (no constructable
  stylesheets); real-browser tests would assert `adoptedStyleSheets` and real CSS scoping. Costs
  a playwright devDependency + browser download in every test environment.
* Revisit [frontend/lib/src/widget/scopeCssModuleText.ts](../../../frontend/lib/src/widget/scopeCssModuleText.ts)
  when `@tsdown/css` learns to compile CSS modules for `?inline` imports - the helper (and its
  dual-import call site in `widget/mount.tsx`) can then be deleted (context:
  [docs/because/widget-standalone-build.md](../../because/widget-standalone-build.md)).
* Upstream candidates for `abstract-javascript-project` (then merge down), noted while porting
  from the npm-package-template reference repo: GitHub issue templates
  (`.github/ISSUE_TEMPLATE/bug_report.yml` / `feature_request.yml` / `config.yml`), a
  `.github/PULL_REQUEST_TEMPLATE.md`, and the `.vscode/` note that the VS Code (`wk-j.save-and-run`)
  and Cursor (`achilleshr.runonsave`) save-and-run extensions must not be installed together.
* The branching tree in [docs/template-project/README.md](../../template-project/README.md) still
  shows `template-widget` under `abstract-frontend-build`; the upstream re-parenting (under
  `template-npm-package-for-react`, with the three widget flavors) arrives from
  `abstract-javascript-project` by template merge - do not "fix" the shared doc on this branch.
