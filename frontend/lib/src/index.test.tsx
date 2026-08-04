// @vitest-environment jsdom

// Tests the public entry point (frontend/lib/src/index.ts - the barrel that tsdown bundles into
// dist/, i.e. the package's "." export). The units themselves are covered by their colocated
// tests; this verifies the public surface wiring. Replace alongside the stub API (conventions:
// .claude/rules/testing.md). Kept out of the published tarball by the "!**/*.test.*" negation in
// package.json.ts's "files".

import '@testing-library/jest-dom/vitest';

import {
    cleanup,
    render,
    screen
} from '@testing-library/react';
import {
    afterEach,
    describe,
    expect,
    it
} from 'vitest';

import {
    Greeting,
    mount,
    mountInShadowDom,
    ShadowDomHost,
    unmount,
    useCounter,
    widgetStyleSheets
} from './index.ts';

// Testing Library's automatic cleanup only registers itself when a global afterEach exists
// (vitest "globals" is off in this repo), so unmount explicitly between tests
afterEach(cleanup);

describe('public entry point (frontend/lib/src/index.ts)', function () {
    it('should expose the stub API as named exports', function () {
        expect(typeof Greeting).toBe('function');
        expect(typeof mount).toBe('function');
        expect(typeof mountInShadowDom).toBe('function');
        expect(typeof ShadowDomHost).toBe('function');
        expect(typeof unmount).toBe('function');
        expect(typeof useCounter).toBe('function');
        expect(Array.isArray(widgetStyleSheets)).toBe(true);
    });

    it('should render the Greeting component exported from the barrel', function () {
        render(<Greeting name="Ada" />);
        expect(screen.getByText('Hello, Ada!')).toBeInTheDocument();
    });
});
