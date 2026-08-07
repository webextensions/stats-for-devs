// This file (package.json.ts) is the source of truth for package.json - with one exception: the
// package "version" is owned by npm. "npm version <patch|minor|major>" writes the new version into
// package.json, and we derive it back here so regenerating package.json preserves it. Do not
// hard-code "version" below.
//
// Version derivation (see the try/catch below): prefer ./package.json (the generated, npm-owned
// file). If it cannot be imported - e.g. it has not been generated yet, or is absent - fall back to
// ./package-version.json, a tiny committed (but never published) file that mirrors the version and is
// regenerated alongside package.json (by package-cjson's "generate-package-version-json" mode, wired
// into housekeeping:generate-package-json and the "npm version" release flow); the pkg-version-sync
// health check guards it against drift.
//
// Scope of the fallback: it covers an ABSENT / unimportable package.json, NOT a present-but-malformed
// one (e.g. carrying git conflict markers). Node reads the adjacent package.json to load THIS module
// in the first place, so a malformed package.json makes package.json.ts itself fail to load
// (ERR_INVALID_PACKAGE_CONFIG) before the try/catch can run.
//
// Dependency declaration format: npm's three fields ("dependencies" / "devDependencies" /
// "peerDependencies") are too coarse for the template-branch family - the same package lands in
// different npm fields on different branches (e.g. react: "dependencies" on a web app,
// "peerDependencies" on a React component package, "devDependencies" where it only powers a demo).
// So dependencies are declared in semantic category objects (dependenciesFor*), named by the
// SUBSYSTEM that imports them - never by the npm field they land in, which is branch-relative -
// so a package's category is identical on every branch and template merges stay conflict-free;
// the branch-owned dependencyCategoriesMapping decides which npm field each category lands in.
// Each category also has a {category}_overrides object; they merge into the final "overrides".
//
// "package-cjson" detects this file and treats the default export below as the contents of "package.json".
// Loading requires Node.js >= 24.2.0 (for package-cjson@^3.0.0).
//
// Regenerate package.json after editing this file:
//     $ node --run housekeeping:generate-package-json
//
// Never hand-edit package.json directly; it is overwritten from this file.

/* eslint-disable @stylistic/no-multi-spaces */
/* eslint-disable @stylistic/quote-props */
/* eslint-disable @stylistic/quotes -- double-quoted strings below, to stay visually aligned with the generated package.json */
/* eslint-disable import-x/no-default-export */

import { createDependencyCollectors } from './utils/package-json-utils/package-json-utils.ts';

// Prefer the version from package.json; fall back to package-version.json if package.json cannot be
// imported (absent / not yet generated - see header). Top-level await resolves "version" before the
// default export object is built; package-cjson awaits this module, then reads its default export.
let version: string;
try {
    version = (await import('./package.json', { with: { type: 'json' } })).default.version;
} catch {
    version = (await import('./package-version.json', { with: { type: 'json' } })).default.version;
}

