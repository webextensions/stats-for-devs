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
under `backend/`, and the publishable-manifest baseline (`main`/`exports`/`files`, publint) with a
placeholder library entry point (`index.js`). Fork from this branch to start a React npm package.

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
