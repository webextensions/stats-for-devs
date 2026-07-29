# template-javascript-project

[![CI](https://github.com/webextensions/template-javascript-project/actions/workflows/ci.yml/badge.svg)](https://github.com/webextensions/template-javascript-project/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

This is the **`abstract-frontend-build`** branch - the abstract base of the frontend template
branches (`template-widget`, `template-webextension`, `template-web-app`) in this repository's
template family. On top of the shared `abstract-javascript-project` baseline (ESM, ESLint, Vitest,
`package.json` generated from `package.json.ts`, a health-check suite wired into git hooks, and a
template-sync merge workflow) it carries a config-driven Vite (Rolldown) + React + TypeScript
frontend build under `frontend/`, layered environment configs in `config/`, stylelint, and a
minimal Express server with opt-in HMR under `backend/` - plus a placeholder app that exercises
the stack. It is not meant to be forked into projects directly - fork from a `template-` branch.

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
