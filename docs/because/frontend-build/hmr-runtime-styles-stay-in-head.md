# HMR-mode runtime styles stay in `<head>`

## Why this exists

In the production build, a post plugin in `frontend/build/build-config-generator.ts`
(`move-assets-to-body`) relocates Vite-injected `<script>`/`<link>` tags to the end of `<body>`. In
HMR mode (`node --run start:app:use-hmr`), Vite's client instead injects CSS into `<head>` at
runtime (`document.head.appendChild(<style>)`), so `transformIndexHtml` cannot see or move those
nodes - the dev page's stylesheet position differs from production.

## The decision

A companion dev-only plugin was tried: it injected an inline `MutationObserver` script that moved
runtime `<style>`/`<link rel="stylesheet">` nodes from `<head>` to `<body>` to mirror the
production layout. It was removed because:

- Relocating nodes that React/Vite still hold references to caused client-side errors in HMR mode
  (e.g. `Failed to execute 'insertBefore' on 'Node': The node before which the new node is to be
  inserted is not a child of this node.` when opening overlay menus).
- Fixing any dev-vs-production styling differences via CSS specificity is more stable and reliable
  than relocating DOM nodes at runtime.

So: if a style behaves differently between HMR mode and the production build because of stylesheet
order, fix it in the CSS (specificity), not by moving nodes.

## Related files

- `frontend/build/build-config-generator.ts` (the `move-assets-to-body` plugin and the NOTE
  pointing here)
