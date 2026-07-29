import fs from 'node:fs';
import path from 'node:path';

import packageJson from '../../../../package.json' with { type: 'json' };
import { logger } from '../../../../utils/logger.ts';

const __dirname = import.meta.dirname;
const projectRoot = path.join(__dirname, '..', '..', '..', '..');
const projectRootFrontend = path.join(projectRoot, 'frontend');

/**
 * Vite plugin that:
 *   - Injects `frontEndConfig` and `appVersion` into the HTML
 *   - Copies static files (favicon, resources) to the output directory
 */
const AppBootstrapPlugin = function ({
    configName,
    frontEndConfig,
    useCopyPlugin,
    publicDirectory
}: {
    configName: string;
    frontEndConfig: any;
    useCopyPlugin: boolean;
    publicDirectory: string
}) {
    const appVersion = packageJson.version;

    return {
        name: 'app-bootstrap-plugin',

        // Transform the HTML to inject frontEndConfig and appVersion
        transformIndexHtml(html: string) {
            let transformed = html;

            // Replace {{appVersion}} placeholder
            transformed = transformed.replace('{{appVersion}}', () => appVersion);

            // Replace {{loadAppConfig}} placeholder with inline script; escape "<" so no config
            // string value (e.g. containing "</script>") can break out of the script element
            const frontEndConfigJson = JSON.stringify(frontEndConfig).replaceAll('<', String.raw`\u003C`);
            transformed = transformed.replace(
                '{{loadAppConfig}}',
                () => `<script>var frontEndConfig=${frontEndConfigJson};</script>`
            );

            logger.success(`\nProcessed HTML for ${configName} (appVersion: ${appVersion})`);

            return transformed;
        },

        // Copy static files after the bundle is written
        writeBundle() {
            if (!useCopyPlugin) {
                return;
            }

            // Only copy static files for the index build (not the admin build)
            if (configName !== 'index.html') {
                return;
            }

            const targetPublicDirectory = path.join(projectRoot, publicDirectory);

            const copyItems: Array<{ from: string; to: string; exclude?: string[] }> = [
                {
                    from: path.join(projectRootFrontend, 'src', 'favicon.ico'),
                    to: path.join(targetPublicDirectory, 'favicon.ico')
                },
                {
                    from: path.join(projectRootFrontend, 'src', 'resources'),
                    to: path.join(targetPublicDirectory, 'resources')
                }
            ];

            for (const item of copyItems) {
                try {
                    if (!fs.existsSync(item.from)) {
                        logger.warn(`Static copy: Source not found, skipping: ${path.relative(projectRoot, item.from)}`);
                        continue;
                    }

                    const stat = fs.statSync(item.from);
                    if (stat.isDirectory()) {
                        fs.cpSync(item.from, item.to, {
                            recursive: true,
                            filter: (source) => !(item.exclude || []).includes(path.basename(source))
                        });
                    } else {
                        const targetDir = path.dirname(item.to);
                        fs.mkdirSync(targetDir, { recursive: true });
                        fs.copyFileSync(item.from, item.to);
                    }

                    logger.success(`Copied ${path.relative(projectRoot, item.from)} > ${path.relative(projectRoot, item.to)}`);
                } catch (err) {
                    logger.error(`Error copying ${path.relative(projectRoot, item.from)}: ${err}`);
                }
            }
        }
    };
};

export { AppBootstrapPlugin };
