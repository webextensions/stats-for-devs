import {
    describe,
    expect,
    it
} from 'vitest';

import {
    computeActiveBreakpoint,
    formatBytes,
    getMatchedBreakpoints
} from './metrics.ts';

describe('metrics helpers', function () {
    it('computeActiveBreakpoint should pick the largest matching breakpoint', function () {
        expect(computeActiveBreakpoint(500)).toBe('base');
        expect(computeActiveBreakpoint(640)).toBe('sm');
        expect(computeActiveBreakpoint(800)).toBe('md');
        expect(computeActiveBreakpoint(1100)).toBe('lg');
        expect(computeActiveBreakpoint(1300)).toBe('xl');
        expect(computeActiveBreakpoint(1600)).toBe('2xl');
    });

    it('getMatchedBreakpoints should list every matching breakpoint', function () {
        expect(getMatchedBreakpoints(500)).toBe('base');
        expect(getMatchedBreakpoints(800)).toBe('sm md');
        expect(getMatchedBreakpoints(1600)).toBe('sm md lg xl 2xl');
    });

    it('formatBytes should format bytes, KB and MB', function () {
        expect(formatBytes(100)).toBe('100 B');
        expect(formatBytes(2048)).toBe('2.0 KB');
        expect(formatBytes(2 * 1024 * 1024)).toBe('2.0 MB');
    });
});
