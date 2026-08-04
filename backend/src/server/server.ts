#!/usr/bin/env node

// Minimal Express server for this abstract-frontend-build branch: serves the built frontend
// (config.server.access.publicDirectory) statically with an SPA fallback, or - with USE_HMR=yes -
// switches to Vite middleware mode (on-the-fly transforms + HMR, no separate build needed).
//
// Trimmed from the web-app-template's backend/src/server/{server,application}.ts - https, helmet,
// cookies, basic-auth, database, API routes, secrets decryption, live-css etc. return with the
// backend-carrying template branches.

import fsAsync from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';

import { Command } from 'commander';
import compression from 'compression';
import express from 'express';
import extend from 'extend';

import { logger } from '../../../utils/logger.ts';
import { handleUnhandledErrors } from './handleUnhandledErrors.ts';
import { logServerPaths } from './logServerPaths.ts';

const __dirname = import.meta.dirname;

let indexHtmlContentsCached;

const serveIndexHtmlContentsAsync = async function (
    req,
    res,
    { projectRootFullPath, staticDir }
) {
    try {
        let indexHtmlContents;

        if (indexHtmlContentsCached) {
            indexHtmlContents = indexHtmlContentsCached;
        } else {
            const indexHtmlFilePath = path.resolve(projectRootFullPath, staticDir, 'index.html');
            const data = await fsAsync.readFile(indexHtmlFilePath);
            indexHtmlContents = data.toString();

            if (process.env.NODE_ENV === 'production') {
                // Cached for the lifetime of the process - an in-place rebuild needs a server
                // restart before the fallback serves the fresh shell
                indexHtmlContentsCached = indexHtmlContents;
            }
        }

        return res.send(indexHtmlContents);
    } catch (err) {
        logger.error('Error: Encountered an error while attempting to serve the index.html file.');
        logger.error(err);

        return (
            res
                .status(500)
                .send({
                    status: 'Error',
                    message: 'Error: Encountered an error while attempting to serve the index.html file.'
                })
        );
    }
};

const handle404Middleware = function ({ projectRootFullPath, staticDir }) {
    return async function (req, res) {
        // Serve the SPA shell (index.html) with a 404 status - the client-side router renders the
        // best-matching page for the requested path
        res.status(404);
        return await serveIndexHtmlContentsAsync(req, res, { projectRootFullPath, staticDir });
    };
};

