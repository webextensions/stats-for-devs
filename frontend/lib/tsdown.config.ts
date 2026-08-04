// tsdown build config for the publishable library (the "build:lib" npm script, which passes
// "--config frontend/lib/tsdown.config.ts") - an ARRAY of build passes, all writing into dist/
// at the repo root (git-ignored):
//
// - Library pass: bundles frontend/lib/src/index.ts (the side-effect-free API barrel) and
//   frontend/lib/src/auto.ts (the "stats-for-devs/auto" side-effect mount entry) as ESM -
//   dist/index.js + dist/auto.js (+ sourcemaps), bundled type declarations (dist/index.d.ts +
//   dist/auto.d.ts, the latter so the plain-string "./auto" export resolves types adjacently)
//   and the compiled CSS Modules output (dist/style.css, the "./style.css" export). react /
//   react-dom (and every other "dependencies" / "peerDependencies" entry) are external by
//   default, so consumers supply their own copies.
// - Standalone passes: bundle frontend/lib/src/widget/standalone.ts as a self-contained IIFE for
//   script-tag / CDN consumers - dist/widget.js (unminified, development react, for readable
//   debugging) and dist/widget.min.js (minified, production react, the "unpkg" / "jsdelivr"
//   target in package.json.ts). ALL runtime deps (react, react-dom, react-draggable, ...) are
//   bundled IN, process.env is compiled away (a plain browser page has no "process"), and the
//   widget styles ship inside the bundle (self-injected at load - see
//   frontend/lib/src/widget/injectStyles.ts). Loading the script defines the window global named
//   by GLOBAL_NAME below, injects the styles and auto-mounts on DOMContentLoaded (the HUD
//   renders nothing until shown). Rationale: docs/because/widget-standalone-build.md.
//
// The widget's CSS-module class names are hash-free ("sfd-" + local name) via
// generateScopedName below: the sfd- prefix is documented public API (consumers target
// .sfd-pill etc.), so every pipeline that compiles these modules must produce identical names -
// this file (both pass shapes), the Vite demo harness (frontend/build/build-config-generator.ts)
// and vitest (vitest.config.js). Keep them in sync.
//
// Forks: GLOBAL_NAME and STANDALONE_BASENAME below are the single place to rename the standalone
// identity - keep the "exports" / "unpkg" / "jsdelivr" paths in package.json.ts and the explicit
// global assignment in frontend/lib/src/widget/standalone.ts in sync (see
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
// (dist/<STANDALONE_BASENAME>.js / dist/<STANDALONE_BASENAME>.min.js). Lowercase on purpose: the
// IIFE wrapper var and the runtime-installed console API (window.statsForDevs - see
// frontend/lib/src/statsForDevs/windowApi.ts) are one and the same global.
const GLOBAL_NAME = 'statsForDevs';
const STANDALONE_BASENAME = 'widget';

// Hash-free scoped names - ".sfd-<localName>" is documented public API (see the header)
const CSS_MODULES_CONFIG = { generateScopedName: 'sfd-[local]' };

const libraryConfig: UserConfig = {
    entry: [
        path.resolve(import.meta.dirname, 'src/index.ts'),
        path.resolve(import.meta.dirname, 'src/auto.ts')
    ],
    format: ['esm'],
    platform: 'browser',
    tsconfig: path.resolve(import.meta.dirname, 'tsconfig.json'), // The strict library type-check zone (see its header comment)
    outDir: path.resolve(import.meta.dirname, '../../dist'), // The published output stays at the repo root (the exports map in package.json.ts points at ./dist/)
    sourcemap: true, // frontend/lib/src/ ships in the tarball (see "files" in package.json.ts), so the maps resolve
    dts: {
        sourcemap: true // The bundled index.d.ts references index.d.ts.map; emit it too
    },
    css: {
        modules: CSS_MODULES_CONFIG,
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
            // Bundle EVERYTHING - script-tag consumers have no module resolution, and the
            // runtime deps now live in "dependencies" (which tsdown would externalize by default)
            alwaysBundle: () => true,
            // Whitelist of what may end up bundled from node_modules - anything else bundling in
            // fails the build loudly (extend the list when a new transitive is reported).
            // scheduler is react-dom's transitive; clsx and prop-types are react-draggable's;
            // object-assign and react-is are prop-types'.
            onlyBundle: [
                'classnames',
                'clsx',
                'object-assign',
                'prop-types',
                'react',
                'react-dom',
                'react-draggable',
                'react-is',
                'scheduler',
                'use-local-storage-state'
            ]
        },
        define: {
            // Both defines are needed, on purpose (see docs/because/widget-standalone-build.md):
            // - The specific NODE_ENV key lets react's `=== 'production'` branches constant-fold
            //   (minification then drops the non-matching branches; without it the drop-in build
            //   measured ~120 kB gzip heavier).
            // - The bare object define catches every OTHER key - react-draggable reads
            //   process.env.DRAGGABLE_DEBUG, which would otherwise throw "process is not
            //   defined" on a plain browser page.
            'process.env': JSON.stringify({ NODE_ENV: minify ? 'production' : 'development' }),
            'process.env.NODE_ENV': JSON.stringify(minify ? 'production' : 'development')
        },
        outputOptions: {
            // An IIFE is a single file: inline the React.lazy chunk (kept in source anyway - it
            // still gates rendering, and the ESM pass keeps the real code split)
            codeSplitting: false,
            entryFileNames: STANDALONE_BASENAME + (minify ? '.min' : '') + '.js'
        },
        css: {
            modules: CSS_MODULES_CONFIG, // Must match the library pass - these names ARE the injected selectors
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