const core = {
    "name": "@webextensions/template-javascript-project",
    version, // Owned by npm (see header); derived from package.json / package-version.json, never hard-coded
    "description": "Template for npm packages shipping an embeddable widget - React components/hooks plus standalone script-tag/CDN bundles (IIFE, react bundled in) with opt-in Shadow DOM isolation - tsdown-built (ESM + bundled types + CSS Modules) with a publishable manifest verified by publint, plus a config-driven React + Vite (Rolldown) frontend build as the development/demo harness - on top of the shared JavaScript tooling baseline",
    "author": "webextensions.org",
    "license": "MIT",

    // Publishable-manifest baseline: no "private" flag, plus the publish fields ("publishConfig"
    // here; "main" / "exports" / "files" below). Non-published forks add "private": true back (see
    // docs/init/CUSTOMIZE/CUSTOMIZE-package-json.md). The "npm version" version/tag lifecycle
    // (see the scripts below) stays wired regardless.
    //
    // "access": "public" ensures scoped packages (e.g. "@webextensions/...") publish publicly.
    // Harmless for unscoped packages.
    "publishConfig": {
        "access": "public"
    },

    "homepage": "https://github.com/webextensions/template-javascript-project#readme",
    "repository": {
        "type": "git",
        "url": "git+https://github.com/webextensions/template-javascript-project.git"
    },
    "bugs": {
        "url": "https://github.com/webextensions/template-javascript-project/issues"
    },

    "keywords": [
        "boilerplate",
        "component",
        "frontend",
        "hooks",
        "javascript",
        "npm",
        "package",
        "react",
        "shadow-dom",
        "starter",
        "template",
        "vite",
        "widget"
    ],

    // Node floor advertised via "engines.node" (what npm shows/enforces for consumers when the
    // manifest is published). Each branch sets its own value - see the inline note on the value
    // line. The dev/tooling floor is separate and unaffected by this value: developing and
    // running the checks needs the pinned Node in .nvmrc (see also .github/workflows/ci.yml and
    // docs/init/CUSTOMIZE/CUSTOMIZE-package-json.md).
    "engines": {
        "node": ">=22.0.0" // Support-policy floor: lowest still-maintained Node LTS line (no runtime dep needs more)
    },

    "type": "module",

    // Publish fields for a widget-shipping React library: bundler consumers import the built ESM
    // bundle in dist/ (produced by tsdown from frontend/lib/src/ - see
    // frontend/lib/tsdown.config.ts), with react / react-dom supplied by the consuming project
    // (see dependenciesForPeer below); script-tag / CDN consumers load the standalone IIFE
    // (dist/widget.min.js via "unpkg" / "jsdelivr" below, react bundled in). No "bin" (this
    // branch has no CLI - see template-npm-package-for-exports-cli for that).
    //
    // NOTE: package-cjson sorts object keys alphabetically in the generated package.json, so the
    // "." export is a plain string instead of a { "types", "default" } conditions object (the
    // sort would put "default" before "types" and trip publint's types-condition-must-be-first
    // rule). TypeScript resolves the types via the top-level "types" field and the
    // dist/index.d.ts sibling of the resolved dist/index.js instead.
    "sideEffects": [
        "**/*.css", // The "./style.css" import must survive tree-shaking
        // The standalone IIFE artifacts define a window global when evaluated; everything not
        // listed here is side-effect free (tree-shakable)
        "./dist/widget.js",
        "./dist/widget.min.js"
    ],
    "main": "./dist/index.js", // Library entry point (for tooling without "exports" support)
    "module": "./dist/index.js", // ESM hint for legacy bundlers without "exports" support
    "types": "./dist/index.d.ts", // Bundled type declarations emitted by tsdown
    // Bare CDN URLs (https://unpkg.com/<name> / https://cdn.jsdelivr.net/npm/<name>) serve the
    // standalone widget IIFE. Keep the basename in sync with STANDALONE_BASENAME in
    // frontend/lib/tsdown.config.ts (see docs/init/CUSTOMIZE/CUSTOMIZE-widget.md)
    "unpkg": "./dist/widget.min.js",
    "jsdelivr": "./dist/widget.min.js",
    "exports": {
        ".": "./dist/index.js",
        "./style.css": "./dist/style.css", // Compiled CSS Modules output; import once from the consuming app
        // The standalone script-tag / CDN artifacts (IIFE, react bundled in; see
        // frontend/lib/tsdown.config.ts). Loading one only defines window.TemplateWidget - it
        // never auto-mounts. Known publint WARNING (accepted): it sniffs the IIFE content as
        // CJS-in-an-ESM-package for these two subpaths; harmless, because the entry also
        // assigns the global explicitly for module evaluation (see
        // frontend/lib/src/widget/standalone.ts)
        "./widget.js": "./dist/widget.js",
        "./widget.min.js": "./dist/widget.min.js",
        "./package.json": "./package.json"
    },

    // Allowlist of files to publish (default-deny). "dist/" is the built package (tsdown output,
    // built fresh by "prepack"); "frontend/lib/src/" ships too so the sourcemaps in dist/ resolve
    // and the source is browsable on the registry CDNs; the "!**/*.test.*" negation keeps the
    // colocated tests (any depth, any test extension) out of the tarball. npm always also includes
    // package.json, README and LICENSE; CHANGELOG.md is listed explicitly because npm does NOT
    // auto-include it. .npmignore is kept as a redundant denylist; this allowlist is the primary
    // control over the tarball contents.
    "files": [
        "dist/",
        "frontend/lib/src/",
        "!**/*.test.*",
        "CHANGELOG.md"
    ]
};

// Runtime dependencies of the PUBLISHED package - what the code shipped to consumers
// (frontend/lib/src/, built into dist/) imports. Installed by every consumer, so keep this
// minimal (react / react-dom are supplied by the consumer instead - see dependenciesForPeer).
const dependenciesForPackage = {
    /* Begin: Project originated "dependenciesForPackage" */

    // No project originated "dependenciesForPackage" yet

    /* End: Project originated "dependenciesForPackage" */

    /* Begin: Template originated "dependenciesForPackage" */

    // No template originated "dependenciesForPackage" yet

    /* End: Template originated "dependenciesForPackage" */
};

const dependenciesForPackage_overrides = {
    /* Begin: Project originated "dependenciesForPackage_overrides" */

    // No project originated "dependenciesForPackage_overrides" yet

    /* End: Project originated "dependenciesForPackage_overrides" */

    /* Begin: Template originated "dependenciesForPackage_overrides" */

    // No template originated "dependenciesForPackage_overrides" yet

    /* End: Template originated "dependenciesForPackage_overrides" */
};

// Dependencies imported by the frontend app under frontend/src/ (React plus the client state
// stack). dependencyCategoriesMapping below decides the npm field: "dependencies" on branches
// that DEPLOY the app, "devDependencies" where the app is only a development/demo harness - the
// membership stays identical either way.
const dependenciesForApp = {
    /* Begin: Project originated "dependenciesForApp" */

    // No project originated "dependenciesForApp" yet

    /* End: Project originated "dependenciesForApp" */

    /* Begin: Template originated "dependenciesForApp" */

    "classnames": "^2.5.1",
    "jotai": "^2.20.2",
    "react": "^19.2.8", // Dev copy; consumers supply their own (see dependenciesForPeer)
    "react-dom": "^19.2.8", // Dev copy; consumers supply their own (see dependenciesForPeer)
    "zustand": "^5.0.14"

    /* End: Template originated "dependenciesForApp" */
};

