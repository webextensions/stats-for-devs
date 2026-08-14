import libLocalIpAddressesAndHostnames from 'local-ip-addresses-and-hostnames';

import { PREFERRED_HOSTNAMES_FOR_LOCAL_DEVELOPMENT } from '../../../config/project-customizations.js';
import packageJson from '../../../package.json' with { type: 'json' };
import { logger } from '../../../utils/logger.ts';

let localIpAddressesAndHostnamesCached;

const getLocalIpAddressesAndHostnames = function () {
    if (!localIpAddressesAndHostnamesCached) {
        try {
            localIpAddressesAndHostnamesCached = libLocalIpAddressesAndHostnames.getLocalIpAddressesAndHostnames({
                preferredEntries: PREFERRED_HOSTNAMES_FOR_LOCAL_DEVELOPMENT
            });
        } catch {
            localIpAddressesAndHostnamesCached = [];
        }
    }
    return localIpAddressesAndHostnamesCached;
};

const logServerPaths = function ({
    useHmr,
    portNumber,
    flagNotifyServerPathsOnLaunch
}: {
    useHmr: boolean;
    portNumber: number;
    flagNotifyServerPathsOnLaunch?: boolean
}) {
    const headline = `Server (HTTP${useHmr ? ' + Vite HMR' : ''}) is available at:`;
    const hosts = [...new Set(getLocalIpAddressesAndHostnames())];

    if (hosts.length === 0) {
        logger.success(`${headline} http://localhost:${portNumber}/`);
        logger.warn('Warning: Unable to get the accessible hostnames / IP addresses');
        return;
    }

    const serverPaths = hosts.map(function (host) {
        return `http://${host}:${portNumber}/`;
    });

    logger.success(headline);
    for (const serverPath of serverPaths) {
        logger.log(`    ${serverPath}`);
    }

    if (flagNotifyServerPathsOnLaunch) {
        // The flag exists only in the development config tiers. The notifier is imported
        // dynamically because its top-level node-notifier import prints a console notice when that
        // package is absent (e.g. under "npm install --omit=dev") - production must never load it.
        (async function notifyServerPathsAsync() {
            try {
                const { notifier } = await import('../../../utils/notifier/notifier.ts');
                notifier.info(`[${packageJson.name}] - Server listening at:`, '\t' + serverPaths.join('\n\t'));
            } catch {
                // The notification is best-effort - the URLs are already logged above
            }
        })();
    }
};

export { logServerPaths };
