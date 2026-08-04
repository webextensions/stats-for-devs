// @vitest-environment jsdom

// Colocated unit test for mountInShadowDom() - the shadow-DOM twin of react/mount.tsx's mount().
// Mirrors react/mount.test.ts's idioms (createRoot's real async rendering under jsdom, no
// Testing Library - the helpers own the React root) and additionally verifies that the shared
// roots registry lets the package's single unmount() tear down shadow mounts. Kept out of the
// published tarball by the "!**/*.test.*" negation in package.json.ts's "files".

import {
    describe,
    expect,
    it
} from 'vitest';

import { unmount } from '../react/mount.tsx';
import { mountInShadowDom } from './mount.tsx';

// React commits createRoot renders asynchronously; a macrotask tick is enough for them to flush.
const flushRenderAsync = async function () {
    await new Promise(function (resolve) {
        setTimeout(resolve, 0);
    });
};

const getShadowRoot = function (target: Element): ShadowRoot {
    const host = target.firstElementChild;
    if (!host || !host.shadowRoot) {
        throw new Error('Expected a shadow-rooted host element inside the target');
    }
    return host.shadowRoot;
};

describe('mountInShadowDom (frontend/lib/src/widget/mount.tsx)', function () {
    it('should render the Greeting inside a shadow root under the target element', async function () {
        const target = document.createElement('div');
        mountInShadowDom(target, { name: 'Ada' });
        await flushRenderAsync();
        expect(getShadowRoot(target).textContent).toContain('Hello, Ada!');
        // The greeting lives in the shadow root, not in the target's light DOM
        expect(target.textContent).not.toContain('Hello, Ada!');
    });

    it('should be idempotent per target (a second mount just re-renders)', async function () {
        const target = document.createElement('div');
        mountInShadowDom(target, { name: 'Ada' });
        await flushRenderAsync();
        mountInShadowDom(target, { name: 'Grace' });
        await flushRenderAsync();
        expect(target.childElementCount).toBe(1);
        const shadowRoot = getShadowRoot(target);
        expect(shadowRoot.textContent).toContain('Hello, Grace!');
        expect(shadowRoot.textContent).not.toContain('Hello, Ada!');
    });

    it('should tear down through the shared unmount()', async function () {
        const target = document.createElement('div');
        mountInShadowDom(target);
        await flushRenderAsync();
        expect(getShadowRoot(target).textContent).toContain('Hello, world!');
        unmount(target);
        await flushRenderAsync();
        expect(target.childElementCount).toBe(0);
    });
});
