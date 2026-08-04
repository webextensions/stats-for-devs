# stats-for-devs

[![CI](https://github.com/webextensions/stats-for-devs/actions/workflows/ci.yml/badge.svg)](https://github.com/webextensions/stats-for-devs/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

Stats for devs - an embeddable widget (functionality under development). Forked from the
**`template-widget`** branch of
[template-javascript-project](https://github.com/webextensions/template-javascript-project), it
ships a publishable React library under [frontend/lib/](./frontend/lib/) (currently the
template's stub `Greeting` component composing a stub `useCounter` hook plus imperative
`mount()`/`unmount()` helpers, built by tsdown into the published `dist/`, with the config-driven
Vite (Rolldown) + React + TypeScript demo harness under `frontend/`) and the widget layer:
standalone script-tag/CDN bundles (`dist/widget.js` / `dist/widget.min.js` - IIFE, `react`
bundled in, reachable via the `unpkg` / `jsdelivr` manifest fields), and opt-in Shadow DOM
isolation via a reusable `ShadowDomHost` component and a `mountInShadowDom()` twin of `mount()`
(constructable stylesheets with a `<style>` fallback, `:host { all: initial }` reset). Loading
the standalone script only defines the `StatsForDevs` global - it never auto-mounts. The stub
API will be replaced with the real stats-for-devs widget (see
[docs/specs/todo/TODO.md](./docs/specs/todo/TODO.md)).

## Usage

In a React app (the stub API, until the real one lands):

```jsx
import { Greeting, useCounter } from 'stats-for-devs';
import 'stats-for-devs/style.css';

<Greeting name="Ada" />; // Renders: "Hello, Ada!" plus a counter button
```

In a non-React host page with a bundler, via the imperative helpers (`react` / `react-dom` still
come from your project - they are `peerDependencies`):

```js
import { mount, unmount } from 'stats-for-devs';

mount(document.getElementById('app'), { name: 'Ada' });
```

On any web page via a script tag / CDN - no build step, no npm install (`react` is bundled into
the standalone artifact):

```html
<link rel="stylesheet" href="https://unpkg.com/stats-for-devs/dist/style.css" />
<script src="https://unpkg.com/stats-for-devs"></script>
<script>
    StatsForDevs.mount(document.getElementById('app'), { name: 'Ada' });
</script>
```

Isolated from the host page's CSS via Shadow DOM (no stylesheet link needed - the shadow mount
carries its styles inside the shadow root):

```js
StatsForDevs.mountInShadowDom(document.getElementById('app'), { name: 'Ada' });
```

Or, inside your own React tree:

```jsx
import { Greeting, ShadowDomHost, widgetStyleSheets } from 'stats-for-devs';

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
