import type { KnipConfig } from 'knip';

// Knip discovers entry points through its package.json, npm-scripts, and husky plugins (main/bin/exports,
// package.json scripts, and .husky/* hooks), so almost no extra `entry` paths are needed.
const config: KnipConfig = {
    // Intentional fill-in slots for forks, mostly empty because knip auto-discovers entries (see the
    // comment above). Populate these only when a fork needs to add entry points, ignore files/exports,
    // or mark a dependency as intentionally unused.
    entry: [
        // The config tiers are loaded only via dynamic variable imports knip cannot trace
        // (frontend/build/build.ts --env config=... and backend/src/server/server.ts --config ...).
        'config/*.js',
        // The library barrel (the package's "." export): package.json's main/exports point at its
        // BUILD output (dist/), which knip cannot trace back to the source, and the barrel's
        // exports (component, hook, prop/option types) are consumed by external consumers of the
        // published package - registering it as an entry keeps knip from flagging them.
        'frontend/lib/src/index.ts',
        // Nested per-directory ESLint configs (browser/React rules for frontend/lib/src/ and
        // frontend/src/) - knip's eslint plugin only auto-detects the root eslint.config.js.
        'frontend/lib/src/eslint.config.js',
        'frontend/src/eslint.config.js',
        // The standalone widget entry: a tsdown entry (built into dist/widget(.min).js, reached
        // by consumers via the "unpkg" / "jsdelivr" / exports subpaths in package.json), which
        // knip cannot trace back to the source - registering it keeps knip from flagging the
        // file and its exports.
        'frontend/lib/src/widget/standalone.ts',
        // The frontend entry is referenced only from frontend/src/index.html, which knip's vite
        // plugin does not parse here (it only reads an index.html at the package root, and the
        // --env-driven vite.config.ts factory gives it no root to discover).
        'frontend/src/index.tsx',
        // package-cjson loads package.json.ts to generate package.json (knip has no plugin for it,
        // and nothing imports the file - "main"/"exports" anchor index.js, not this source file).
        'package.json.ts',
        // Never imported by anything (users copy it to the git-ignored all-is-well.config.local.ts).
        // Registering it as an entry keeps knip from flagging the file, the base config it imports
        // (otherwise reached only via a dynamic variable import knip cannot trace, in
        // scripts/health-checks/allIsWellConfig/loadConfig.ts), and the `extend` / `@types/extend`
        // dependencies as unused.
        'scripts/health-checks/all-is-well.config.local.example.ts',
        // Invoked only via its all-is-well cmd string (the "prepack-strip" check), which knip
        // cannot trace (unlike sibling checks that .husky/post-checkout also invokes directly).
        'scripts/health-checks/checks/check-prepack-strips-install-scripts.ts'
    ],

    ignore: [
        // Vendored third-party files (refreshed via "node --run copy-files-from-to")
        'frontend/src/resources/3rdparty/**',
        // Machine-local all-is-well config (git-ignored, usually absent): loaded only via a dynamic
        // variable import knip cannot trace, so when present it would be flagged as an unused file.
        'scripts/health-checks/all-is-well.config.local.ts'
    ],

    ignoreDependencies: [
        // Vendor source for copy-files-from-to.cjson (never imported from code; its files are
        // copied into frontend/src/resources/3rdparty/ and loaded at runtime by
        // frontend/src/appUtils/devOverlays/loadDevOverlays.ts)
        'console-panel',
        // Invoked from scripts/npm-run-scripts/prepare.sh (the "prepare" npm script) - knip's
        // npm-scripts plugin cannot see binaries used inside referenced shell scripts.
        'husky',
        // Vendor source for copy-files-from-to.cjson (see the console-panel note above)
        'stats.js'
    ]
};

// eslint-disable-next-line import-x/no-default-export
export default config;
