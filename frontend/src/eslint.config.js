// Nested ESLint config for the browser-side frontend sources. ESLint v10 resolves the config file
// NEAREST to each linted file, so everything under frontend/src/ is linted by THIS config instead
// of the root eslint.config.js (Node) - and this config REPLACES the root one (no cascading), so
// the project-specific plugins/rules from the root config are re-declared here on top of
// eslint-config-ironplate's react-typescript preset. The node-side build tooling (frontend/build/,
// frontend/vite.config.ts) intentionally stays on the root config.
// @ts-check

import {
    defineConfig,
    globalIgnores
} from 'eslint/config';
import eslintConfigIronplateReactTypeScript from 'eslint-config-ironplate/react-typescript.js';
import importNewlines from 'eslint-plugin-import-newlines';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import globals from 'globals';

// eslint-disable-next-line import-x/no-default-export
export default defineConfig([
    globalIgnores([
        'resources/3rdparty/' // Vendored third-party files (refreshed via "node --run copy-files-from-to")
    ]),

    // Shared base config (core + React + TypeScript rules; the TypeScript parser comes bundled,
    // via the "typescript-eslint" package, so no "languageOptions.parser" wiring is needed here).
    ...eslintConfigIronplateReactTypeScript,

    // eslint-config-ironplate intentionally declares no language globals (the right set depends on
    // the runtime); this directory holds browser code.
    {
        languageOptions: {
            globals: {
                ...globals.browser
            }
        }
    },

    // Test files (Vitest). Tests in this repo import describe/it/expect from 'vitest' explicitly
    // (see .claude/rules/testing.md); declaring the globals keeps configs/tests portable anyway.
    {
        files: [
            '**/*.test.{js,jsx,ts,tsx}',
            '**/*.spec.{js,jsx,ts,tsx}'
        ],
        languageOptions: {
            globals: {
                ...globals.vitest
            }
        }
    },

    // Project-specific plugins and rules - kept in sync with the same block in the root
    // eslint.config.js (which does not apply here because this nested config replaces it).
    {
        plugins: {
            'import-newlines': /** @type {import('eslint').ESLint.Plugin} */ (importNewlines),
            'simple-import-sort': /** @type {import('eslint').ESLint.Plugin} */ (simpleImportSort)
        },
        rules: {
            'id-denylist': [
                'error',
                'e', // To avoid it being used as short for error/event
                'event', // To avoid conflicts with window.event
                'raw', // eg: One may use it as sql.raw() via drizzle-orm (in most cases, sql.identifier() can be used instead)
                'location' // To avoid conflicts with window.location
            ],
            'object-shorthand': ['error', 'properties'],

            '@stylistic/no-multi-spaces': [
                'error',
                {
                    ignoreEOLComments: true,
                    exceptions: {
                        ImportAttribute: false,
                        ObjectPattern: true,
                        Property: false
                    }
                }
            ],

            '@stylistic/quote-props': [
                'error',
                'as-needed',
                {
                    numbers: true
                }
            ],

            // Caught errors are often intentionally unused (the catch block logs / falls back).
            // For TypeScript files, the equivalent "@typescript-eslint/no-unused-vars" override
            // lives in the block below.
            'no-unused-vars': ['error', { caughtErrors: 'none' }],

            'import-newlines/enforce': ['error', { items: 1 }], // `items: 1` effectively means each on its own line

            // No namespace imports (import * as ns). Note: this rule cannot force named-over-default
            // imports - preferring named imports from CSS modules (so missing-export typos become
            // hard build errors via the MISSING_EXPORT onwarn handler in
            // frontend/build/build-config-generator.ts) is a convention, demonstrated in App.tsx.
            'import-x/no-namespace': 'error',

            'simple-import-sort/exports': 'error',
            'simple-import-sort/imports': 'error',

            'unicorn/consistent-boolean-name': 'off',
            'unicorn/name-replacements': 'off',
            'unicorn/no-break-in-nested-loop': 'off',
            'unicorn/no-top-level-assignment-in-function': 'off',
            'unicorn/no-useless-else': 'off',
            'unicorn/require-array-sort-compare': 'off'
        }
    },

    // TypeScript files: ironplate's typeScriptDelta hands "no-unused-vars" over to
    // "@typescript-eslint/no-unused-vars" with default options; apply the same caught-error
    // leniency as the base rule above. Re-assert "no-unused-vars": "off" because the project-wide
    // override above would otherwise re-enable the base rule for TypeScript files too (where it
    // false-positives on type-only constructs such as function-type parameter names).
    {
        files: [
            '**/*.cts',
            '**/*.mts',
            '**/*.ts',
            '**/*.tsx'
        ],
        rules: {
            'no-unused-vars': 'off',
            '@typescript-eslint/no-unused-vars': ['error', { caughtErrors: 'none' }]
        }
    }
]);
