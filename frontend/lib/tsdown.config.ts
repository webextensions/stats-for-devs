// tsdown build config for the publishable library (the "build:lib" npm script, which passes
// "--config frontend/lib/tsdown.config.ts"): bundles frontend/lib/src/index.ts into dist/ at the
// repo root (git-ignored) as a single-entry ESM library - dist/index.js (+ sourcemap), bundled
// type declarations (dist/index.d.ts) and the compiled CSS Modules output (dist/style.css, the
// "./style.css" export). Paths are resolved against this file's directory (tsdown resolves
// relative options against the config location, not the CWD), so they are spelled out via
// import.meta.dirname to keep them unambiguous. react / react-dom (and every other
// "dependencies" / "peerDependencies" entry) are external by default, so consumers supply their
// own copies. CSS support comes from the @tsdown/css devDependency (auto-detected by tsdown when
// installed). Kept at the frontend/lib/ level (not inside src/) so it stays on the root Node
// ESLint config, like the rest of the build tooling.
//
// NOTE: tsdown's "exports"-field auto-generation must stay OFF (the default): package.json is
// generated from package.json.ts (the source of truth), so the exports map is authored there by
// hand and guarded by the pkg-json-sync health check.

import path from 'node:path';

import { defineConfig } from 'tsdown';

// eslint-disable-next-line import-x/no-default-export -- tsdown resolves the config via its default export
export default defineConfig({
    entry: [path.resolve(import.meta.dirname, 'src/index.ts')],
    format: ['esm'],
    platform: 'browser',
    tsconfig: path.resolve(import.meta.dirname, 'tsconfig.json'), // The strict library type-check zone (see its header comment)
    outDir: path.resolve(import.meta.dirname, '../../dist'), // The published output stays at the repo root (the exports map in package.json.ts points at ./dist/)
    sourcemap: true, // frontend/lib/src/ ships in the tarball (see "files" in package.json.ts), so the maps resolve
    dts: {
        sourcemap: true // The bundled index.d.ts references index.d.ts.map; emit it too
    },
    css: {
        splitting: false // Emit one combined stylesheet (dist/style.css) for the "./style.css" export
    }
});
