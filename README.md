# template-javascript-project

[![CI](https://github.com/webextensions/template-javascript-project/actions/workflows/ci.yml/badge.svg)](https://github.com/webextensions/template-javascript-project/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

This is the **`template-npm-package-for-react`** branch - the template for npm packages shipping
React component(s) and/or hook(s), combining `abstract-frontend-build` and `abstract-npm-package`
in this repository's template family. On top of the shared `abstract-javascript-project` baseline
(ESM, ESLint, Vitest, `package.json` generated from `package.json.ts`, a health-check suite wired
into git hooks, and a template-sync merge workflow) it carries a config-driven Vite (Rolldown) +
React + TypeScript frontend build under `frontend/` for developing and demoing the package,
layered environment configs in `config/`, stylelint, a minimal Express server with opt-in HMR
under `backend/`, and the publishable React library itself under
[frontend/lib/](./frontend/lib/): a stub `Greeting` component composing a stub `useCounter` hook
plus imperative `mount()`/`unmount()` helpers, built by tsdown into the published `dist/` (ESM
bundle with react externalized, bundled type declarations, and the compiled CSS Modules
stylesheet), with component/hook tests under jsdom. Forks replace the stub API with their real
components and hooks. Fork from this branch to start a React npm package.

## Usage

In a React app (replace the stub API with your package's real one):

```jsx
import { Greeting, useCounter } from '@webextensions/template-javascript-project';
import '@webextensions/template-javascript-project/style.css';

<Greeting name="Ada" />; // Renders: "Hello, Ada!" plus a counter button
```

In a non-React host page, via the imperative helpers (`react` / `react-dom` still come from your
project - they are `peerDependencies`):

```js
import { mount, unmount } from '@webextensions/template-javascript-project';

mount(document.getElementById('app'), { name: 'Ada' });
```

Locally: `node --run start` serves the demo app ([frontend/src/](./frontend/src/), which renders
the library from source) and `node --run build:lib` emits the publishable `dist/` (git-ignored;
built fresh by `prepack` for every tarball).

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
