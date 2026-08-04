// Self-injects the widget's compiled CSS into document.head - for the standalone IIFE builds
// (script-tag / file:// pages) ONLY, so a single <script> tag is genuinely all a page needs.
// Imported solely by ./standalone.ts; the library ESM pass (dist/index.js) never reaches this
// module, so bundler consumers keep the injection-free dist/style.css model (see
// docs/because/widget-standalone-build.md).
//
// Each *.module.css is dual-imported: the ordinary import yields the compiled class-name map,
// the "?inline" import yields the text. Under @tsdown/css the "?inline" text is RAW (unscoped),
// so scopeCssModuleText() rewrites the selectors to the compiled names at runtime; under
// Vite/vitest the text is already compiled and the rewrite is a no-op (see
// ./scopeCssModuleText.ts).
//
// Dedupe: any element carrying [data-stats-for-devs] wins - e.g. a strict-CSP consumer's
// hand-linked <link data-stats-for-devs="1" href=".../style.css"> - in which case nothing is
// injected and the hand-linked stylesheet is in control.
//
// NOTE: extend SHEETS when a new *.module.css joins the widget - standalone.test.ts asserts the
// injected <style> carries a known class from each sheet to keep this list honest.

import iconsStyles from '../statsForDevs/icons/icons.module.css';
import iconsCssText from '../statsForDevs/icons/icons.module.css?inline';
import sparklineStyles from '../statsForDevs/Sparkline/Sparkline.module.css';
import sparklineCssText from '../statsForDevs/Sparkline/Sparkline.module.css?inline';
import statsForDevsStyles from '../statsForDevs/StatsForDevs.module.css';
import statsForDevsCssText from '../statsForDevs/StatsForDevs.module.css?inline';
import settingsStyles from '../statsForDevs/StatsForDevsSettings.module.css';
import settingsCssText from '../statsForDevs/StatsForDevsSettings.module.css?inline';
import { scopeCssModuleText } from './scopeCssModuleText.ts';

// [raw ?inline text, compiled class-name map] per sheet; order mirrors dist/style.css
const SHEETS: Array<[string, Record<string, string>]> = [
    [iconsCssText, iconsStyles],
    [sparklineCssText, sparklineStyles],
    [statsForDevsCssText, statsForDevsStyles],
    [settingsCssText, settingsStyles]
];

const injectStatsForDevsStyles = function (): void {
    try {
        if (typeof document === 'undefined' || document.querySelector('[data-stats-for-devs]')) {
            return;
        }
        const styleEl = document.createElement('style');
        styleEl.dataset.statsForDevs = '1';
        styleEl.textContent = SHEETS
            .map(([rawCssText, classNameMap]) => scopeCssModuleText(rawCssText, classNameMap))
            .join('\n');
        document.head.append(styleEl);
    } catch (err) {
        // Styling is best-effort: a broken injection should not take the page (or the API) down.
        console.error('stats-for-devs: could not inject styles', err);
    }
};

export { injectStatsForDevsStyles };
