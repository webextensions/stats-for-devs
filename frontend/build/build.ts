#!/usr/bin/env node

/* eslint-disable n/no-process-exit */

import chalk from 'chalk';
import { Command } from 'commander';
import type {
    InlineConfig,
    LogOptions
} from 'vite';
import {
    build as viteBuild,
    createLogger
} from 'vite';

import viteConfigAsync from '../vite.config.ts';
import {
    notifyCompletionStatus,
    notifyMultiBuildCompletionStatus
} from './utils/notify-completion-status.ts';

// Parse command-line arguments
const parseArgs = function () {
    const program = new Command();

    try {
        /* eslint-disable @stylistic/no-multi-spaces */
        program
            .exitOverride()
            .option('--bundle-index', 'Build the index bundle')
            .option('--bundle-admin', 'Build the admin bundle')
            .option('--dry-run',      'Run the build to verify correctness but do not write any output to disk and do not fire completion notifications')
            .option('--watch',        'Watch mode')
            .option('--env <value>',  'Environment variable (e.g., config="path/to/config.js")')
            .parse(process.argv);
        /* eslint-enable @stylistic/no-multi-spaces */
    } catch (err) {
        // Commander throws on --help even though that's not an error; exit cleanly for that case
        const errorCode = (err as { code?: string }).code;
        if (errorCode === 'commander.helpDisplayed') {
            process.exit(0);
        }
        console.error(chalk.red('Error: Failed to parse command-line arguments for Vite build'));
        console.error(err);
        process.exit(1);
    }

    const options = program.opts();

    // Parse the --env key=value format (a bare value without "=", e.g. --env help, becomes a
    // boolean-true key)
    const envVars: Record<string, string> = {};

    if (options.env) {
        const envArg = options.env as string;
        const match = envArg.match(/^([^=]+)=(.+)$/);
        if (match) {
            const key = match[1];
            const value = match[2].replaceAll(/^["']|["']$/g, '');
            envVars[key] = value;
        } else if (!envArg.includes('=')) {
            envVars[envArg] = '1';
        }
    }

    return {
        bundleIndex: options.bundleIndex || null,
        bundleAdmin: options.bundleAdmin || null,
        dryRun: options.dryRun || null,
        watch: options.watch || null,
        envVars
    };
};

// Filter configs based on bundle flags
const filterConfigs = function (
    { configs,              bundleIndex,           bundleAdmin           }:
    { configs: InlineConfig[]; bundleIndex?: boolean; bundleAdmin?: boolean }
) {
    if (bundleIndex || bundleAdmin) {
        const filteredConfigs = configs.filter((config) => {
            // Determine configName from the build input path
            const input = (config.build?.rollupOptions as any)?.input as string || '';

            if (bundleIndex && input.includes('index.html')) {
                return true;
            }
            if (bundleAdmin && input.includes('admin.html')) {
                return true;
            }

            return false;
        });
        return filteredConfigs;
    } else {
        return configs;
    }
};

// Derive configName from a Vite config for display purposes
const getConfigName = function (config: InlineConfig): string {
    const input = (config.build?.rollupOptions as any)?.input as string || '';
    if (input.includes('admin.html')) {
        return '.admin/admin.html';
    }
    return 'index.html';
};

// Main execution
const mainAsync = async function () {
    const parsed = parseArgs();

    if (parsed.envVars.help) {
        await viteConfigAsync(parsed.envVars); // Shows the --env usage help and exits
    }

    if (!parsed.envVars.config) {
        console.error(chalk.red('Error: --env config="<path-to-config-file>" is required'));
        process.exit(1);
    }

    if (parsed.dryRun && parsed.watch) {
        console.error(chalk.red('Error: --dry-run cannot be combined with --watch'));
        process.exit(1);
    }

    console.log(chalk.blue('Loading Vite configuration...'));

    // Load Vite configs
    const allConfigs = await viteConfigAsync(parsed.envVars);

    if (!Array.isArray(allConfigs) || allConfigs.length === 0) {
        console.error(chalk.red('Error: No Vite configurations were generated'));
        process.exit(1);
    }

    // Filter configs based on bundle flags
    const filteredConfigs = filterConfigs({
        configs: allConfigs,
        bundleIndex: parsed.bundleIndex,
        bundleAdmin: parsed.bundleAdmin
    });

    if (filteredConfigs.length === 0) {
        console.error(chalk.red('Error: No configurations matched the bundle filters'));
        process.exit(1);
    }

    console.log(chalk.blue(`Building ${filteredConfigs.length} configuration${filteredConfigs.length > 1 ? 's' : ''}:`));
    for (const config of filteredConfigs) {
        console.log(chalk.blue(`    > ${getConfigName(config)}`));
    }

    if (parsed.watch) {
        console.log(chalk.blue('Starting Vite in watch mode...'));
    } else if (parsed.dryRun) {
        console.log(chalk.blue('Starting one-time Vite dry-run build (no output will be written)...'));
    } else {
        console.log(chalk.blue('Starting one-time Vite build...'));
    }

    const buildResults: Array<{
        configName: string;
        hasErrors: boolean;
        hasWarnings: boolean;
        buildTimeMs: number;
        errors: string[];
        warnings: string[]
    }> = [];

    let hasAnyErrors = false;

    // Warnings matching these patterns are informational/performance hints rather than
    // correctness issues; don't fail the build on them.
    const IGNORABLE_WARNING_PATTERNS: RegExp[] = [
        /\[PLUGIN_TIMINGS\]/, // NOTE: Also ignored via `rollupOptions.checks.pluginTimings = false` in `build-config-generator.ts`
        /chunks are larger than \d+\s*kB/i,
        // `vite:css` transforms `?inline` CSS imports (used by the library's shadow-DOM path,
        // e.g. frontend/lib/src/widget/mount.tsx) into JS string modules without emitting a
        // sourcemap for the transformation, which Rolldown reports as SOURCEMAP_BROKEN. The
        // emitted CSS assets get their sourcemaps reconstructed by CssBuildSourcemapsPlugin
        // regardless. REVISIT: drop this pattern once `vite:css` provides sourcemaps for
        // `?inline` transforms.
        /\[plugin vite:css\][\s\S]*\[SOURCEMAP_BROKEN\]/
    ];

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
        Once the upstream lightningcss bug is fixed, the warning-as-error treatment of CSS
        warnings can be re-evaluated - and the matching `cssMinify: 'esbuild'` override in
        `build-config-generator.ts` can likely be reverted to the default.
    */
    const filterCriticalWarnings = function (warnings: string[]): string[] {
        const criticalWarnings = warnings.filter((msg) => {
            const firstMatchingIgnorablePatternIndex = IGNORABLE_WARNING_PATTERNS.findIndex(
                (pattern) => pattern.test(msg)
            );
            const isCriticalWarning = firstMatchingIgnorablePatternIndex === -1;
            return isCriticalWarning;
        });
        return criticalWarnings;
    };

    // Build each config sequentially
    for (const config of filteredConfigs) {
        const configName = getConfigName(config);
        const startTime = Date.now();

        // Capture Vite warnings via a custom logger so we can fail the build
        // when the CSS pipeline (lightningcss) or other plugins emit warnings.
        const capturedWarnings: string[] = [];
        const customLogger = createLogger();
        const originalWarn = customLogger.warn.bind(customLogger);
        const originalWarnOnce = customLogger.warnOnce.bind(customLogger);
        customLogger.warn = function (msg: string, options?: LogOptions) {
            capturedWarnings.push(msg);
            originalWarn(msg, options);
        };
        customLogger.warnOnce = function (msg: string, options?: LogOptions) {
            capturedWarnings.push(msg);
            originalWarnOnce(msg, options);
        };

        try {
            const buildConfig: InlineConfig = {
                ...config,
                customLogger
            };

            // Enable watch mode if requested
            if (parsed.watch) {
                buildConfig.build = {
                    ...buildConfig.build,
                    watch: {}
                };
            }

            // For dry-run, suppress writing the bundle to disk so a concurrent
            // build/server using the same outDir is not disturbed
            if (parsed.dryRun) {
                buildConfig.build = {
                    ...buildConfig.build,
                    write: false
                };
            }

            const result = await viteBuild(buildConfig);

            const buildTimeMs = Date.now() - startTime;

            // In watch mode, result is a watcher
            if (parsed.watch) {
                const watcher = result as any;

                let bundleStartTime = Date.now();

                watcher.on('event', (evt: any) => {
                    if (evt.code === 'BUNDLE_START') {
                        bundleStartTime = Date.now();
                        // Reset per rebuild so each BUNDLE_END only inspects warnings from its own run
                        capturedWarnings.length = 0;
                    } else if (evt.code === 'BUNDLE_END') {
                        const criticalWarnings = filterCriticalWarnings(capturedWarnings);

                        if (criticalWarnings.length > 0) {
                            console.error(chalk.red(
                                `[${configName}] Rebuild produced ${criticalWarnings.length} warning(s) - treating as error(s):`
                            ));
                            for (const warning of criticalWarnings) {
                                console.error(chalk.red(warning));
                            }
                            notifyCompletionStatus({
                                configName,
                                hasErrors: true,
                                hasWarnings: true,
                                buildTimeMs: evt.duration,
                                errors: [`Rebuild produced ${criticalWarnings.length} warning(s) - treated as error(s)`],
                                warnings: criticalWarnings
                            });
                        } else {
                            console.log(chalk.green(`[${configName}] Rebuilt in ${evt.duration}ms`));
                            notifyCompletionStatus({
                                configName,
                                hasErrors: false,
                                hasWarnings: false,
                                buildTimeMs: evt.duration,
                                errors: [],
                                warnings: []
                            });
                        }
                    } else if (evt.code === 'ERROR') {
                        const errMsg = evt.error?.message ?? String(evt.error);
                        console.error(chalk.red(`[${configName}] Build error:`));
                        console.error(evt.error);
                        notifyCompletionStatus({
                            configName,
                            hasErrors: true,
                            hasWarnings: false,
                            buildTimeMs: Date.now() - bundleStartTime,
                            errors: [errMsg],
                            warnings: []
                        });
                    }
                });

                console.log(chalk.green(`[${configName}] Watcher started. Watching for changes...`));
            } else {
                const criticalWarnings = filterCriticalWarnings(capturedWarnings);

                if (criticalWarnings.length > 0) {
                    console.error(chalk.red(
                        `[${configName}] Build produced ${criticalWarnings.length} warning(s) - treating as error(s):`
                    ));
                    for (const warning of criticalWarnings) {
                        console.error(chalk.red(warning));
                    }

                    hasAnyErrors = true;
                    buildResults.push({
                        configName,
                        hasErrors: true,
                        hasWarnings: true,
                        buildTimeMs,
                        errors: [`Build produced ${criticalWarnings.length} warning(s) - treated as error(s)`],
                        warnings: criticalWarnings
                    });
                } else {
                    console.log(chalk.green(`[${configName}] Build completed in ${buildTimeMs}ms`));

                    buildResults.push({
                        configName,
                        hasErrors: false,
                        hasWarnings: false,
                        buildTimeMs,
                        errors: [],
                        warnings: []
                    });
                }
            }
        } catch (err) {
            const buildTimeMs = Date.now() - startTime;
            const errorMessage = err instanceof Error ? err.message : String(err);

            console.error(chalk.red(`[${configName}] Build failed in ${buildTimeMs}ms:`));
            console.error(err);

            hasAnyErrors = true;
            buildResults.push({
                configName,
                hasErrors: true,
                hasWarnings: false,
                buildTimeMs,
                errors: [errorMessage],
                warnings: []
            });
        }
    }

    // Notify completion status (one-shot mode only; watch mode notifies per watcher event)
    // Skip the desktop notification in dry-run mode since it is intended to run silently as
    // a health check
    if (!parsed.watch) {
        if (!parsed.dryRun) {
            notifyMultiBuildCompletionStatus({ buildResults });
        }

        if (hasAnyErrors) {
            process.exit(1);
        }
        console.log(chalk.green('Vite build completed successfully!'));
    } else if (hasAnyErrors) {
        // A watcher that failed to start throws before any watcher events fire; without this
        // exit the process would drain the event loop and exit 0 despite the failure
        console.error(chalk.red('Error: One or more watchers failed to start'));
        process.exit(1);
    }
};

(async () => {
    try {
        await mainAsync();
    } catch (err) {
        console.error(chalk.red('Fatal error in Vite build:'));
        console.error(err);
        process.exit(1);
    }
})();
