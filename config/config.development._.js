import extend from 'extend';

import inheritedConfig from './config.common.js';
import { PORT_NUMBER_HTTP } from './constants.js';

const publicDirectory = 'public-development';

const configForThisMode = {
    server: {
        verbose: false,
        access: {
            publicDirectory,
            url: {
                http: {
                    port: PORT_NUMBER_HTTP
                }
            }
        },
        nonProductionDevTools: {
            flagNotifyServerPathsOnLaunch: true,
            flagNotifyServerStartupErrors: true
        }
    },
    vite: {
        mode: 'development', // Explicitly mentioning it so that it can be used when called programmatically

        verbose: false,
        publicDirectory,
        sourcemap: 'inline', // false / 'inline' / 'source-map' / 'hidden'

        /* eslint-disable @stylistic/no-multi-spaces */
        outputCssFilenamePattern: 'bundle.[name].ensure-freshness.css',
        outputJsFilenamePattern:  'bundle.[name].ensure-freshness.js'
        /* eslint-enable @stylistic/no-multi-spaces */
    }
};

const configToExport = extend(true, {}, inheritedConfig, configForThisMode);

// eslint-disable-next-line import-x/no-default-export
export default configToExport;
