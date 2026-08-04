// APP CUSTOMIZATIONS: Update the values in this file to match your application.

/* eslint-disable import-x/exports-last */

import { PORT_NUMBER_HTTP } from './constants.js';

export const applicationName = 'Stats for Devs';

export const appHostnameDevelopment = 'stats-for-devs.webextensions.org.localhost';
// The following variable is prefixed with `tentative_` to indicate that the correct values for its purpose are
// computed based on some other variables and concept of single-source-of-truth is not being followed here. So, ensure
// that the configuration files are in sync with this tentative value.
export const tentative_appOriginDevelopmentHttp = `http://${appHostnameDevelopment}:${PORT_NUMBER_HTTP}`;

// Entries to list first among the reachable URLs logged (and optionally notified) on server
// startup (see backend/src/server/logServerPaths.ts)
export const PREFERRED_HOSTNAMES_FOR_LOCAL_DEVELOPMENT = [
    appHostnameDevelopment,
    'localhost'
];

const appHostnameLive = 'stats-for-devs.webextensions.org';
export const appOriginLive = `https://${appHostnameLive}`;
