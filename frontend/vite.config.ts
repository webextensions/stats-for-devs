/* eslint-disable n/no-process-exit */

import path from 'node:path';

import chalk from 'chalk';
import type { InlineConfig } from 'vite';

import { buildConfigGenerator } from './build/build-config-generator.ts';

const __dirname = import.meta.dirname;

const showHelp = function () {
    const
        cmdVite = path.relative(process.cwd(), process.argv[1]),
        pathToConfig = path.relative(process.cwd(), path.join(__dirname, '..', 'config'));

    console.log(chalk.gray([
        '',
        'Format:',
        `    ${cmdVite} --env config="<path-to-config-file>"`,
        '',
        'Examples:',
        `    ${cmdVite} --env config="${pathToConfig}/config.development.local.js"`,
        `    ${cmdVite} --env help`,
        '',
        'Options:',
        '    --env config="<path-to-config-file>"',
        '    --env help',
        ''
    ].join('\n')));
};

const exitWithError = function (errMsg: string) {
    console.error(chalk.red(errMsg));
    process.exit(1);
};
const showHelpAndExitWithError = function (errMsg: string) {
    showHelp();
    exitWithError(errMsg);
};

const currentDir = process.cwd();

const viteConfigAsync = async function (env: Record<string, string>): Promise<InlineConfig[]> {
    env ||= {};

    if (env.help) {
        showHelp();
        process.exit(0);
    }

    if (!env.config || typeof env.config !== 'string') {
        showHelpAndExitWithError('You need to pass an appropriate parameter for --env config="<path-to-config-file>"');
    }

    const configFilePath = path.resolve(currentDir, env.config);

    console.log(chalk.blue('Reading config from file: ' + configFilePath));

    let fullConfig: any = {};
    try {
        fullConfig = (await import(configFilePath)).default;
    } catch (err) {
        console.error(err);
        showHelpAndExitWithError('Error: Invalid or unavailable file ' + configFilePath);
    }

    let frontEndConfig = {};
    try {
        frontEndConfig = fullConfig.application.frontEnd;
    } catch (err) {
        console.error(err);
        showHelpAndExitWithError('Error: Invalid or unavailable "frontEnd" config');
    }

    const flagBasedViteConfig: any = fullConfig.vite;
    if (!flagBasedViteConfig || !Array.isArray(flagBasedViteConfig.configs)) {
        const exampleConfigFilePath = path.resolve(__dirname, '..', 'config', 'config.development.local.example.js');
        console.info(chalk.yellow('Ref: You may want to check the example file at ' + exampleConfigFilePath));
        return exitWithError('Error: Invalid or unavailable "vite" config (with a "configs" array) in ' + configFilePath);
    }

    const generatedViteConfigs: InlineConfig[] = Array.from(flagBasedViteConfig.configs, (configName: string) => buildConfigGenerator(
        flagBasedViteConfig,
        frontEndConfig,
        configName
    ));

    return generatedViteConfigs;
};

// eslint-disable-next-line import-x/no-default-export
export default viteConfigAsync;
