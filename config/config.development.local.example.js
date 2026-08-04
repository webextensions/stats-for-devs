/*
    Copy this file to config.development.local.js (git-ignored) to run the build and server in
    local mode. The copy is created automatically on "npm install" when missing (see
    scripts/npm-run-scripts/prepare/ensure-local-config.sh) - customize it freely; git never
    sees it.
*/

import extend from 'extend';

import inheritedConfig from './config.development._.js';
import { PORT_NUMBER_HTTP } from './constants.js';

const publicDirectory = 'public-development-local';

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
        },
        nonProductionDevTools: {
            flagNotifyServerPathsOnLaunch: true
        }
    },
    vite: {
        publicDirectory
    }
};

const configToExport = extend(true, {}, inheritedConfig, configForThisMode);

// eslint-disable-next-line import-x/no-default-export
export default configToExport;
