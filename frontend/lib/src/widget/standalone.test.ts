// @vitest-environment jsdom

// Colocated unit test for the standalone (script-tag / CDN) entry: importing the module must
// install the full window.statsForDevs API, inject the widget styles, and auto-mount the HUD
// container (which renders nothing until shown). The IIFE wrapping itself (the classic
// <script src> load, where tsdown's globalName wrapper overwrites the global with the default
// export) is produced at build time and is exercised against the built artifact instead (see
// demo/demo.html). Kept out of the published tarball by the "!**/*.test.*" negation in
// package.json.ts's "files".
//
// The entry mounts at import time and its dependencies hold module-scope state, so every test
// loads a fresh copy via `vi.resetModules()` + a dynamic import.

import {
    beforeEach,
    describe,
    expect,
    it,
    vi
} from 'vitest';

const loadAsync = async function () {
    vi.resetModules();
    return await import('./standalone.ts');
};

// createRoot renders asynchronously; give React a macrotask turn
const flushAsync = async function () {
    await new Promise(function (resolve) {
        setTimeout(resolve, 0);
    });
};

beforeEach(function () {
    localStorage.clear();
    window.history.replaceState({}, '', '/');
    delete (window as { statsForDevs?: unknown }).statsForDevs;
    document.head.replaceChildren();
    document.body.replaceChildren();
});

describe('standalone entry (frontend/lib/src/widget/standalone.ts)', function () {
    it('should install the full window.statsForDevs API synchronously and export it as default', async function () {
        const { default: api } = await loadAsync();
        for (const method of ['hide', 'isShown', 'mount', 'setBuildInfo', 'show', 'subscribe', 'toggle', 'unmount'] as const) {
            expect(typeof api[method]).toBe('function');
            expect(typeof window.statsForDevs?.[method]).toBe('function');
        }
    });

    it('should auto-mount the container on load but render nothing while hidden', async function () {
        await loadAsync();
        await flushAsync();
        const container = document.getElementById('stats-for-devs-root');
        expect(container).not.toBeNull();
        expect(container?.childElementCount).toBe(0);
    });

    it('should inject one style element carrying a class from each widget sheet', async function () {
        await loadAsync();
        const styleEls = document.querySelectorAll('style[data-stats-for-devs]');
        expect(styleEls.length).toBe(1);
        const cssText = styleEls[0].textContent || '';
        // One known class per *.module.css - keeps injectStyles.ts's SHEETS list honest
        expect(cssText).toContain('.sfd-icon');
        expect(cssText).toContain('.sfd-Sparkline');
        expect(cssText).toContain('.sfd-pill');
        expect(cssText).toContain('.sfd-backButton');
    });

    it('should not inject styles when a [data-stats-for-devs] element already exists', async function () {
        const linkEl = document.createElement('link');
        linkEl.dataset.statsForDevs = '1';
        document.head.append(linkEl);
        await loadAsync();
        expect(document.querySelectorAll('style[data-stats-for-devs]').length).toBe(0);
    });

    it('should merge onto an existing window.statsForDevs rather than replace it', async function () {
        const existing = { customFlag: true };
        // eslint-disable-next-line unicorn/no-global-object-property-assignment -- simulating a pre-existing global
        (window as unknown as { statsForDevs: typeof existing }).statsForDevs = existing;
        await loadAsync();
        const globalApi = window.statsForDevs as unknown as { customFlag?: boolean; show?: () => void };
        expect(globalApi.customFlag).toBe(true);
        expect(typeof globalApi.show).toBe('function');
    });
});
