import packageJson from '../../../package.json' with { type: 'json' };
import { notifier } from '../../../utils/notifier/notifier.ts';

// Replace the numbers with their monospaced version (𝟬, 𝟭, 𝟮, 𝟯, 𝟰, 𝟱, 𝟲, 𝟳, 𝟴, 𝟵)
const replaceWithMonospaceDigits = (str: string): string => {
    return (
        str
            .replaceAll('0', '𝟬')
            .replaceAll('1', '𝟭')
            .replaceAll('2', '𝟮')
            .replaceAll('3', '𝟯')
            .replaceAll('4', '𝟰')
            .replaceAll('5', '𝟱')
            .replaceAll('6', '𝟲')
            .replaceAll('7', '𝟳')
            .replaceAll('8', '𝟴')
            .replaceAll('9', '𝟵')
    );
};

const notifyCompletionStatus = function ({
    configName,
    hasErrors,
    hasWarnings,
    buildTimeMs,
    errors,
    warnings
}: {
    configName: string;
    hasErrors: boolean;
    hasWarnings: boolean;
    buildTimeMs: number;
    errors: string[];
    warnings: string[]
}) {
    let overallStatus = 'info';
    let statusMsg = '';

    const whitespaceChar = '\u{2000}'; // A normal space character is trimmed in notifications; this one (EN QUAD, U+2000) is not, so blank separator lines survive

    let statusIndicator = '✔';
    if (hasErrors) {
        statusIndicator = '✘';
        overallStatus = 'error';
    } else if (hasWarnings) {
        statusIndicator = '⚠';
        overallStatus = 'warn';
    }

    const monospacedSpaceCharacter = '\u{2007}';
    const timeTakenInSeconds = replaceWithMonospaceDigits(
        String((buildTimeMs / 1000).toFixed(2)).padStart(5, monospacedSpaceCharacter)
    );
    statusMsg += `${statusIndicator} ${timeTakenInSeconds} sec - ${configName}`;

    if (hasErrors) {
        if (errors.length > 0) {
            statusMsg += `\n${whitespaceChar}\n${errors.length} error(s) occurred.`;
        } else {
            statusMsg += `\n${whitespaceChar}\nSome error(s) occurred.`;
        }
    }
    if (hasWarnings) {
        if (warnings.length > 0) {
            statusMsg += `\n${whitespaceChar}\n${warnings.length} warning(s) occurred.`;
        } else {
            statusMsg += `\n${whitespaceChar}\nSome warning(s) occurred.`;
        }
    }

    const currentTime = (function () {
        const date = new Date();
        return (
            new Date(
                date.getTime() -
                (date.getTimezoneOffset() * 60 * 1000)
            )
        ).toISOString().slice(11, 19);
    }());
    const title = `${packageJson.name} @ ${currentTime} (in ${buildTimeMs}ms)`;

    // Due to some bug, the notification message in Ubuntu 22.04 is not expanded correctly upon mouse hover and the
    // last line is not shown (if in the initial part of the message a `✘` character is present). As a workaround,
    // if we add some specific characters later on, the message is expanded correctly.
    // eg:
    //     '\u2800' => Braille Pattern Blank
    //     '\u3164' => Hangul Filler
    const workaroundWhitespaceCharacter = '\u{2800}';
    statusMsg += workaroundWhitespaceCharacter;

    if (overallStatus === 'error') {
        notifier.error(title, statusMsg);
    } else if (overallStatus === 'warn') {
        notifier.warn(title, statusMsg);
    } else {
        notifier.info(title, statusMsg);
    }
};

const notifyMultiBuildCompletionStatus = function ({
    buildResults
}: {
    buildResults: Array<{
        configName: string;
        hasErrors: boolean;
        hasWarnings: boolean;
        buildTimeMs: number;
        errors: string[];
        warnings: string[]
    }>
}) {
    let overallStatus = 'info';
    let statusMsg = '';

    let totalTime = 0;

    for (const [i, result] of buildResults.entries()) {
        if (i > 0) {
            statusMsg += '\n';
        }

        let statusIndicator = '✔';
        if (result.hasErrors) {
            statusIndicator = '✘';
            overallStatus = 'error';
        } else if (result.hasWarnings) {
            statusIndicator = '⚠';
            if (overallStatus !== 'error') {
                overallStatus = 'warn';
            }
        }

        const monospacedSpaceCharacter = '\u{2007}';
        const timeTakenInSeconds = replaceWithMonospaceDigits(
            String((result.buildTimeMs / 1000).toFixed(2)).padStart(5, monospacedSpaceCharacter)
        );
        statusMsg += `${statusIndicator} ${timeTakenInSeconds} sec - ${result.configName}`;

        if (result.hasErrors && result.errors.length > 0) {
            statusMsg += `\n${result.errors.length} error(s) occurred.`;
        }
        if (result.hasWarnings && result.warnings.length > 0) {
            statusMsg += `\n${result.warnings.length} warning(s) occurred.`;
        }

        totalTime += result.buildTimeMs;
    }

    const currentTime = (function () {
        const date = new Date();
        return (
            new Date(
                date.getTime() -
                (date.getTimezoneOffset() * 60 * 1000)
            )
        ).toISOString().slice(11, 19);
    }());
    const title = `${packageJson.name} @ ${currentTime} (in ${totalTime}ms)`;

    // Due to some bug, the notification message in Ubuntu 22.04 is not expanded correctly upon mouse hover and the
    // last line is not shown (if in the initial part of the message a `✘` character is present). As a workaround,
    // if we add some specific characters later on, the message is expanded correctly.
    // eg:
    //     '\u2800' => Braille Pattern Blank
    //     '\u3164' => Hangul Filler
    const workaroundWhitespaceCharacter = '\u{2800}';
    statusMsg += workaroundWhitespaceCharacter;

    if (overallStatus === 'error') {
        notifier.error(title, statusMsg);
    } else if (overallStatus === 'warn') {
        notifier.warn(title, statusMsg);
    } else {
        notifier.info(title, statusMsg);
    }
};

export {
    notifyCompletionStatus,
    notifyMultiBuildCompletionStatus
};
