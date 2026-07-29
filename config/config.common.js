import { applicationName } from './app-customizations.js';
import { PORT_NUMBER_HTTP } from './constants.js';

const configForThisMode = {
    application: {
        name: applicationName,
        frontEnd: {
            showDevTools: false
        }
    },
    server: {
        verbose: true,
        access: {
            publicDirectory: null,
            url: {
                http: {
                    enabled: true,
                    port: PORT_NUMBER_HTTP
                }
            }
        }
    },
    vite: {
        mode: 'production', // Keeping it as "production" by default and the value can be over-ridden to "development" in the other relevant config file(s)
        configs: [
            'index.html'
        ],

        verbose: true,
        publicDirectory: null,
        sourcemap: false,

        skipEntry: false,
        useCopyPlugin: true,
        outputCssFilenamePattern: 'bundle.[name].[hash:20].css',
        outputJsFilenamePattern: 'bundle.[name].[hash:20].js'
    }
};

const configToExport = configForThisMode;

// eslint-disable-next-line import-x/no-default-export
export default configToExport;