const dependenciesForApp_overrides = {
    /* Begin: Project originated "dependenciesForApp_overrides" */

    // No project originated "dependenciesForApp_overrides" yet

    /* End: Project originated "dependenciesForApp_overrides" */

    /* Begin: Template originated "dependenciesForApp_overrides" */

    // Force every transitive react/react-dom requirement onto our copy - prevents a second React
    // in the tree (which breaks hooks/context at runtime)
    "react": "$react",
    "react-dom": "$react-dom"

    /* End: Template originated "dependenciesForApp_overrides" */
};

// Dependencies imported by the build toolchain: the config-driven demo-app build under
// frontend/build/ (Vite) and the publishable library build (tsdown), run locally and in CI.
const dependenciesForBuild = {
    /* Begin: Project originated "dependenciesForBuild" */

    // No project originated "dependenciesForBuild" yet

    /* End: Project originated "dependenciesForBuild" */

    /* Begin: Template originated "dependenciesForBuild" */

    "@babel/core": "^8.0.1", // @rolldown/plugin-babel peer; hosts the React Compiler pass
    "@jridgewell/gen-mapping": "^0.3.13",
    "@jridgewell/trace-mapping": "^0.3.31",
    "@rolldown/plugin-babel": "^0.2.3",
    "@tsdown/css": "^0.22.14", // Auto-detected by tsdown when installed; extracts dist/style.css
    "@vitejs/plugin-react": "^6.0.5", // Also provides reactCompilerPreset
    "babel-plugin-react-compiler": "^1.0.0",
    "commander": "^15.0.0", // Also declared in dependenciesForServer
    "esbuild": "^0.28.1", // CSS minifier for the frontend build (cssMinify: 'esbuild' - see the REVISIT note in frontend/build/build-config-generator.ts)
    "postcss": "^8.5.23", // For the SplitMultiClassAtScopePlugin build workaround
    "postcss-selector-parser": "^7.1.4",
    "postcss-value-parser": "^4.2.0",
    "tsdown": "^0.22.14",
    "vite": "^8.1.5"

    /* End: Template originated "dependenciesForBuild" */
};

const dependenciesForBuild_overrides = {
    /* Begin: Project originated "dependenciesForBuild_overrides" */

    // No project originated "dependenciesForBuild_overrides" yet

    /* End: Project originated "dependenciesForBuild_overrides" */

    /* Begin: Template originated "dependenciesForBuild_overrides" */

    // No template originated "dependenciesForBuild_overrides" yet

    /* End: Template originated "dependenciesForBuild_overrides" */
};

// Dependencies imported by the Express server under backend/src/server/ and the config/ layering
// it loads. dependencyCategoriesMapping below decides the npm field: "dependencies" on branches
// that DEPLOY the server, "devDependencies" where it only serves development - the membership
// stays identical either way.
const dependenciesForServer = {
    /* Begin: Project originated "dependenciesForServer" */

    // No project originated "dependenciesForServer" yet

    /* End: Project originated "dependenciesForServer" */

    /* Begin: Template originated "dependenciesForServer" */

    "commander": "^15.0.0", // Also declared in dependenciesForBuild
    "compression": "^1.8.1",
    "express": "^5.2.1",
    "extend": "^3.0.2", // Also declared in dependenciesForDev
    "get-port": "^7.2.0", // Dynamic port pick for the HTTP server (HTTP_PORT_DYNAMIC=yes)
    "local-ip-addresses-and-hostnames": "=0.3.0"

    /* End: Template originated "dependenciesForServer" */
};

const dependenciesForServer_overrides = {
    /* Begin: Project originated "dependenciesForServer_overrides" */

    // No project originated "dependenciesForServer_overrides" yet

    /* End: Project originated "dependenciesForServer_overrides" */

    /* Begin: Template originated "dependenciesForServer_overrides" */

    // No template originated "dependenciesForServer_overrides" yet

    /* End: Template originated "dependenciesForServer_overrides" */
};

