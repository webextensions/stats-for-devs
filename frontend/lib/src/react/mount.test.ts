// @vitest-environment jsdom

// Colocated unit test for the mount()/unmount() helpers. Uses createRoot's real async rendering
// under jsdom (opted in via the pragma above; no @testing-library here - the helpers themselves
// own the React root), so each assertion waits for React to commit via flushRenderAsync. Replace
// alongside the stub (conventions: .claude/rules/testing.md). Kept out of the published tarball
// by the "!**/*.test.*" negation in package.json.ts's "files".

import {
    describe,
    expect,
    it
} from 'vitest';

import {
    mount,
    unmount
} from './mount.tsx';

// React commits createRoot renders asynchronously; a macrotask tick is enough for them to flush.
const flushRenderAsync = async function () {
    await new Promise(function (resolve) {
        setTimeout(resolve, 0);
    });
};

describe('mount/unmount (frontend/lib/src/react/mount.tsx)', function () {
    it('should render the Greeting component into the target element', async function () {
        const target = document.createElement('div');
        mount(target, { name: 'Ada' });
        await flushRenderAsync();
        expect(target.textContent).toContain('Hello, Ada!');
    });

    it('should be idempotent per target (a second mount just re-renders)', async function () {
        const target = document.createElement('div');
        mount(target, { name: 'Ada' });
        await flushRenderAsync();
        mount(target, { name: 'Grace' });
        await flushRenderAsync();
        expect(target.childElementCount).toBe(1);
        expect(target.textContent).toContain('Hello, Grace!');
        expect(target.textContent).not.toContain('Hello, Ada!');
    });

    it('should unmount and clear the target', async function () {
        const target = document.createElement('div');
        mount(target);
        await flushRenderAsync();
        expect(target.textContent).toContain('Hello, world!');
        unmount(target);
        await flushRenderAsync();
        expect(target.textContent).toBe('');
    });

    it('should treat unmount of a never-mounted target as a no-op', function () {
        const target = document.createElement('div');
        expect(function () {
            unmount(target);
        }).not.toThrow();
    });
});
