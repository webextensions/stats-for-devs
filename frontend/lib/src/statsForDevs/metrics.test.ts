import {
    describe,
    expect,
    it
} from 'vitest';

import {
    cardinalFromHeading,
    computeActiveBreakpoint,
    formatBytes,
    formatOrientationAngles,
    formatXyzTriplet,
    getMatchedBreakpoints,
    normalizeAngle,
    resolveSensorSentinel
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

    it('normalizeAngle should wrap any angle into [0, 360)', function () {
        expect(normalizeAngle(0)).toBe(0);
        expect(normalizeAngle(360)).toBe(0);
        expect(normalizeAngle(370)).toBe(10);
        expect(normalizeAngle(-10)).toBe(350);
        expect(normalizeAngle(-370)).toBe(350);
    });

    it('cardinalFromHeading should map headings to the compass rose', function () {
        expect(cardinalFromHeading(0)).toBe('N');
        expect(cardinalFromHeading(95)).toBe('E');
        expect(cardinalFromHeading(173)).toBe('S');
        expect(cardinalFromHeading(225)).toBe('SW');
        expect(cardinalFromHeading(359)).toBe('N');
    });

    it('formatOrientationAngles should round angles and mark missing axes', function () {
        expect(formatOrientationAngles(172.6, 12.2, -4.4)).toBe('a173 b12 g-4');
        expect(formatOrientationAngles(null, null, null)).toBe('a? b? g?');
    });

    it('formatXyzTriplet should format to one decimal and mark missing axes', function () {
        expect(formatXyzTriplet(0.05, 9.81, 0.44)).toBe('x0.1 y9.8 z0.4');
        expect(formatXyzTriplet(null, 9.81, null)).toBe('x? y9.8 z?');
    });

    it('resolveSensorSentinel should map each permission state to its display sentinel', function () {
        expect(resolveSensorSentinel('unsupported', false)).toBe('n/a');
        expect(resolveSensorSentinel('insecure-context', false)).toBe('needs https');
        expect(resolveSensorSentinel('needs-permission', false)).toBe('tap to enable');
        expect(resolveSensorSentinel('denied', false)).toBe('denied');
        expect(resolveSensorSentinel('granted', false)).toBe('no data');
        expect(resolveSensorSentinel('granted', true)).toBeNull();
    });
});
