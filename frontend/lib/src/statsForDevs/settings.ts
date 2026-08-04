// Settings model, defaults, and preset helpers for the floating dev monitor.
//
// This settings blob is persisted via `useLocalStorageState` under `statsForDevs.settings` (see
// `useSettings.ts`); the overlay's show/hide state lives separately in `visibility.ts`.
// Everything here is pure (no DOM / React) so it can be unit-tested directly.

type DockedCorner = 'bottomLeft' | 'bottomRight' | 'topLeft' | 'topRight';
type InspectMode = 'live' | 'off' | 'pick';
type UpdateRate = 1 | 4 | 'frame';

type VisualAids = {
    crosshair: boolean;
    focusHighlight: boolean;
    outlineAll: boolean;
    tapTargets: boolean
};

type StatsForDevsSettings = {
    activePresetId: string | null;
    collapsed: boolean;
    collapsedGroups: Record<string, boolean>;
    dockedCorner: DockedCorner;
    enabledMetricIds: string[];
    inspectMode: InspectMode;
    opacity: number;
    overlayFontScale: number;
    position: { x: number; y: number };
    size: { height: number; width: number } | null;
    thresholds: Record<string, number>;
    updateRateHz: UpdateRate;
    visualAids: VisualAids
};

// Kept small on purpose - the default footprint should be tiny (especially on mobile).
const MINIMAL_METRIC_IDS = ['activeBreakpoint', 'viewportSize'];

// A practical day-to-day set: viewport / breakpoint basics plus connection and build info.
const COMMON_METRIC_IDS = [
    'activeBreakpoint',
    'build',
    'connection',
    'dpr',
    'matchedBreakpoints',
    'orientation',
    'pointerType',
    'viewportSize'
];

// Most metrics, minus the niche / inspect-dependent ones (safe-area, URL-bar delta, long tasks, hovered
// element). "All" (below) additionally includes those plus any custom-registered metrics.
const EXTENSIVE_METRIC_IDS = [
    'activeBreakpoint',
    'anyHover',
    'build',
    'connection',
    'domNodes',
    'dpr',
    'dvh',
    'focusedElement',
    'jsHeapMb',
    'lvh',
    'matchedBreakpoints',
    'mouseCoords',
    'orientation',
    'pinchZoomScale',
    'pointerType',
    'scrollPosition',
    'scrollVelocity',
    'scrollbarWidth',
    'storageSize',
    'svh',
    'touchPoints',
    'uptime',
    'viewportSize',
    'virtualKeyboard'
];

const DEFAULT_VISUAL_AIDS: VisualAids = {
    crosshair: false,
    focusHighlight: false,
    outlineAll: false,
    tapTargets: false
};

const DEFAULT_SETTINGS: StatsForDevsSettings = {
    activePresetId: 'minimal',
    collapsed: false,
    collapsedGroups: {},
    dockedCorner: 'bottomLeft',
    enabledMetricIds: [...MINIMAL_METRIC_IDS],
    inspectMode: 'off',
    opacity: 0.9,
    overlayFontScale: 1,
    position: { x: 0, y: 0 },
    size: null,
    thresholds: {},
    updateRateHz: 4,
    visualAids: { ...DEFAULT_VISUAL_AIDS }
};

// Tolerate older / partial persisted shapes by merging onto the defaults.
const normalizeSettings = function (persisted: Partial<StatsForDevsSettings> | undefined | null): StatsForDevsSettings {
    if (!persisted || typeof persisted !== 'object') {
        return { ...DEFAULT_SETTINGS, visualAids: { ...DEFAULT_VISUAL_AIDS } };
    }

    return {
        ...DEFAULT_SETTINGS,
        ...persisted,
        collapsedGroups: { ...persisted.collapsedGroups },
        enabledMetricIds: Array.isArray(persisted.enabledMetricIds) ?
            [...persisted.enabledMetricIds] :
            [...DEFAULT_SETTINGS.enabledMetricIds],
        position: { ...DEFAULT_SETTINGS.position, ...persisted.position },
        thresholds: { ...persisted.thresholds },
        visualAids: { ...DEFAULT_VISUAL_AIDS, ...persisted.visualAids }
    };
};

// Resolve which metric ids a preset enables. `allMetricIds` is passed in (rather than imported from the
// metric registry) to keep this module free of DOM dependencies and easy to test.
const resolvePresetMetricIds = function (presetId: string | null, allMetricIds: string[]): string[] {
    if (presetId === 'all') {
        return [...allMetricIds];
    }
    if (presetId === 'none') {
        return [];
    }
    if (presetId === 'minimal') {
        return MINIMAL_METRIC_IDS.filter((id) => allMetricIds.includes(id));
    }
    if (presetId === 'common') {
        return COMMON_METRIC_IDS.filter((id) => allMetricIds.includes(id));
    }
    if (presetId === 'extensive') {
        return EXTENSIVE_METRIC_IDS.filter((id) => allMetricIds.includes(id));
    }
    return [];
};

const isThresholdExceeded = function (value: number, threshold: number | undefined): boolean {
    if (typeof threshold !== 'number' || Number.isNaN(threshold)) {
        return false;
    }
    return value > threshold;
};

export {
    DEFAULT_SETTINGS,
    isThresholdExceeded,
    MINIMAL_METRIC_IDS,
    normalizeSettings,
    resolvePresetMetricIds
};
export type {
    DockedCorner,
    InspectMode,
    StatsForDevsSettings,
    UpdateRate,
    VisualAids
};
