import extend from 'extend';

import inheritedConfig from './config.production._.js';

const publicDirectory = 'public-production-live';

const configForThisMode = {
    server: {
        access: {
            publicDirectory
        }
    },
    vite: {
        publicDirectory
    }
};

const configToExport = extend(true, {}, inheritedConfig, configForThisMode);

// eslint-disable-next-line import-x/no-default-export
export default configToExport;
