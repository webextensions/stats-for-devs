# Frontend build

Applies to: new project, and template branches that customize the frontend baseline.

The `abstract-frontend-build` layer ships a working placeholder frontend (build + server) -
adapt it to your application:

- Update the values in [config/app-customizations.js](../../../config/app-customizations.js)
  (application name, development hostname, live origin,
  `PREFERRED_HOSTNAMES_FOR_LOCAL_DEVELOPMENT` - the entries listed first among the reachable URLs
  the server logs/notifies on startup) and, if needed, the port in
  [config/constants.js](../../../config/constants.js) and the `publicDirectory` names /
  `vite.configs` entries in the [config/](../../../config/) tiers. Edits meant for every developer
  go in the committed tiers / `*.local.example.js` files; machine-local tweaks go in your
  git-ignored `config/*.local.js` copy (auto-created from the example on `npm install`).
- Update the `<title>` (and theme-color) in
  [frontend/src/index.html](../../../frontend/src/index.html) and replace
  [frontend/src/favicon.ico](../../../frontend/src/favicon.ico).
- Replace the placeholder app under [frontend/src/App/](../../../frontend/src/App/) (it exists to
  exercise the build pipeline - React, CSS Modules, classnames, jotai, zustand) and its colocated
  test. The intended state split: jotai for UI state (Atom-suffixed atoms in
  `frontend/src/App/store/jotaiStore.ts`), zustand for app/domain state
  (`frontend/src/App/store/zustandStore.ts`). Remove the
  dependencies your app does not need from `package.json.ts` (then regenerate + `npm install`).
- Optional: enable the dev overlays by setting `application.frontEnd.showDevTools: true` in your
  development config tier.
