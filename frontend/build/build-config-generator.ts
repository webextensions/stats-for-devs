import path from 'node:path';

import babel from '@rolldown/plugin-babel';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import chalk from 'chalk';
import reactPackageJson from 'react/package.json' with { type: 'json' };
import type { InlineConfig } from 'vite';

import { AppBootstrapPlugin } from './plugins/AppBootstrapPlugin/AppBootstrapPlugin.ts';
import { CssBuildSourcemapsPlugin } from './plugins/CssBuildSourcemapsPlugin/CssBuildSourcemapsPlugin.ts';
import { SplitMultiClassAtScopePlugin } from './plugins/SplitMultiClassAtScopePlugin/SplitMultiClassAtScopePlugin.ts';

const majorVersionOfReact = reactPackageJson.version.split('.', 1)[0] as '17' | '18' | '19';

const __dirname = import.meta.dirname;

const
    projectRootFrontend = path.join(__dirname, '..'),
    projectRoot = path.join(__dirname, '..', '..');

const buildConfigGenerator = function (generatorOptions: any = {}, frontEndConfig = {}, configName: string): InlineConfig {
    const {
        mode,
        verbose,
        useMinimize,
        useCopyPlugin,
        publicDirectory,
        sourcemap: sourcemapConfig,
        cssSourcemap: cssSourcemapFromConfig,
        skipEntry = false,
        outputJsFilenamePattern = 'bundle.[name].[hash:20].js',
        outputCssFilenamePattern = 'bundle.[name].[hash:20].css'
    } = generatorOptions;

    const targetPublicDirectory = (function () {
        const basePublicDirectory = path.join(projectRoot, publicDirectory);
        if (configName === '.admin/admin.html') {
            return path.join(basePublicDirectory, '.admin');
        } else {
            return basePublicDirectory;
        }
    })();

    if (verbose) {
        console.log(chalk.blue('Generating Vite configuration for:'));
        const indentedGeneratorOptions = JSON.stringify(generatorOptions, null, ' '.repeat(4)).replaceAll('\n', '\n    ');
        console.log(chalk.blue(' '.repeat(4) + indentedGeneratorOptions));
    }

    const resolveViteSourcemapFromConfig = function (value: typeof sourcemapConfig) {
        if (value === 'inline') {
            return 'inline';
        } else if (value === 'source-map') {
            return true;
        } else if (value === 'hidden') {
            return 'hidden';
        } else if (value === false || value === undefined) {
            return false;
        }
        return false;
    };

    const cssSourcemapConfig = cssSourcemapFromConfig !== undefined ?
        cssSourcemapFromConfig :
        sourcemapConfig;

    // Convert sourcemap config values to Vite sourcemap values
    const sourcemap = resolveViteSourcemapFromConfig(sourcemapConfig);
    const cssSourcemapVite = resolveViteSourcemapFromConfig(cssSourcemapConfig);

    // Determine root and base based on configName
    const root = (function () {
        if (configName === '.admin/admin.html') {
            return path.resolve(projectRootFrontend, 'src', '.admin');
        } else {
            return path.resolve(projectRootFrontend, 'src');
        }
    })();

    const base = (function () {
        if (configName === '.admin/admin.html') {
            return '/.admin/';
        } else {
            return '/';
        }
    })();

    // Determine the entry HTML file name
    const inputHtml = (function () {
        if (configName === '.admin/admin.html') {
            return path.resolve(root, 'admin.html');
        } else {
            return path.resolve(root, 'index.html');
        }
    })();

    // Determine entry name for output pattern replacement
    const entryName = (function () {
        if (configName === '.admin/admin.html') {
            return 'admin';
        } else {
            return 'index';
        }
    })();

    // Build the assetFileNames function/string for CSS and other assets
    const assetFileNames = function (assetInfo: { names?: string[]; name?: string }) {
        const name = assetInfo.names?.[0] || assetInfo.name || '';
        if (name.endsWith('.css')) {
            // Preserve the chunk name for vendor CSS (from manualChunks splitting node_modules)
            // so it lands in a separate file for better caching
            if (name.includes('vendors')) {
                return outputCssFilenamePattern.replace('[name]', 'vendors');
            }
            // Replace [name] with the actual entry name since Vite doesn't auto-substitute for CSS assets
            return outputCssFilenamePattern.replace('[name]', () => entryName);
        }
        // For other assets (images, fonts, etc.), use a default pattern
        return 'assets/[name].[hash:20][extname]';
    };
    const shouldUseMinification = Boolean(useMinimize);
    const outputMinifyOptions = shouldUseMinification ?
        {
            minify: {
                compress: {
                    dropDebugger: false // Keep `debugger;` statements even when JS is minified.
                }
            }
        } :
        {};

    const config: InlineConfig = {
        configFile: false,

        root,
        base,
        mode: mode || 'production',

        // Disable Vite's default public directory handling (we use a custom copy plugin instead)
        publicDir: false,

        // https://vite.dev/config/shared-options#define
        // https://oxc.rs/docs/guide/usage/transformer/global-variable-replacement#define
        // https://vite.dev/guide/env-and-mode#env-variables-and-modes
        define: {
            'process.env.NODE_ENV': JSON.stringify(mode || 'production'),
            'process.env.BUILD_VERSION': JSON.stringify(process.env.BUILD_VERSION || '1')
        },

        css: {
            // Chains maps through PostCSS / CSS modules / minify transforms. `build.sourcemap`
            // alone does not always surface CSS asset maps; see `CssBuildSourcemapsPlugin`.
            devSourcemap: cssSourcemapVite !== false,

            modules: {
                // Auto-detect .module.css files (Vite default behavior matches this)
                generateScopedName: '[name]__[local]--[hash:base64:5]'
                // localsConvention is intentionally omitted to preserve PascalCase class names
            }
        },

        plugins: [
            // REVISIT: Splits `@scope (.a, .b) { ... }` into separate single-class `@scope` rules so the
            // CSS Modules processor can resolve the scoped class names (it leaves `:local(.foo)` markers
            // unresolved when the prelude is a comma-separated list). Remove this plugin (and its source
            // file) once the upstream bugs are fixed and released - see the file header in
            // `SplitMultiClassAtScopePlugin.ts` for the tracking issues.
            SplitMultiClassAtScopePlugin(),

            ...(cssSourcemapVite !== false ?
                [CssBuildSourcemapsPlugin({ cssSourcemap: cssSourcemapConfig })] :
                []
            ),

            react(),
            babel({
                presets: [
                    // This internally utilizes the npm package 'babel-plugin-react-compiler'
                    reactCompilerPreset({
                        target: majorVersionOfReact
                    })
                ]
            }),

            AppBootstrapPlugin({
                configName,
                frontEndConfig,
                useCopyPlugin: useCopyPlugin && configName === 'index.html',
                publicDirectory
            }),

            // Move Vite-injected tags (<script>, <link rel="modulepreload">, <link rel="stylesheet">)
            // from <head> to just before </body>
            {
                name: 'move-assets-to-body',
                enforce: 'post' as const,
                transformIndexHtml: {
                    order: 'post' as const,
                    handler(html: string) {
                        // Match Vite-injected tags in <head>:
                        //   <script type="module" crossorigin src="..."></script>
                        //   <link rel="modulepreload" ...>
                        //   <link rel="stylesheet" ...>
                        const viteTagRegex = /\s*(?:<script\s+type="module"[^>]*>[^<]*<\/script>|<link\s+rel="(?:modulepreload|stylesheet)"[^>]*\/?>)/g;
                        const collectedTags: string[] = [];
                        const cleaned = html.replaceAll(viteTagRegex, (match) => {
                            collectedTags.push(match.trim());
                            return '';
                        });

                        if (collectedTags.length === 0) {
                            return html;
                        }

                        // Insert all collected tags just before </body>
                        const tagBlock = '\n    ' + collectedTags.join('\n    ') + '\n';
                        return cleaned.replaceAll('</body>', () => tagBlock + '</body>');
                    }
                }
            },

            // NOTE: In HMR mode (`node --run start:app:use-hmr`), Vite's client injects CSS into
            // <head> at runtime, so the production "assets at end of body" layout is not
            // reproduced there - handle any resulting specificity differences in the CSS itself
            // (see because/frontend-build/hmr-runtime-styles-stay-in-head.md).

            // Plugin to handle node: prefixed imports (safety net for npm packages)
            {
                name: 'ignore-node-imports',
                enforce: 'pre' as const, // Using `enforce: 'pre'` to ensure this plugin runs before other plugins that might process `node:` imports (like `node:crypto`) which are not supposed to be loaded for frontend
                resolveId(source) {
                    if (source.startsWith('node:')) {
                        return { id: source, external: true };
                    }
                    return null;
                }
            },

            // When skipEntry is true, remove all JS/CSS/map chunks from the bundle output
            // so only the processed HTML (and copied static files) remain
            ...(skipEntry ?
                [{
                    name: 'skip-entry',
                    generateBundle(_options: any, bundle: Record<string, any>) {
                        for (const fileName of Object.keys(bundle)) {
                            if (fileName.endsWith('.js') || fileName.endsWith('.css') || fileName.endsWith('.map')) {
                                delete bundle[fileName];
                            }
                        }
                    }
                }] :
                []
            )
        ],

        build: {
            outDir: targetPublicDirectory,
            emptyOutDir: false, // Both builds may write to sibling dirs; don't wipe each other out
            sourcemap,
            minify: shouldUseMinification,

            /*
                REVISIT:
                    * In `lightningcss`, there may be warnings that are actually errors.
                    * The code example given below does not work in Vite's CSS transformer (`lightningcss`) due to a bug.
                Ref:
                    * https://github.com/vitejs/vite/issues/21911
                Example code:
                    ```css
                    @scope(
                        .test1,
                        .test2
                    ) {
                        :scope {
                            color: red;
                        }
                    }
                    ```
                Once the upstream bug is fixed, `cssMinify` can be reverted from `'esbuild'` back
                to the default behaviour (where it follows `shouldUseMinification`, i.e. `'lightningcss'`).
            */
            // cssMinify: shouldUseMinification, // if (shouldUseMinification) => 'lightningcss'
            cssMinify: shouldUseMinification ? 'esbuild' : false, // if (shouldUseMinification) => 'esbuild'

            copyPublicDir: false,

            rollupOptions: {
                checks: {
                    pluginTimings: false // Also ignored via `IGNORABLE_WARNING_PATTERNS => PLUGIN_TIMINGS` in `build.ts`
                },

                input: inputHtml,

                // Turn missing CSS module export names (e.g., typos in named imports) into build errors
                onwarn(warning, defaultHandler) {
                    if (
                        warning.code === 'MISSING_EXPORT' &&
                        warning.exporter &&
                        warning.exporter.endsWith('.module.css')
                    ) {
                        throw new Error(
                            `CSS Module export error: "${warning.binding}" is not exported by "${warning.exporter}"` +
                            (warning.id ? ` (imported by "${warning.id}")` : '')
                        );
                    }
                    defaultHandler(warning);
                },

                output: {
                    entryFileNames: outputJsFilenamePattern.replace('[name]', () => entryName),
                    chunkFileNames: outputJsFilenamePattern, // Chunks keep Rollup's own [name] substitution
                    assetFileNames,
                    hashCharacters: 'hex',

                    ...outputMinifyOptions,

                    manualChunks(id) {
                        if (id.includes('node_modules')) {
                            return 'vendors';
                        }
                        return undefined;
                    }
                }
            }
        },

        // Silence Vite's default logging in non-verbose mode
        logLevel: verbose ? 'info' : 'warn'
    };

    if (verbose) {
        console.log(chalk.blue('Generated Vite configuration:'));
        const indentedConfig = JSON.stringify(config, null, ' '.repeat(4)).replaceAll('\n', '\n    ');
        console.log(chalk.blue(' '.repeat(4) + indentedConfig));
    }

    return config;
};

export { buildConfigGenerator };
