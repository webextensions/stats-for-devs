import {
    describe,
    expect,
    it
} from 'vitest';

import {
    clampValue,
    computeAxisBound
} from './viewportClamp.ts';

describe('viewportClamp helpers', function () {
    it('clampValue should clamp a value into the inclusive range', function () {
        expect(clampValue(5, 0, 10)).toBe(5);
        expect(clampValue(-3, 0, 10)).toBe(0);
        expect(clampValue(99, 0, 10)).toBe(10);
    });

    it('computeAxisBound should return the offset range that keeps the handle within the margins', function () {
        const bound = computeAxisBound({ handleSize: 14, handleStart: 100, margin: 20, position: 0, viewportSize: 1000 });
        expect(bound.min).toBe(-80); // margin - offset = 20 - 100
        expect(bound.max).toBe(866); // viewport - margin - handleSize - offset = 1000 - 20 - 14 - 100
    });

    it('computeAxisBound should be invariant to the current position offset', function () {
        // Same handle, but currently translated by +50 (so its measured start is +50 too).
        const bound = computeAxisBound({ handleSize: 14, handleStart: 150, margin: 20, position: 50, viewportSize: 1000 });
        expect(bound.min).toBe(-80);
        expect(bound.max).toBe(866);
    });

    it('computeAxisBound should floor max to min when the viewport is too small', function () {
        const bound = computeAxisBound({ handleSize: 300, handleStart: 0, margin: 20, position: 0, viewportSize: 100 });
        expect(bound.min).toBe(20);
        expect(bound.max).toBe(20);
    });
});
