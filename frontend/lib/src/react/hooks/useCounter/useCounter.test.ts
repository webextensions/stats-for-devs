// @vitest-environment jsdom

// Colocated unit test for the useCounter stub hook (renderHook + act from @testing-library/react;
// the pragma above opts this file into jsdom - the suite's default environment stays node).
// Replace alongside the stub (conventions: .claude/rules/testing.md). Kept out of the published
// tarball by the "!**/*.test.*" negation in package.json.ts's "files".

import {
    act,
    cleanup,
    renderHook
} from '@testing-library/react';
import {
    afterEach,
    describe,
    expect,
    it
} from 'vitest';

import { useCounter } from './useCounter.ts';

// Testing Library's automatic cleanup only registers itself when a global afterEach exists
// (vitest "globals" is off in this repo), so unmount explicitly between tests
afterEach(cleanup);

describe('useCounter (frontend/lib/src/react/hooks/useCounter/useCounter.ts)', function () {
    it('should start at 0 by default', function () {
        const { result } = renderHook(function () {
            return useCounter();
        });
        expect(result.current.count).toBe(0);
    });

    it('should honor initialCount', function () {
        const { result } = renderHook(function () {
            return useCounter({ initialCount: 5 });
        });
        expect(result.current.count).toBe(5);
    });

    it('should increment and reset', function () {
        const { result } = renderHook(function () {
            return useCounter({ initialCount: 5 });
        });

        act(function () {
            result.current.increment();
        });
        expect(result.current.count).toBe(6);

        act(function () {
            result.current.reset();
        });
        expect(result.current.count).toBe(5);
    });
});
