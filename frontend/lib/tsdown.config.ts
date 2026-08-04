// tsdown build config for the publishable library (the "build:lib" npm script, which passes
// "--config frontend/lib/tsdown.config.ts") - an ARRAY of build passes, all writing into dist/
// at the repo root (git-ignored):
//
// - Library pass: bundles frontend/lib/src/index.ts as a single-entry ESM library -
//   dist/index.js (+ sourcemap), bundled type declarations (dist/index.d.ts) and the compiled
//   CSS Modules output (dist/style.css, the "./style.css" export). react / react-dom (and every
//   other "dependencies" / "peerDependencies" entry) are external by default, so consumers
//   supply their own copies.
// - Standalone passes: bundle frontend/lib/src/widget/standalone.ts as a self-contained IIFE for
//   script-tag / CDN consumers - dist/widget.js (unminified, development react, for readable
//   debugging) and dist/widget.min.js (minified, production react, the "unpkg" / "jsdelivr"
//   target in package.json.ts). react / react-dom are bundled IN via noExternal, and
//   process.env.NODE_ENV is compiled away (a plain browser page has no "process"). Loading the
//   script only defines the window global named by GLOBAL_NAME below; it never auto-mounts.
//   Rationale: because/widget-standalone-build.md.
//
// Forks: GLOBAL_NAME and STANDALONE_BASENAME below are the single place to rename the standalone
// identity - keep the "exports" / "unpkg" / "jsdelivr" paths in package.json.ts in sync (see
// docs/init/CUSTOMIZE/CUSTOMIZE-widget.md).
//
// Paths are resolved against this file's directory (tsdown resolves relative options against the
// config location, not the CWD), so they are spelled out via import.meta.dirname to keep them
// unambiguous. CSS support comes from the @tsdown/css devDependency (auto-detected by tsdown
// when installed). Kept at the frontend/lib/ level (not inside src/) so it stays on the root
// Node ESLint config, like the rest of the build tooling.
//
// NOTE: tsdown's "exports"-field auto-generation must stay OFF (the default): package.json is
// generated from package.json.ts (the source of truth), so the exports map is authored there by
// hand and guarded by the pkg-json-sync health check.
// NOTE: only the library pass may clean dist/ and emit declarations - the standalone passes keep
// "clean: false" (or they would wipe the earlier passes' output) and "dts: false" (declarations
// are meaningless for an IIFE).

import path from 'node:path';

import {
    defineConfig,
    type UserConfig
} from 'tsdown';

// The window global the standalone IIFE defines, and the dist/ artifact basename
// (dist/<STANDALONE_BASENAME>.js / dist/<STANDALONE_BASENAME>.min.js)
const GLOBAL_NAME = 'TemplateWidget';
const STANDALONE_BASENAME = 'widget';

const libraryConfig: UserConfig = {
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
};

const createStandaloneConfig = function ({ minify }: { minify: boolean }): UserConfig {
    return {
        entry: [path.resolve(import.meta.dirname, 'src/widget/standalone.ts')],
        format: ['iife'],
        globalName: GLOBAL_NAME,
        platform: 'browser',
        tsconfig: path.resolve(import.meta.dirname, 'tsconfig.json'),
        outDir: path.resolve(import.meta.dirname, '../../dist'),
        clean: false, // Keep the earlier passes' output (the library pass owns the dist/ clean)
        dts: false,
        sourcemap: true,
        minify,
        deps: {
            // Bundle react / react-dom (incl. subpaths like react-dom/client) into the
            // standalone artifact - script-tag consumers have no module resolution
            alwaysBundle: [/^react($|\/)/, /^react-dom($|\/)/],
            // Whitelist of what may end up bundled from node_modules (scheduler is react-dom's
            // transitive dependency) - anything else bundling in fails the build loudly
            onlyBundle: ['react', 'react-dom', 'scheduler']
        },
        define: {
            // Compile react's NODE_ENV branches away: a plain browser page has no "process", and
            // the literal lets minification drop the non-matching branches
            'process.env.NODE_ENV': JSON.stringify(minify ? 'production' : 'development')
        },
        outputOptions: {
            entryFileNames: STANDALONE_BASENAME + (minify ? '.min' : '') + '.js'
        },
        css: {
            splitting: false
        }
    };
};

// eslint-disable-next-line import-x/no-default-export -- tsdown resolves the config via its default export
export default defineConfig([
    libraryConfig,
    createStandaloneConfig({ minify: false }),
    createStandaloneConfig({ minify: true })
]);