const application = {
    startAsync: async function ({ configOptionsFileRootRelativePath }) {
        const projectRootFullPath = path.join(__dirname, '..', '..', '..');

        const configModuleFullPath = path.resolve(projectRootFullPath, configOptionsFileRootRelativePath);
        const importedConfig = (await import(configModuleFullPath)).default;
        const config = extend(true, {}, importedConfig);

        const _serverConfig = config.server || {};
        const _accessConfig = _serverConfig.access || {};
        const _httpServerConfig = (_accessConfig.url || {}).http || {};
        const _nonProductionDevToolsConfig = _serverConfig.nonProductionDevTools || {};

        if (_serverConfig.verbose) {
            logger.info('Config being used:');
            logger.log(JSON.stringify(config, null, 4));
        }

        const staticDir = _accessConfig.publicDirectory;

        const useHmr = (process.env.USE_HMR === 'yes');

        const exp = express();

        // Shared between the Vite dev server(s) and the HTTP listener so HMR WebSockets don't
        // collide on the default HMR port (24678). Assigned inside the HMR-only setup block.
        let sharedHmrHttpServer;

        exp.use(compression());

        // In HMR mode, the built assets are stale and would shadow Vite's dev transforms
        // (including HMR client injection) - skip all built-asset serving there; the Vite
        // middleware mounted below handles HTML, /src/**, and client-side SPA routes instead.
        if (staticDir && !useHmr) {
            logger.info('Setting up static server for path ' + staticDir);
            exp.use(
                express.static(
                    // Resolve against the project root (not process.cwd()) so the server works
                    // when launched from any directory
                    path.resolve(projectRootFullPath, staticDir),
                    {
                        // "." folders should be not be accessible directly
                        // (a child branch adding the ".admin" bundle needs to serve its
                        // "<publicDirectory>/.admin/" output some other way)
                        dotfiles: 'ignore',

                        // https://github.com/expressjs/serve-static/issues/32#issuecomment-76226945
                        setHeaders: function (res, resourcePath) {
                            const numberOfSecondsInFifteenDays = 15 * 24 * 60 * 60;

                            if (resourcePath.includes('ensure-freshness')) {
                                // Note:
                                //     The Chrome DevTools do not necessarily show the real HTTP response status code.
                                //     The following "Cache-Control" setting seems to work well for serving static
                                //     files where "ensure-freshness" functionality is required (in development mode)
                                res.setHeader('Cache-Control', 'public, max-age=' + (numberOfSecondsInFifteenDays) + ', no-cache');
                            } else if (resourcePath.match(/.*\.[0-9a-f]{8,22}\.(css|js)$/)) {
                                // Cache the requests matching the pattern *.<8-to-22-characters-of-hex-hash>.<css/js>
                                // Supports Vite/Rolldown hex hash output patterns
                                // https://stackoverflow.com/questions/5416250/regex-contains-at-least-8-decimal-digits#comment6129189_5416280
                                res.setHeader('Cache-Control', 'public, max-age=' + (numberOfSecondsInFifteenDays));
                            } else {
                                res.setHeader('Cache-Control', 'public, max-age=0');
                            }
                        }
                    }
                )
            );
        }

        if (useHmr) {
            // Vite middleware with `appType: 'spa'`: Vite's htmlFallbackMiddleware rewrites any
            // `Accept: text/html` request to `/index.html` and serves the SPA shell with dev
            // transforms + the HMR client.
            const { createServer } = await import('vite');

            // Computed-path dynamic import: keeps tsc (root tsconfig, nodenext resolution) from
            // following this import into the frontend subtree, which is type-checked separately
            // with "bundler" module resolution (frontend/tsconfig.json).
            const viteConfigModulePath = path.join(projectRootFullPath, 'frontend', 'vite.config.ts');
            const viteConfigAsync = (await import(viteConfigModulePath)).default;

            const viteConfigs = await viteConfigAsync({
                config: configOptionsFileRootRelativePath
            });

            sharedHmrHttpServer = http.createServer(exp);

            // Mount non-root bases before the root app: their source roots nest under
            // frontend/src, so the root Vite instance would otherwise shadow their requests
            const viteConfigsOrdered = viteConfigs.toSorted(function (cfgA, cfgB) {
                const aIsRoot = (cfgA.base === '/');
                const bIsRoot = (cfgB.base === '/');
                if (aIsRoot && !bIsRoot) {
                    return 1;
                }
                if (bIsRoot && !aIsRoot) {
                    return -1;
                }
                return 0;
            });

            for (const [index, viteConfig] of viteConfigsOrdered.entries()) {
                const viteServer = await createServer({
                    ...viteConfig,
                    // Per-instance optimizeDeps cache: multiple Vite instances sharing the default
                    // node_modules/.vite cache race and emit 504 "Outdated Optimize Dep"
                    cacheDir: path.join(projectRootFullPath, 'node_modules', `.vite-hmr-${index}`),
                    configFile: false,
                    server: {
                        middlewareMode: true,
                        hmr: {
                            path: `/__vite_hmr_${index}`,
                            server: sharedHmrHttpServer
                        }
                    },
                    // `appType: 'custom'` would omit Vite's HTML/transform middleware - requests
                    // would fall through to the built HTML without HMR
                    appType: 'spa'
                });

                if (viteConfig.base && viteConfig.base !== '/') {
                    exp.use(viteConfig.base.replace(/\/$/, ''), viteServer.middlewares);
                } else {
                    exp.use(viteServer.middlewares);
                }
            }
        } else {
            // Catch-all (for handling 404 Not Found)
            exp.use(handle404Middleware({ projectRootFullPath, staticDir }));
        }

        const portNumber = _httpServerConfig.port;

        const server = useHmr ? sharedHmrHttpServer : http.createServer(exp);
        server.on('error', function (err) {
            if ((err as NodeJS.ErrnoException).code === 'EADDRINUSE') {
                logger.error(`Error: Port ${portNumber} is already in use (configured via server.access.url.http.port).`);
                logger.error('Stop the other process using it, or configure a different port.');
                process.exit(1); // eslint-disable-line n/no-process-exit
            }
            throw err;
        });
        server.listen(portNumber, function () {
            logServerPaths({
                useHmr,
                portNumber,
                flagNotifyServerPathsOnLaunch: _nonProductionDevToolsConfig.flagNotifyServerPathsOnLaunch
            });
        });
    }
};

if (import.meta.main) {
    // Only run the CLI parsing, process-wide error handlers, and server startup when this file is
    // executed directly, not imported. Without this, there may be errors/warnings in running tests
    // (commander would parse the importer's argv and the handlers would install process.exit(1)).
    const program = new Command();

    program
        .requiredOption('-c, --config <config-file>', 'Configuration file to be used (eg: config/config.development.local.js)')
        .parse(process.argv);

    const options = program.opts();

    handleUnhandledErrors();

    (async () => {
        await application.startAsync({
            configOptionsFileRootRelativePath: options.config
        });
    })();
}