// Dependencies useful only in the local dev / CI setup: the lint, type-check, test, health-check,
// and release toolchain, plus the sources of the vendored dev overlays (re-vendored via
// "copy-files-from-to").
const dependenciesForDev = {
    /* Begin: Project originated "dependenciesForDev" */

    // No project originated "dependenciesForDev" yet

    /* End: Project originated "dependenciesForDev" */

    /* Begin: Template originated "dependenciesForDev" */

    "@eslint-react/eslint-plugin": "^5.18.1",
    "@eslint/js": "^10.0.1",
    "@eslint/markdown": "^8.0.3",
    "@stylistic/eslint-plugin": "^5.10.0",
    "@stylistic/stylelint-plugin": "^5.2.1",
    "@testing-library/dom": "^10.4.1", // Required peer of @testing-library/react
    "@testing-library/jest-dom": "^7.0.0", // Registered per test file via import '@testing-library/jest-dom/vitest'
    "@testing-library/react": "^16.3.2",
    "@types/extend": "^3.0.4",
    "@types/node": "~24.13.3", // Pinned to 24.x to match the dev Node floor
    "@types/node-notifier": "^8.0.5",
    "@types/react": "^19.2.18",
    "@types/react-dom": "^19.2.4",
    "@types/semver": "^7.8.0",
    "@webextensions/revisit": "^0.2.0", // Recurring-reminders tool run by the post-commit hook (see revisit.json)
    "auto-changelog": "^2.6.0",
    "boxen": "^8.0.1",
    "chalk": "^6.0.0",
    "concurrently": "^10.0.4",
    "console-panel": "^1.0.4", // Vendored into frontend/src/resources/3rdparty/autoloaded/ via "copy-files-from-to"
    "del": "^8.0.1",
    "eslint": "^10.8.0",
    "eslint-config-ironplate": "^3.0.0", // The entries below marked "ironplate peer" are its required peerDependencies
    "eslint-plugin-import-newlines": "^2.0.0",
    "eslint-plugin-import-x": "^4.17.1", // ironplate peer
    "eslint-plugin-n": "^18.2.2", // ironplate peer
    "eslint-plugin-promise": "^7.3.0", // ironplate peer
    "eslint-plugin-react-hooks": "^7.1.1", // Optional ironplate peer
    "eslint-plugin-react-refresh": "^0.5.3", // Optional ironplate peer
    "eslint-plugin-simple-import-sort": "^14.0.0",
    "eslint-plugin-unicorn": "^72.0.0", // ironplate peer
    "execa": "^10.0.1",
    "extend": "^3.0.2", // Also declared in dependenciesForServer
    "globals": "^17.9.0",
    "husky": "^9.1.7",
    "jsdom": "^30.0.1", // Opted into per test file via the "@vitest-environment jsdom" pragma
    "knip": "^6.31.0",
    "lockfile-lint": "^5.0.0",
    "lodash-es": "^4.18.1",
    "node-notifier": "^10.0.1",
    "package-cjson": "^3.0.0",
    "publint": "^0.3.22",
    "semver": "^7.8.5",
    "shell-quote": "^1.10.0",
    "stats.js": "=0.17.0", // Vendored into frontend/src/resources/3rdparty/autoloaded/ via "copy-files-from-to"
    "stylelint": "^17.14.1",
    "stylelint-config-css-modules": "^4.6.0",
    "stylelint-config-recommended": "^18.0.0",
    "typescript": "~6.0.3", // Optional ironplate peer for its TypeScript configs
    "typescript-eslint": "^8.66.0", // Optional ironplate peer
    "typescript-plugin-css-modules": "^5.2.0", // Editor/tsserver types for *.module.css imports (wired in frontend/tsconfig.json "plugins")
    "vitest": "^4.1.10"

    /* End: Template originated "dependenciesForDev" */
};

const dependenciesForDev_overrides = {
    /* Begin: Project originated "dependenciesForDev_overrides" */

    // No project originated "dependenciesForDev_overrides" yet

    /* End: Project originated "dependenciesForDev_overrides" */

    /* Begin: Template originated "dependenciesForDev_overrides" */

    // stylelint-config-css-modules's declared stylelint peer range lags behind stylelint 17;
    // pin its peer to our stylelint so npm resolves a single copy instead of erroring/duping
    "stylelint-config-css-modules": {
        "stylelint": "$stylelint"
    }

    /* End: Template originated "dependenciesForDev_overrides" */
};

// Supplied by the consuming project, not bundled: tsdown externalizes every "dependencies" /
// "peerDependencies" entry by default, so the dist/ bundle imports react from the consumer's
// own copy. ">=18" because the library only relies on React 18+ features (hooks, createRoot,
// the automatic JSX runtime); development and tests run against the dev copies in
// dependenciesForApp.
const dependenciesForPeer = {
    /* Begin: Project originated "dependenciesForPeer" */

    // No project originated "dependenciesForPeer" yet

    /* End: Project originated "dependenciesForPeer" */

    /* Begin: Template originated "dependenciesForPeer" */

    "react": ">=18",
    "react-dom": ">=18" // Needed by the mount()/unmount() helpers (react-dom/client's createRoot)

    /* End: Template originated "dependenciesForPeer" */
};

const dependenciesForPeer_overrides = {
    /* Begin: Project originated "dependenciesForPeer_overrides" */

    // No project originated "dependenciesForPeer_overrides" yet

    /* End: Project originated "dependenciesForPeer_overrides" */

    /* Begin: Template originated "dependenciesForPeer_overrides" */

    // No template originated "dependenciesForPeer_overrides" yet

    /* End: Template originated "dependenciesForPeer_overrides" */
};

// Per-peer metadata ("peerDependenciesMeta") - only meaningful for packages listed in
// dependenciesForPeer. Emitted into the manifest only when non-empty. The main use case is
// marking a peer as optional so npm does not warn/install when the consumer omits it, e.g. on a
// widget branch whose script-tag/IIFE consumers do not need react:
//     "react": { "optional": true }
const dependenciesForPeer_meta = {
    /* Begin: Project originated "dependenciesForPeer_meta" */

    // No project originated "dependenciesForPeer_meta" yet

    /* End: Project originated "dependenciesForPeer_meta" */

    /* Begin: Template originated "dependenciesForPeer_meta" */

    // No template originated "dependenciesForPeer_meta" yet

    /* End: Template originated "dependenciesForPeer_meta" */
};

// The category order (here and throughout this file) is deliberate, not alphabetical:
// package -> app -> build -> server -> dev -> peer.
const dependencyCategories = {
    dependenciesForPackage,
    dependenciesForApp,
    dependenciesForBuild,
    dependenciesForServer,
    dependenciesForDev,
    dependenciesForPeer
};

