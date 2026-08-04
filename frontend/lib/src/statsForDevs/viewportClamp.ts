// Pure geometry helpers that keep the overlay's drag handle inside the viewport (with a uniform margin).
//
// Used by `StatsForDevs.tsx`: react-draggable applies a `transform: translate(position.x, position.y)` on
// top of a corner-anchored, position-fixed element. To keep the handle on-screen we constrain the
// position OFFSET (not the screen coordinate). For a given layout/anchor the handle's on-screen offset
// from the position value is constant (`handleStart - position`), so the allowed offset range is derived
// from a single measurement and stays valid until the viewport/layout changes.

type AxisBound = { max: number; min: number };

const clampValue = function (value: number, min: number, max: number): number {
    if (value < min) {
        return min;
    }
    if (value > max) {
        return max;
    }
    return value;
};

// Allowed range for one axis of the position offset such that the handle stays within
// [margin, viewportSize - margin - handleSize] on screen. When the viewport is too small to fit the
// handle plus both margins, `max` is floored to `min` (keep the handle pinned at the leading margin).
const computeAxisBound = function ({
    handleSize,
    handleStart,
    margin,
    position,
    viewportSize
}: {
    handleSize: number;
    handleStart: number;
    margin: number;
    position: number;
    viewportSize: number
}): AxisBound {
    const offset = handleStart - position;
    const min = margin - offset;
    const max = viewportSize - margin - handleSize - offset;
    return {
        max: Math.max(max, min),
        min
    };
};

export {
    clampValue,
    computeAxisBound
};
