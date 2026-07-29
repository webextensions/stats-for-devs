/*
    Copy this file to config.production.local.js (git-ignored) to run a production-mode build and
    server locally. No script on this branch consumes it yet (the production.local flow arrives
    with the backend-carrying template branches) - it is committed so the config file inventory
    matches the web-app-template layout.
*/

import extend from 'extend';

import inheritedConfig from './config.production._.js';
import { PORT_NUMBER_HTTP } from './constants.js';

const publicDirectory = 'public-production-local';

const configForThisMode = {
    server: {
        access: {
            publicDirectory,
            url: {
                http: {
                    enabled: true,
                    port: PORT_NUMBER_HTTP
                }
            }
        }
    },
    vite: {
        publicDirectory
    }
};

const configToExport = extend(true, {}, inheritedConfig, configForThisMode);

// eslint-disable-next-line import-x/no-default-export
export default configToExport;