// Category -> npm field mapping for THIS branch. This is the branch-owned knob: the categories are
// named by the subsystem that imports them, so other template branches keep the exact same
// category membership and change only this object (e.g. a web-app branch maps dependenciesForApp /
// dependenciesForServer to "dependencies" because it deploys the app).
const dependencyCategoriesMapping = {
    dependenciesForPackage: "dependencies",
    dependenciesForApp:     "devDependencies",
    dependenciesForBuild:   "devDependencies",
    dependenciesForServer:  "devDependencies",
    dependenciesForDev:     "devDependencies",
    dependenciesForPeer:    "peerDependencies"
} as const;

// The per-category override objects, in the same deliberate order as dependencyCategories.
const dependencyCategoriesOverrides = {
    dependenciesForPackage: dependenciesForPackage_overrides,
    dependenciesForApp: dependenciesForApp_overrides,
    dependenciesForBuild: dependenciesForBuild_overrides,
    dependenciesForServer: dependenciesForServer_overrides,
    dependenciesForDev: dependenciesForDev_overrides,
    dependenciesForPeer: dependenciesForPeer_overrides
};

// Validates the category declarations above (same category names across the three objects; every
// mapping value a real npm field; no conflicting duplicate package specs across categories; a
// package in only one {category}_overrides object) and returns the merge helpers - a violation
// throws here and fails the module load. See utils/package-json-utils/package-json-utils.ts for the
// exact rules.
const { collectDependenciesFor, collectOverrides } = createDependencyCollectors({
    dependencyCategories,
    dependencyCategoriesMapping,
    dependencyCategoriesOverrides
});

// Merged once each, so the "omitted while empty" spreads below can test them before emitting.
const mergedPeerDependencies = collectDependenciesFor('peerDependencies');
const mergedOverrides = collectOverrides();

