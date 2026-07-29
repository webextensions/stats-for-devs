// Nested ESLint config for the library sources. ESLint v10 resolves the config file NEAREST to
// each linted file, so without this file everything under frontend/lib/src/ would fall back to
// the ROOT eslint.config.js (Node rules - no JSX, no browser globals). The library wants the
// exact same browser/React ruleset as the demo app zone, so the app's nested config is
// re-exported here - ONE home for the React lint rules (its relative file globs re-resolve
// against this directory). The build tooling one level up (frontend/lib/tsdown.config.ts)
// intentionally stays on the root Node config, like frontend/vite.config.ts.
// @ts-check

// eslint-disable-next-line import-x/no-default-export -- ESLint resolves the config via its default export
export { default } from '../../src/eslint.config.js';
