// @vitest-environment jsdom

// Colocated unit test for the standalone (script-tag / CDN) entry: importing the module must
// define the global API and expose the same functions as named exports - and must NOT mount
// anything by itself (the documented "defines the global only, never auto-mounts" contract).
// The IIFE wrapping itself (window.StatsForDevs from a classic <script> load) is produced by
// tsdown's globalName at build time and is exercised against the built artifact instead (see
// frontend/lib/README.md). Kept out of the published tarball by the "!**/*.test.*" negation in
// package.json.ts's "files".

import {
    describe,
    expect,
    it
} from 'vitest';

import {
    mount,
    mountInShadowDom,
    unmount
} from './standalone.ts';

describe('standalone entry (frontend/lib/src/widget/standalone.ts)', function () {
    it('should expose the imperative API as named exports', function () {
        expect(typeof mount).toBe('function');
        expect(typeof mountInShadowDom).toBe('function');
        expect(typeof unmount).toBe('function');
    });

    it('should define the global API when evaluated as a module', function () {
        const globalScope = globalThis as { StatsForDevs?: Record<string, unknown> };
        expect(globalScope.StatsForDevs).toBeDefined();
        expect(globalScope.StatsForDevs?.mount).toBe(mount);
        expect(globalScope.StatsForDevs?.mountInShadowDom).toBe(mountInShadowDom);
        expect(globalScope.StatsForDevs?.unmount).toBe(unmount);
    });

    it('should not auto-mount anything on load', function () {
        expect(document.body.childElementCount).toBe(0);
    });
});
