// @vitest-environment jsdom

// Tests the public entry point (frontend/lib/src/index.ts - the barrel that tsdown bundles into
// dist/, i.e. the package's "." export). The units themselves are covered by their colocated
// tests; this verifies the public surface wiring, and that rendering <StatsForDevsRoot /> while
// hidden produces nothing (the lazy-boundary contract at the barrel level). Kept out of the
// published tarball by the "!**/*.test.*" negation in package.json.ts's "files".

import { createRoot } from 'react-dom/client';
import {
    beforeEach,
    describe,
    expect,
    it
} from 'vitest';

import {
    DEFAULT_SETTINGS,
    getAllMetricIds,
    getAllMetrics,
    getShown,
    installStatsForDevsWindowApi,
    mountStatsForDevs,
    normalizeSettings,
    setBuildInfo,
    setShown,
    StatsForDevsRoot,
    subscribe,
    toggleShown,
    unmountStatsForDevs,
    useStatsForDevsShown
} from './index.ts';

// createRoot renders asynchronously; give React a macrotask turn
const flushAsync = async function () {
    await new Promise(function (resolve) {
        setTimeout(resolve, 0);
    });
};

beforeEach(function () {
    localStorage.clear();
    document.body.replaceChildren();
});

describe('public entry point (frontend/lib/src/index.ts)', function () {
    it('should expose the public API as named exports', function () {
        expect(typeof getShown).toBe('function');
        expect(typeof installStatsForDevsWindowApi).toBe('function');
        expect(typeof mountStatsForDevs).toBe('function');
        expect(typeof normalizeSettings).toBe('function');
        expect(typeof setBuildInfo).toBe('function');
        expect(typeof setShown).toBe('function');
        expect(typeof StatsForDevsRoot).toBe('function');
        expect(typeof subscribe).toBe('function');
        expect(typeof toggleShown).toBe('function');
        expect(typeof unmountStatsForDevs).toBe('function');
        expect(typeof useStatsForDevsShown).toBe('function');
    });

    it('should expose the 28-metric registry and the default settings', function () {
        expect(getAllMetricIds().length).toBe(28);
        expect(getAllMetrics().length).toBe(28);
        expect(DEFAULT_SETTINGS.enabledMetricIds).toEqual(['activeBreakpoint', 'viewportSize']);
    });

    it('should render nothing from <StatsForDevsRoot /> while hidden', async function () {
        const containerEl = document.createElement('div');
        document.body.append(containerEl);
        const root = createRoot(containerEl);
        root.render(<StatsForDevsRoot />);
        await flushAsync();
        expect(containerEl.childElementCount).toBe(0);
        root.unmount();
    });
});
