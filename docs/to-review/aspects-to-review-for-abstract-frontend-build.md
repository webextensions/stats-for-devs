# Aspects to Review - For `abstract-frontend-build`

Frontend-build-layer additions to the family-wide [aspects-to-review.md](./aspects-to-review.md)
(which is owned by the root `abstract-javascript-project` branch and flows into this branch by
merge). This file covers the concerns this branch introduces: the config-driven Vite (Rolldown) +
React + TypeScript build under `frontend/`, stylelint, and the minimal Express server under
`backend/src/server/`. Same conventions as the family-wide file: each item names a concern, not a
prescribed fix; the slug is the suggested filename for its eventual review report; items may be
aspirational; template lens applies (prefer generic changes, clean customization seams, minimal
merge conflicts on sync).

## Frontend Architecture & React Patterns

- `component-conventions.md` - Confirm component conventions (named exports, no `forwardRef`, `.ts` vs `.tsx`)
- `react-compiler-consistency.md` - Confirm the React Compiler (`babel-plugin-react-compiler`) is applied
  consistently across bundles

## Build System & Vite

- `vendors-chunk-splitting.md` - Review the single `vendors` chunk (`manualChunks`) vs finer splitting
- `bundle-analyzer.md` - Run a bundle analyzer over the built bundles
- `react-compiler-build-cost.md` - Measure React Compiler / Babel build cost
- `move-assets-to-body-plugin.md` - Review the inline `move-assets-to-body` plugin
  ([frontend/build/build-config-generator.ts](../../frontend/build/build-config-generator.ts))
- `empty-outdir-stale-assets.md` - Review `emptyOutDir: false` / stale-asset handling across sibling bundle outputs
- `custom-build-plugins.md` - Review the suite of custom build plugins (`AppBootstrapPlugin`,
  `CssBuildSourcemapsPlugin`, `SplitMultiClassAtScopePlugin`)
- `source-maps-shipping.md` - Reconsider shipping (obscured) source maps per config tier
- `build-config-generator.md` - Review the custom build-config indirection
  ([frontend/build/build-config-generator.ts](../../frontend/build/build-config-generator.ts))
- `suppressed-build-warnings.md` - Confirm suppressed build warnings (`IGNORABLE_WARNING_PATTERNS`) hide nothing real
- `build-time-dead-code.md` - Use build-time `define` constants for dead-code elimination
- `shared-chunk-reuse.md` - Review shared-chunk reuse across HTML entries (multi-bundle builds)

## Stylelint & CSS Quality

- `stylelint-autofix-ordering.md` - Review autofix-vs-gate ordering across the stylelint surfaces
  (health check, Stop hook)
- `banned-hsl-rule.md` - Review the banned `hsl()` / `hsla()` rule impact (`function-disallowed-list`)
- `css-modules-config-coverage.md` - Verify CSS-Modules config coverage (build, `typescript-plugin-css-modules`,
  stylelint)

## Developer Experience & HMR

- `per-bundle-vite-dev-servers.md` - Review the per-bundle Vite dev-server setup in HMR mode (shared HMR HTTP
  server, per-instance `optimizeDeps` caches)
- `dev-prod-serving-divergence.md` - Reduce dev (Vite middleware) vs prod (static `publicDirectory`) serving
  divergence
- `startup-ordering.md` - Review startup ordering of server vs watch build (`start:app` runs them concurrently)
- `start-build-script-pruning.md` - Prune and document the many start/build script variants
- `editor-soft-links.md` - Document the editor soft-links setup (`.vscode/soft-links/`)
- `debug-inspect-brk.md` - Document the debug (`inspect-brk`) script variants

## Node Runtime & Environment

- `graceful-shutdown.md` - Add graceful shutdown (close the HTTP listener and Vite dev servers on
  SIGTERM/SIGINT) - reviewed in [review-report/graceful-shutdown.md](./review-report/graceful-shutdown.md)

## Backend Architecture & Express

- `middleware-pipeline-ordering.md` - Document the middleware pipeline ordering (compression > static/Vite
  middleware > 404 fallback)
- `hmr-express-integration.md` - Review the HMR-in-Express integration (Vite middleware mode)

## Static Serving & Caching

- `asset-cache-windows.md` - Keep asset cache windows consistent (15-day hashed-asset window, the
  `ensure-freshness` pattern)
- `compression-threshold.md` - Review the `compression()` threshold and coverage
- `index-html-caching.md` - Review the index.html caching strategy (the production in-process cache needs a
  server restart after an in-place rebuild)
- `static-cache-headers.md` - Review static cache-header correctness

## Security (Headers, CSP)

- `content-security-policy.md` - Define and ship a real Content-Security-Policy
- `csp-unsafe-inline.md` - Reconcile the inline `frontEndConfig` bootstrap script with a strict CSP

## HTML Entry, SEO & Metadata

- `app-icon-favicon-set.md` - Provide a full app-icon/favicon set (`apple-touch-icon`, multiple sizes)
- `meta-theme-color.md` - Keep the hardcoded `<meta name="theme-color">` placeholder in sync with the app's real
  brand/header color (the index.html templating seam - `AppBootstrapPlugin` - runs at build time; tracking a
  per-user theme needs a runtime approach, which arrives with the theming layers)
- `robots-opengraph-canonical.md` - Add robots.txt, Open Graph, and canonical tags
- `spa-404-crawler.md` - Confirm SPA 404 crawler behavior (the 404 fallback serves the shell with status 404)
- `web-app-manifest.md` - Decide whether to ship a web app manifest (installability)

## Accessibility (a11y)

- `viewport-pinch-zoom.md` - Keep pinch-zoom enabled - guard against `maximum-scale` / `user-scalable=no`
  regressing into `frontend/src/**/*.html` (e.g. a health-check grep, or a warning in the `AppBootstrapPlugin`
  HTML transform)
- `jsx-a11y-plugin.md` - Evaluate adopting `eslint-plugin-jsx-a11y` for the frontend subtree (deliberately not
  loaded today)

## Configuration & Secrets Management

- `config-merge-precedence.md` - Document config-file merge/override precedence across the `config/` tiers
- `insecure-flags-shipping.md` - Ensure verbose/dev-tools flags cannot ship enabled (`showDevTools`,
  `server.verbose`)
- `secrets-frontend-build.md` - Ensure secrets never reach the frontend build (`frontEndConfig` injection)

## Testing & Coverage

- `react-component-tests.md` - Add React component / interaction tests
- `build-dry-run-not-test.md` - Don't treat `build:dry-run` as a behavioral test
