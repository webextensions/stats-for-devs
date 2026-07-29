# template-javascript-project

[![CI](https://github.com/webextensions/template-javascript-project/actions/workflows/ci.yml/badge.svg)](https://github.com/webextensions/template-javascript-project/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

This is the **`template-widget`** branch - the template for npm packages shipping an embeddable
widget, building on `template-npm-package-for-react` in this repository's template family. On top
of that branch's React-package layer (the publishable library under
[frontend/lib/](./frontend/lib/) - a stub `Greeting` component composing a stub `useCounter` hook
plus imperative `mount()`/`unmount()` helpers, built by tsdown into the published `dist/`, with
the config-driven Vite (Rolldown) + React + TypeScript demo harness under `frontend/`) it adds
the widget layer: standalone script-tag/CDN bundles (`dist/widget.js` / `dist/widget.min.js` -
IIFE, `react` bundled in, reachable via the `unpkg` / `jsdelivr` manifest fields), and opt-in
Shadow DOM isolation via a reusable `ShadowDomHost` component and a `mountInShadowDom()` twin of
`mount()` (constructable stylesheets with a `<style>` fallback, `:host { all: initial }` reset).
Loading the standalone script only defines the `TemplateWidget` global - it never auto-mounts.
Forks replace the stub API with their real widget. Fork from this branch to start a widget npm
package (a vanilla, no-React "Widget - Simple" flavor is deferred - see
[docs/specs/todo/TODO-for-template-widget.md](./docs/specs/todo/TODO-for-template-widget.md)).

## Usage

In a React app (replace the stub API with your package's real one):

```jsx
import { Greeting, useCounter } from '@webextensions/template-javascript-project';
import '@webextensions/template-javascript-project/style.css';

<Greeting name="Ada" />; // Renders: "Hello, Ada!" plus a counter button
```

In a non-React host page with a bundler, via the imperative helpers (`react` / `react-dom` still
come from your project - they are `peerDependencies`):

```js
import { mount, unmount } from '@webextensions/template-javascript-project';

mount(document.getElementById('app'), { name: 'Ada' });
```

On any web page via a script tag / CDN - no build step, no npm install (`react` is bundled into
the standalone artifact):

```html
<link rel="stylesheet" href="https://unpkg.com/@webextensions/template-javascript-project/dist/style.css" />
<script src="https://unpkg.com/@webextensions/template-javascript-project"></script>
<script>
    TemplateWidget.mount(document.getElementById('app'), { name: 'Ada' });
</script>
```

Isolated from the host page's CSS via Shadow DOM (no stylesheet link needed - the shadow mount
carries its styles inside the shadow root):

```js
TemplateWidget.mountInShadowDom(document.getElementById('app'), { name: 'Ada' });
```

Or, inside your own React tree:

```jsx
import { Greeting, ShadowDomHost, widgetStyleSheets } from '@webextensions/template-javascript-project';

<ShadowDomHost styleSheets={widgetStyleSheets}>
    <Greeting name="Ada" />
</ShadowDomHost>;
```

### Build outputs

| Artifact | Format | `react` | For |
| --- | --- | --- | --- |
| `dist/index.js` (+ `index.d.ts`) | ESM | external (peer) | Bundler consumers (the `.` export) |
| `dist/style.css` | CSS | - | Light-DOM styling (`./style.css` export; shadow mounts do not need it) |
| `dist/widget.js` | IIFE | bundled (development) | Script-tag debugging (readable, unminified) |
| `dist/widget.min.js` | IIFE | bundled (production) | Script-tag / CDN use (the `unpkg` / `jsdelivr` target) |

Locally: `node --run start` serves the demo app ([frontend/src/](./frontend/src/), which renders
the library from source in all three modes - light, shadow, imperative) and `node --run build:lib`
emits the publishable `dist/` (git-ignored; built fresh by `prepack` for every tarball).

> The library source lives in [frontend/lib/src/](./frontend/lib/src/) and ships in the tarball
> alongside `dist/` (so sourcemaps resolve); the colocated `*.test.{ts,tsx}` tests stay out of it
> via the `"!**/*.test.*"` negation in the `files` allowlist.

## Where to look

- **Vision and the git branching tree** -
  [docs/template-project/README.md](./docs/template-project/README.md)
- **Documentation index (commands, health checks, releases, template sync)** -
  [docs/README.md](./docs/README.md)
- **Customizing a new template/project forked from this branch** -
  [docs/init/CUSTOMIZE/README.md](./docs/init/CUSTOMIZE/README.md)
- **Local setup, style and commit conventions** - [CONTRIBUTING.md](./CONTRIBUTING.md)
- **Agent-facing guide** (Claude Code, Cursor, Codex, ...) - [AGENTS.md](./AGENTS.md)

## Security

See [SECURITY.md](./SECURITY.md) for how to report vulnerabilities privately.

## License

[MIT](./LICENSE)
