import {
    describe,
    expect,
    it
} from 'vitest';

import {
    DEFAULT_SETTINGS,
    isThresholdExceeded,
    MINIMAL_METRIC_IDS,
    normalizeSettings,
    resolvePresetMetricIds
} from './settings.ts';

describe('settings helpers', function () {
    it('normalizeSettings should return defaults for missing input', function () {
        const result = normalizeSettings(undefined);
        expect(result.enabledMetricIds).toEqual(MINIMAL_METRIC_IDS);
        expect(result.opacity).toBe(DEFAULT_SETTINGS.opacity);
        expect(result.visualAids.outlineAll).toBe(false);
        expect(result.visualAids.tiltIndicator).toBe(false);
        expect(result.collapsedGroups).toEqual({});
    });

    it('normalizeSettings should merge partial input onto defaults', function () {
        const result = normalizeSettings({
            collapsedGroups: { responsive: true },
            opacity: 0.5,
            visualAids: { crosshair: true }
        } as never);
        expect(result.opacity).toBe(0.5);
        expect(result.visualAids.crosshair).toBe(true);
        expect(result.visualAids.outlineAll).toBe(false);
        expect(result.dockedCorner).toBe(DEFAULT_SETTINGS.dockedCorner);
        expect(result.collapsedGroups).toEqual({ responsive: true });
    });

    it('resolvePresetMetricIds should resolve the built-in presets', function () {
        const allIds = [
            'activeBreakpoint', 'build', 'connection', 'dpr',
            'matchedBreakpoints', 'orientation', 'pointerType', 'svh', 'viewportSize'
        ];
        expect(resolvePresetMetricIds('all', allIds)).toEqual(allIds);
        expect(resolvePresetMetricIds('none', allIds)).toEqual([]);
        expect(resolvePresetMetricIds('minimal', allIds)).toEqual(['activeBreakpoint', 'viewportSize']);
        expect(resolvePresetMetricIds('common', allIds)).toEqual([
            'activeBreakpoint', 'build', 'connection', 'dpr',
            'matchedBreakpoints', 'orientation', 'pointerType', 'viewportSize'
        ]);
        expect(resolvePresetMetricIds('extensive', allIds).length)
            .toBeGreaterThan(resolvePresetMetricIds('common', allIds).length);
        expect(resolvePresetMetricIds('unknown', allIds)).toEqual([]);
    });

    it('resolvePresetMetricIds should include the device-orientation ids in the extensive preset', function () {
        const sensorIds = [
            'compassHeading', 'motionAcceleration', 'motionRotationRate', 'orientationAngles', 'screenOrientation'
        ];
        const resolved = resolvePresetMetricIds('extensive', sensorIds);
        expect(resolved).toEqual(sensorIds);
    });

    it('isThresholdExceeded should compare against numeric thresholds only', function () {
        expect(isThresholdExceeded(10, 5)).toBe(true);
        expect(isThresholdExceeded(3, 5)).toBe(false);
        expect(isThresholdExceeded(10, undefined)).toBe(false);
        expect(isThresholdExceeded(10, NaN)).toBe(false);
    });
});

// `normalizeSettings` is the package's compatibility layer: it reads whatever is in localStorage under
// `statsForDevs.settings`, which may have been written by an older version or edited by hand. These assert the
// tolerance the README promises.
describe('normalizeSettings tolerance for hostile persisted shapes', function () {
    it('should fall back to defaults for a non-object', function () {
        expect(normalizeSettings('garbage' as never)).toEqual(normalizeSettings(undefined));
        expect(normalizeSettings(null)).toEqual(normalizeSettings(undefined));
    });

    it('should replace a non-array enabledMetricIds with the default set', function () {
        expect(normalizeSettings({ enabledMetricIds: null } as never).enabledMetricIds).toEqual(MINIMAL_METRIC_IDS);
    });

    it('should fill in a partial position', function () {
        const result = normalizeSettings({ position: { x: 5 } } as never);
        expect(result.position.x).toBe(5);
        expect(result.position.y).toBe(DEFAULT_SETTINGS.position.y);
    });

    it('should keep unknown visualAids keys but still default the known ones', function () {
        const result = normalizeSettings({ visualAids: { nonsense: true } } as never);
        expect(result.visualAids.outlineAll).toBe(false);
        expect(result.visualAids.crosshair).toBe(false);
    });

    it('should pass an out-of-range updateRateHz straight through (known gap)', function () {
        // Documents current behaviour rather than endorsing it: `normalizeSettings` spreads `...persisted`, so
        // scalar unions (`updateRateHz`, `dockedCorner`, `inspectMode`) are not validated. The overlay tolerates
        // it - an unexpected rate just means the rAF loop compares against an odd interval - but it should be
        // clamped. Tracked in TODO.md; update this test when it is.
        expect(normalizeSettings({ updateRateHz: 60 } as never).updateRateHz).toBe(60);
    });
});
