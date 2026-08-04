import extend from 'extend';

import { logger } from '../utils/logger.ts';
import inheritedConfig from './config.common.js';
import { PORT_NUMBER_HTTP } from './constants.js';

if (process.env.NODE_ENV !== 'production') {
    logger.warn('Warning: Production configuration is being loaded while process.env.NODE_ENV is not set as production.');
    logger.warn(
        'Unless you know what you are doing, you may wish to abort the process and resolve this issue before proceeding.' +
        '\nRecommendation: Prefix your command with "NODE_ENV=production"'
    );
}

const publicDirectory = 'public-production';

const configForThisMode = {
    server: {
        access: {
            publicDirectory,
            url: {
                http: {
                    port: PORT_NUMBER_HTTP // Ensure that the provided port number is "forwarded" to port 80 in the production server
                }
            }
        }
    },
    vite: {
        publicDirectory,
        useMinimize: true
    }
};

const configToExport = extend(true, {}, inheritedConfig, configForThisMode);

// eslint-disable-next-line import-x/no-default-export
export default configToExport;
