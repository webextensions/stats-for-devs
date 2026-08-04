// @vitest-environment jsdom
// Covers the mount contract, not the overlay's rendering. Rendering the HUD itself under jsdom is deliberately
// out of scope - jsdom has no ResizeObserver, PerformanceObserver or visualViewport, so the test would be a
// stub farm. The assertion that matters here and is cheap is the invariant that nothing renders (and so the
// lazily-loaded overlay chunk is never even requested) while the overlay is hidden.

import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi
} from 'vitest';

const CONTAINER_SELECTOR = '#stats-for-devs-root';

const loadAsync = async function () {
    vi.resetModules();
    const mount = await import('./mount.tsx');
    const visibility = await import('./visibility.ts');
    return { ...mount, ...visibility };
};

// `createRoot().render()` schedules work rather than doing it synchronously, so give React a turn before
// asserting on the DOM.
const flushAsync = async function () {
    await new Promise((resolve) => {
        setTimeout(resolve, 0);
    });
};

describe('mountStatsForDevs', function () {
    beforeEach(function () {
        localStorage.clear();
        window.history.replaceState({}, '', '/');
        delete window.statsForDevs;
        document.body.replaceChildren();
    });

    afterEach(async function () {
        const { unmountStatsForDevs } = await loadAsync();
        unmountStatsForDevs();
        document.body.replaceChildren();
    });

    it('should append exactly one container to document.body', async function () {
        const { mountStatsForDevs } = await loadAsync();

        mountStatsForDevs();

        expect(document.querySelectorAll(CONTAINER_SELECTOR)).toHaveLength(1);
    });

    it('should be idempotent - a second call adds nothing', async function () {
        const { mountStatsForDevs } = await loadAsync();

        mountStatsForDevs();
        mountStatsForDevs();
        mountStatsForDevs();

        expect(document.querySelectorAll(CONTAINER_SELECTOR)).toHaveLength(1);
    });

    it('should install the window.statsForDevs controls', async function () {
        const { mountStatsForDevs } = await loadAsync();

        mountStatsForDevs();

        expect(typeof window.statsForDevs?.toggle).toBe('function');
    });

    it('should render nothing while the overlay is hidden', async function () {
        const { getShown, mountStatsForDevs } = await loadAsync();

        mountStatsForDevs();
        await flushAsync();

        expect(getShown()).toBe(false);
        // Node-count instead of markup: .innerHTML trips unicorn/prefer-dom-node-html-methods and
        // its suggested .getHTML() is not implemented by this jsdom
        expect(document.querySelector(CONTAINER_SELECTOR)?.childNodes.length).toBe(0);
    });

    it('should apply the buildInfo option to the Build metric', async function () {
        vi.resetModules();
        const { mountStatsForDevs } = await import('./mount.tsx');
        const { getAllMetrics } = await import('./metrics.ts');

        const readBuild = function () {
            return getAllMetrics().find((metric) => metric.id === 'build')?.getValue();
        };

        expect(readBuild()).toBe('n/a');

        mountStatsForDevs({ buildInfo: 'dev HMR' });
        expect(readBuild()).toBe('dev HMR');

        // A function is re-read on every tick, so a host can report something that changes.
        let mode = 'dev';
        mountStatsForDevs({ buildInfo: () => mode });
        expect(readBuild()).toBe('dev');
        mode = 'prod';
        expect(readBuild()).toBe('prod');
    });

    it('unmountStatsForDevs should remove the container and allow a fresh mount', async function () {
        const { mountStatsForDevs, unmountStatsForDevs } = await loadAsync();

        mountStatsForDevs();
        await flushAsync();

        unmountStatsForDevs();
        expect(document.querySelector(CONTAINER_SELECTOR)).toBeNull();

        mountStatsForDevs();
        expect(document.querySelectorAll(CONTAINER_SELECTOR)).toHaveLength(1);
    });
});