const packageJson = {
    ...core,

    // The three npm fields are computed from the dependenciesFor* categories via
    // dependencyCategoriesMapping (see the declarations above). "dependencies" /
    // "devDependencies" are emitted even while empty (they are the slots a fork fills - see
    // docs/init/CUSTOMIZE/CUSTOMIZE-package-json.md); the peer / overrides fields below are
    // omitted instead, so a branch that declares none keeps them out of its manifest entirely.
    "dependencies": collectDependenciesFor('dependencies'),
    "devDependencies": collectDependenciesFor('devDependencies'),
    ...(Object.keys(mergedPeerDependencies).length > 0 && { "peerDependencies": mergedPeerDependencies }),
    // Peer metadata (see dependenciesForPeer_meta above)
    ...(Object.keys(dependenciesForPeer_meta).length > 0 && { "peerDependenciesMeta": dependenciesForPeer_meta }),

    // npm dependency overrides (applied to the whole install tree; root-only - they never affect
    // consumers of the published package). Merged from the per-category {category}_overrides
    // objects above; a package may appear in only one of them (enforced by
    // assertDependencyDeclarationsConsistent).
    ...(Object.keys(mergedOverrides).length > 0 && { "overrides": mergedOverrides }),

    "scripts": {
        // Fails any "npm install" early when the active Node does not satisfy .nvmrc.
        "preinstall": "./scripts/npm-run-scripts/preinstall.sh",

        // On "npm install" / "npm ci": runs the steps under scripts/npm-run-scripts/prepare/
        // (e.g. auto-creating the git-ignored config/config.development.local.js from its
        // committed example, so fresh clones and CI pass "node --run test" with zero manual
        // setup), then installs the Git hooks in .husky/ (tolerating environments where husky is
        // unavailable, e.g. CI with --omit=dev).
        "prepare": "./scripts/npm-run-scripts/prepare.sh",

        // One-shot workstation setup. "setup" is the umbrella - template branches / forks append
        // their own steps to it (database, certificates, ...). "setup:editor" (re)creates the
        // .vscode/soft-links/node symlink that .vscode/settings.json points "eslint.runtime" and the
        // integrated-terminal PATH at; re-run it after switching Node versions ("nvm use").
        // "setup:git-exclude" seeds this clone's .git/info/exclude (the secondary home, for
        // machine-local personal ignore patterns only - shared patterns live in the committed
        // .gitignore) from docs/template-project/git-info-exclude.example (idempotent, append-only).
        // "setup:ai" installs the language server that coding agents drive through LSP (Claude Code
        // spawns "typescript-language-server --stdio"); without it those tools silently do nothing,
        // which scripts/health-checks/checks/check-lsp-server.ts detects. A global install lands in
        // the ACTIVE Node version's bin directory, so re-run it after switching Node ("nvm use").
        "setup": [
            "node --run setup:editor",
            "node --run setup:git-exclude",
            "node --run setup:ai"
        ].join(" && "),
        "setup:ai":          "npm install -g typescript-language-server",
        "setup:editor":      "./.vscode/soft-links/setup.sh",
        "setup:git-exclude": "./scripts/housekeeping/setup-git-info-exclude.sh",

        "eslint": "eslint .",
        "eslint:fix": "eslint . --fix",

        // Lints only the staged files. Read-only verify - never auto-fixes / re-stages.
        // Delegates to a portable wrapper (scripts/health-checks/checks/eslint-staged-files.sh): it reads the
        // staged paths NUL-delimited and skips eslint when nothing is staged, replacing the GNU-only
        // "xargs -r" (which fails on macOS/BSD). The wrapper passes "--quiet" to hide the "File
        // ignored ..." warning ESLint emits for staged non-code files (README, JSON, etc.); ":fix"
        // is the manual auto-fix companion.
        "eslint:staged-files":     "./scripts/health-checks/checks/eslint-staged-files.sh",
        "eslint:staged-files:fix": "./scripts/health-checks/checks/eslint-staged-files.sh --fix",

        // Lints only the files changed in the working tree (staged + unstaged + untracked union),
        // via the sibling portable wrapper. The ":fix" variant is what the Stop hook
        // .claude/hooks/Stop/fix-lint-on-changed-files.sh runs at the end of every agent turn.
        "eslint:changed-files":     "./scripts/health-checks/checks/eslint-changed-files.sh",
        "eslint:changed-files:fix": "./scripts/health-checks/checks/eslint-changed-files.sh --fix",

        // Faster local re-runs via an on-disk cache. Prefer the plain "eslint" script for
        // authoritative checks: caching can hide issues from rules/plugins that do cross-file
        // analysis (e.g. verifying imported files/variables exist).
        "eslint:with-cache": "eslint . --cache --cache-location .cache/.eslintcache",

        // Validates that relative links/images in markdown files resolve to existing files or
        // directories (custom rule scripts/health-checks/helpers/eslint-rules/markdown-relative-links.js;
        // external URLs are ignored). Uses its own config so the main "eslint" run stays markdown-free.
        "eslint:markdown": "eslint --config eslint.markdown.config.js \"**/*.md\"",

        // CSS linting (config: stylelint.config.js; vendored third-party CSS is excluded via
        // .stylelintignore) - covers both the library CSS Modules (frontend/lib/src/) and the
        // demo app CSS (frontend/src/)
        "stylelint":         "stylelint \"frontend/lib/src/**/*.css\" \"frontend/src/**/*.css\"",
        "stylelint:fix":     "node --run stylelint -- --fix",

        // Staged-files / changed-files variants via portable wrappers (mirror the eslint:* pairs above)
        "stylelint:staged-files":      "./scripts/health-checks/checks/stylelint-staged-files.sh",
        "stylelint:staged-files:fix":  "./scripts/health-checks/checks/stylelint-staged-files.sh --fix",
        "stylelint:changed-files":     "./scripts/health-checks/checks/stylelint-changed-files.sh",
        "stylelint:changed-files:fix": "./scripts/health-checks/checks/stylelint-changed-files.sh --fix",

        // Per-rule summary output (useful when triaging many violations)
        "stylelint:verbose": "node --run stylelint -- --formatter verbose",

        // Runs the test suite
        "vitest": "vitest run",

        // Fast parse-check (module.stripTypeScriptTypes) of every repo JS/TS file discovered by
        // `git ls-files --cached --others --exclude-standard` - catches syntax errors before ESLint/Vitest.
        "syntaxlint": "./scripts/health-checks/checks/check-syntax.ts",

        // Runs the full check suite via the all-is-well orchestrator (concurrently by default)
        "test": "node --run all-is-well",
        // Change-aware run for fast local iterations: skips Vitest, publint, npm-ci-dry, lockfile-lint,
        // npm-audit-signatures, and claude-settings-sort when none of each check's staged paths changed
        // (see changeDependencies in all-is-well.ts). npm-audit-signatures is also disabled on local runs by
        // all-is-well.config.ts, so locally it is skipped regardless. The match is over STAGED paths
        // (git diff --cached), so with an unstaged working tree all six are skipped - "git add" your
        // changes first. Not wired into any git hook - the hooks run the full "test".
        "test:optimize-for-change": "node --run all-is-well -- --optimize-for-change",
        "test:compare-package-json-with-source": "package-cjson --mode compare",
        // Guards that package-version.json (the version fallback) has not drifted from package.json.ts
        // (which derives "version" from package.json)
        "test:compare-package-version-with-source": "package-cjson --mode compare-package-version",
        // Validates package-lock.json (registry hosts + HTTPS)
        "test:lockfile": "lockfile-lint --path package-lock.json --type npm --validate-https --allowed-hosts npm --validate-package-names",

        // Full static type check of the .ts tooling and the shipped .js (config in tsconfig.json). Complements
        // "syntaxlint" (fast parse-only) and ESLint (syntactic, non-type-aware).
        "test:types": "tsc --pretty",

        // Type check of the frontend (browser .tsx + the Vite build tooling) via frontend/tsconfig.json
        // (jsx + "bundler" module resolution); the root tsconfig excludes frontend/ entirely
        "test:types:frontend": "tsc --pretty --project frontend/tsconfig.json",

        // Type check of the publishable library zone (frontend/lib/ - excluded from
        // frontend/tsconfig.json) via its own STRICT frontend/lib/tsconfig.json (see its header
        // comment); the "types:lib" health check
        "test:types:lib": "tsc --pretty --project frontend/lib/tsconfig.json",

        // Lints the package for publish-time correctness (main/exports/files resolution); also run
        // as the "publint" check in all-is-well
        "publint": "publint",

        // Reports unused files / exports / dependencies
        "knip": "knip",

        // Full check suite
        "all-is-well": "./scripts/health-checks/all-is-well.ts", // Run the checks concurrently
        "all-is-well:sequentially": "node --run all-is-well -- --sequentially", // Run the checks sequentially (one at a time)

        // Ref: .claude/rules/non-keyboard-characters.md
        // Non-keyboard character guard (em dash, curly quotes, ellipsis, tick marks, etc.). Counts are
        // baselined per file in the "baseline" section of .block-non-keyboard-characters.suppressions.json
        // (project root); the same file's "exemptions" section lists files the tooling skips entirely

        // The plain form exits 1 on drift from that baseline
        "block-non-keyboard-characters":            "./scripts/health-checks/checks/block-non-keyboard-characters/block-characters.ts",
        // ":fix" auto-replaces the common characters in non-suppressed files
        "block-non-keyboard-characters:fix":        "./scripts/health-checks/checks/block-non-keyboard-characters/block-characters.ts --fix",
        // ":suppress" re-baselines (whole repo)
        "block-non-keyboard-characters:suppress":   "./scripts/health-checks/checks/block-non-keyboard-characters/block-characters.ts --suppress",

        // Read-only diagnostic: list every distinct character across the repo (with counts) so suspicious
        // chars that slip past the DETECTORS table can be spotted for manual review.
        // Skips the census-exempt files by default (e.g. characters.ts, which intentionally holds every
        // blocked glyph); pass --include-exempt to count everything.
        "block-non-keyboard-characters:detect-all": "./scripts/health-checks/checks/block-non-keyboard-characters/detect-all-characters.ts",

        // Verifies file status expectations (e.g. read-only paths) declared in
        // scripts/health-checks/checks/status-of-files.config.ts (a fill-in slot, empty by default);
        // ":ensure" applies the remediations (chmod a-w).
        "status-of-files":        "./scripts/health-checks/checks/check-status-of-files.ts --return-exit-code",
        "status-of-files:ensure": "./scripts/health-checks/checks/ensure-status-of-files.ts",

        // Normalizes .claude/settings.json (and .claude/settings.local.json): recursively sorts every
        // object key (case-insensitive) and sorts + de-duplicates the permissions.allow / permissions.deny
        // arrays. ":fix" normalizes in place and is also run by the Stop hook
        // .claude/hooks/Stop/claude-settings-sort.sh.
        "claude-settings-sort":     "./scripts/health-checks/checks/claude-settings-sort.ts",
        "claude-settings-sort:fix": "./scripts/health-checks/checks/claude-settings-sort.ts --fix",

        // Runs on "npm pack" AND "npm publish" (and git-dependency installs): builds a fresh dist/
        // for the tarball, then prepack.sh regenerates package.json from this file and strips
        // dev-only install-family scripts (preinstall) so the published manifest ships no install
        // scripts - npm runs a dependency's preinstall/install/postinstall on consumers' machines
        // (and flags the package with "hasInstallScript"), while the scripts they point at live
        // under scripts/, which "files" excludes from the tarball. "preinstall" itself stays for
        // dev installs (fail-fast Node gate). "postpack" restores the generated files afterwards.
        // The "prepack-strip" health check guards the strip list in prepack.sh.
        "prepack": "node --run build:lib && ./scripts/npm-run-scripts/prepack.sh",
        "postpack": "./scripts/npm-run-scripts/postpack.sh",

        // Runs only on "npm publish" (not on "npm pack" or "npm install"). Catches publishes that
        // skip "npm version" and its preversion hook.
        "prepublishOnly": "node --run test",

        // "npm version <patch|minor|major>" lifecycle. package.json.ts is the source of truth, so the
        // "version" step propagates the new version back into it and regenerates package.json.
        "preversion": "node --run test",
        "version": "./scripts/build-and-release/prepare-version.sh",

        // Runs after npm creates the version commit and tag: pushes both to the remote
        // ("--follow-tags"). NOTE: this is a network side effect - it fails offline / in sandboxed
        // CI and pushes before you get a chance to review the version commit. Remove this script to
        // keep releases local (see docs/development/releasing.md).
        "postversion": "git push --follow-tags",

        // Changelog generation (auto-changelog; config in .auto-changelog). CHANGELOG.md is regenerated
        // from git history automatically during "npm version" (by prepare-version.sh); these scripts are
        // for manual runs. "changelog" rewrites the file; "changelog:preview" prints pending commits.
        "changelog":         "auto-changelog",
        "changelog:preview": "auto-changelog --unreleased --stdout",

        // Deletes git-ignored build/tooling artifacts (dry-lists them first, then a 5 second
        // countdown). Exits 1 without deleting anything when it meets a git-ignored path that is
        // neither marked for keeping nor for deleting - see the file's header.
        "housekeeping:clean":                            "./scripts/housekeeping/clean.ts",

        // (Re)generates package.json (and package-version.json) from package.json.ts
        "housekeeping:generate-package-json":            "./scripts/housekeeping/generate-package-json.sh",

        // Bumps dependency versions in package.json.ts, then (re)generates package.json (and package-version.json)
        "housekeeping:update-and-generate-package-json": "./scripts/housekeeping/update-and-generate-package-json.sh",

        // (Re)creates node_modules + package-lock.json from scratch
        "housekeeping:update-package-lock-json":         "./scripts/housekeeping/update-package-lock-json.sh",

        // Read-only verify that every local "<branch>-flat" mirror branch still matches its source
        // branch (same tree, trailer at the source tip). See docs/template-project/flat-branches.md
        "branching:check-flat-branches": "./scripts/branching/check-flat-branches.ts",

        // Appends the source branch's new first-parent commits onto its append-only, tree-identical
        // "<source>-flat" mirror branch (local refs only - never fetches or pushes).
        // See docs/template-project/flat-branches.md
        "branching:flatten": "./scripts/branching/flatten-branch.sh",

        // Template-sync workflow (see docs/template-project/template-sync.md)

        // Merges the template branch into main, auto-resolving the expected package.json / package-lock.json
        // conflicts, then pushes. An AI run composed via extra args must bring its own consent flags, e.g.
        // `node --run template:merge-to-main -- --resolve-conflict-with-ai --allow-ai-commit --allow-ai-push`
        "template:merge-to-main":          "./scripts/branching/merge-source-to-target.sh --source template --target main --push",
        // Finds the newest template commit that merges cleanly and passes tests (local refs only - never fetches or pushes)
        "template:find-safe-merge-commit": "./scripts/branching/find-safe-template-merge-commit.sh",
        // Flattens every local template-* branch onto its existing "<branch>-flat" mirror via branching:flatten,
        // then verifies them; pass -- --create-branches to also create missing mirrors (local refs only -
        // never fetches or pushes)
        "template:flatten-branches":       "./scripts/branching/flatten-template-prefixed-branches.sh",

        // Frontend build (Vite on Rolldown), driven by the config files in config/ (see
        // docs/development/frontend-build.md). Orchestrator: frontend/build/build.ts; the plain
        // "build" watches with the development.local config. "--bundle-index" selects the
        // index.html bundle (the multi-bundle mechanism keeps working when child branches add more)
        "build":                                "node --run build:development:local",
        "build:development:local":              "node               ./frontend/build/build.ts --watch   --env config=\"./config/config.development.local.js\"  --bundle-index",
        "build:development:local:do-not-watch": "node               ./frontend/build/build.ts           --env config=\"./config/config.development.local.js\"  --bundle-index",
        "build:development:local:dry-run":      "node               ./frontend/build/build.ts --dry-run --env config=\"./config/config.development.local.js\"  --bundle-index",
        "build:development:local:inspect-brk":  "node --inspect-brk ./frontend/build/build.ts --watch   --env config=\"./config/config.development.local.js\"  --bundle-index",
        "build:do-not-watch":                   "node --run build:development:local:do-not-watch",
        "build:dry-run":                        "node --run build:development:local:dry-run",
        "build:inspect-brk":                    "node --run build:development:local:inspect-brk",
        "build:production:live":                "NODE_ENV=production node ./frontend/build/build.ts     --env config=\"./config/config.production.live.js\"    --bundle-index",

        // Library build (tsdown - config: frontend/lib/tsdown.config.ts): bundles
        // frontend/lib/src/index.ts into the publishable dist/ (git-ignored) - ESM bundle +
        // bundled .d.ts + extracted style.css. Runs from "prepack" and as the "build:lib"
        // pre-step of all-is-well (publint validates against the real dist/). Unrelated to the
        // "build*" scripts above, which build the DEMO app (frontend/src/) into public-*/.
        "build:lib": "tsdown --config frontend/lib/tsdown.config.ts",

        // Re-vendors the third-party files listed in copy-files-from-to.cjson into
        // frontend/src/resources/3rdparty/ (committed; exempted from the non-keyboard-characters guard).
        // Deliberately run via npx (not a devDependency): a rarely-run housekeeping task whose
        // output is committed and reviewed, so it does not need to weigh down the install tree.
        "copy-files-from-to": "npx --yes --prefer-offline copy-files-from-to --when-file-exists overwrite",

        // Express server (backend/src/server/server.ts): serves the built publicDirectory statically
        // with an SPA fallback; USE_HMR=yes switches to Vite middleware mode (on-the-fly transforms +
        // HMR - no separate build process needed); HTTP_PORT_DYNAMIC=yes picks the next free port
        // when the configured one is busy
        "server:development:local":                   "node --watch --watch-preserve-output backend/src/server/server.ts --config config/config.development.local.js",
        "server:development:local:http-port-dynamic": "HTTP_PORT_DYNAMIC=yes node --run server:development:local",
        "server:development:local:use-hmr":           "USE_HMR=yes node --run server:development:local",
        "server:production:live":                     "NODE_ENV=production node backend/src/server/server.ts --config config/config.production.live.js",

        // Dev entry points: "start" runs the Express server and the watch build together;
        // ":use-hmr" runs only the server with Vite middleware mode instead of a separate build;
        // ":http-port-dynamic" runs the same as "start" but with a dynamically picked port
        "start":                          "node --run start:app",
        "start:app":                      "concurrently \"node --run start:server\" \"node --run start:build\" --prefix \"[{time}] [{index}]\" --timestamp-format \"HH:mm:ss.SSS\"",
        "start:app:http-port-dynamic":    "concurrently \"node --run start:server:http-port-dynamic\" \"node --run start:build\" --prefix \"[{time}] [{index}]\" --timestamp-format \"HH:mm:ss.SSS\"",
        "start:app:use-hmr":              "node --run start:server:use-hmr",
        "start:build":                    "node --run build",
        "start:server":                   "node --run server:development:local",
        "start:server:http-port-dynamic": "node --run server:development:local:http-port-dynamic",
        "start:server:use-hmr":           "node --run server:development:local:use-hmr"
    }
};

export default packageJson;
