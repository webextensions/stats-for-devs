// @vitest-environment jsdom
import {
    beforeEach,
    describe,
    expect,
    it,
    vi
} from 'vitest';

// Both modules are reloaded together: `windowApi` closes over the `visibility` store's module state, so a
// fresh pair is needed per case.
const loadAsync = async function () {
    vi.resetModules();
    const windowApi = await import('./windowApi.ts');
    const visibility = await import('./visibility.ts');
    return { ...windowApi, ...visibility };
};

describe('window.statsForDevs API', function () {
    beforeEach(function () {
        localStorage.clear();
        delete window.statsForDevs;
    });

    it('should not exist on window until it is installed', function () {
        expect(window.statsForDevs).toBeUndefined();
    });

    it('installStatsForDevsWindowApi should install show / hide / toggle / isShown', async function () {
        const { installStatsForDevsWindowApi } = await loadAsync();

        installStatsForDevsWindowApi();

        expect(typeof window.statsForDevs?.show).toBe('function');
        expect(typeof window.statsForDevs?.hide).toBe('function');
        expect(typeof window.statsForDevs?.toggle).toBe('function');
        expect(typeof window.statsForDevs?.isShown).toBe('function');
    });

    it('should drive the visibility store', async function () {
        const { getShown, installStatsForDevsWindowApi } = await loadAsync();

        installStatsForDevsWindowApi();

        window.statsForDevs?.show();
        expect(getShown()).toBe(true);
        expect(window.statsForDevs?.isShown()).toBe(true);

        window.statsForDevs?.hide();
        expect(getShown()).toBe(false);

        window.statsForDevs?.toggle();
        expect(getShown()).toBe(true);
    });

    it('should merge onto an existing global rather than replacing it', async function () {
        // This is what makes the IIFE build safe: the bundle wrapper may assign `window.statsForDevs` either
        // before or after this runs, and neither assignment may clobber the other.
        const { installStatsForDevsWindowApi } = await loadAsync();

        // eslint-disable-next-line unicorn/no-global-object-property-assignment -- simulating a pre-existing global
        window.statsForDevs = { mount: () => undefined } as typeof window.statsForDevs;
        installStatsForDevsWindowApi();

        expect(typeof window.statsForDevs?.mount).toBe('function');
        expect(typeof window.statsForDevs?.show).toBe('function');
    });

    it('should be idempotent', async function () {
        const { installStatsForDevsWindowApi } = await loadAsync();

        installStatsForDevsWindowApi();
        const firstShow = window.statsForDevs?.show;

        installStatsForDevsWindowApi();
        expect(window.statsForDevs?.show).toBe(firstShow);
    });
});
