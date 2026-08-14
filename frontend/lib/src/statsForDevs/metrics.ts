// The metric registry: every built-in metric plus helpers to read/format values.
//
// Each metric exposes a synchronous `getValue()` (no React, no async) so the throttled snapshot tick in
// `useStatsSnapshot.ts` can read them all in one pass. Event-driven values (pointer / scroll / touch /
// viewport) are read from `trackers.ts` module refs.
//
// This module must stay free of bundler-specific globals (`import.meta.env`, `process.env`, ...). Anything
// only the host application can know - such as its build mode - comes in through the `buildInfo` option
// (see `setBuildInfo` below and `mount.tsx`).

import { describeElement } from './dom.ts';
import type { SensorPermission } from './trackers.ts';
import {
    getDeviceMotion,
    getDeviceOrientation,
    getHoveredElement,
    getLongTaskCount,
    getPointer,
    getScroll,
    getSensorPermissionState,
    getTouch,
    getVisualViewport
} from './trackers.ts';

type MetricGroup =
'deviceOrientation' |
'interaction' |
'layout' |
'mobileInput' |
'performance' |
'readouts' |
'responsive';

type StatMetric = {
    getValue: () => number | string;
    group: MetricGroup;
    id: string;
    isAvailable?: () => boolean;
    label: string;
    // When set, the overlay truncates the displayed value to this many characters (with an ellipsis); the
    // full value is kept for copy-to-clipboard and the row's title tooltip.
    maxDisplayChars?: number;
    numeric?: boolean
};

type PerformanceWithMemory = Performance & {
    memory?: { jsHeapSizeLimit: number; usedJSHeapSize: number }
};
type NavigatorWithConnection = Navigator & {
    connection?: { effectiveType?: string }
};

const METRIC_GROUP_ORDER: MetricGroup[] = [
    'layout',
    'responsive',
    'mobileInput',
    'deviceOrientation',
    'performance',
    'interaction',
    'readouts'
];

const METRIC_GROUP_LABELS: Record<MetricGroup, string> = {
    deviceOrientation: 'Device orientation',
    interaction: 'Interaction & DOM',
    layout: 'Layout & viewport',
    mobileInput: 'Mobile input',
    performance: 'Performance',
    readouts: 'Readouts',
    responsive: 'Responsiveness'
};

const BREAKPOINTS = [
    { label: 'sm', minWidth: 640 },
    { label: 'md', minWidth: 768 },
    { label: 'lg', minWidth: 1024 },
    { label: 'xl', minWidth: 1280 },
    { label: '2xl', minWidth: 1536 }
];

const computeActiveBreakpoint = function (width: number): string {
    let active = 'base';
    for (const breakpoint of BREAKPOINTS) {
        if (width >= breakpoint.minWidth) {
            active = breakpoint.label;
        }
    }
    return active;
};

const getMatchedBreakpoints = function (width: number): string {
    const matched = BREAKPOINTS.filter((breakpoint) => width >= breakpoint.minWidth).map((breakpoint) => breakpoint.label);
    return matched.length ? matched.join(' ') : 'base';
};

const formatBytes = function (bytes: number): string {
    if (bytes < 1024) {
        return `${bytes} B`;
    }
    if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const normalizeAngle = function (degrees: number): number {
    return ((degrees % 360) + 360) % 360;
};

// Order is the compass rose (45-degree steps clockwise from north), not alphabetical
const CARDINAL_DIRECTIONS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

const cardinalFromHeading = function (heading: number): string {
    return CARDINAL_DIRECTIONS[Math.round(normalizeAngle(heading) / 45) % 8];
};

const formatOrientationAngles = function (alpha: number | null, beta: number | null, gamma: number | null): string {
    const formatAngle = (value: number | null) => (value === null ? '?' : String(Math.round(value)));
    return `a${formatAngle(alpha)} b${formatAngle(beta)} g${formatAngle(gamma)}`;
};

const formatXyzTriplet = function (x: number | null, y: number | null, z: number | null): string {
    const formatAxis = (value: number | null) => (value === null ? '?' : value.toFixed(1));
    return `x${formatAxis(x)} y${formatAxis(y)} z${formatAxis(z)}`;
};

// Maps the sensor permission machine (see `trackers.ts`) + first-event flag to the display sentinel;
// null means "real data is available - format it".
const resolveSensorSentinel = function (permission: SensorPermission, hasEvent: boolean): string | null {
    if (permission === 'unsupported') {
        return 'n/a';
    }
    if (permission === 'insecure-context') {
        return 'needs https';
    }
    if (permission === 'needs-permission') {
        return 'tap to enable';
    }
    if (permission === 'denied') {
        return 'denied';
    }
    if (!hasEvent) {
        // API present but silent so far (typical desktop) - or a phone that has not fired yet
        return 'no data';
    }
    return null;
};

// Lazily-created, hidden, fixed-position probe elements used to measure CSS units that only resolve against
// real layout (dynamic viewport units, safe-area insets). They have zero width and never affect scrolling.
const probes: Record<string, HTMLDivElement> = {};

const readProbeHeight = function (key: string, cssHeight: string): number {
    let el = probes[key];
    if (!el) {
        el = document.createElement('div');
        el.style.position = 'fixed';
        el.style.top = '0';
        el.style.left = '0';
        el.style.width = '0';
        el.style.height = cssHeight;
        el.style.visibility = 'hidden';
        el.style.pointerEvents = 'none';
        document.body.append(el);
        probes[key] = el;
    }
    return el.offsetHeight;
};

const getSafeAreaInsets = function (): string {
    let el = probes.safeArea;
    if (!el) {
        el = document.createElement('div');
        el.style.position = 'fixed';
        el.style.top = '0';
        el.style.left = '0';
        el.style.width = '0';
        el.style.height = '0';
        el.style.visibility = 'hidden';
        el.style.pointerEvents = 'none';
        el.style.paddingTop = 'env(safe-area-inset-top)';
        el.style.paddingRight = 'env(safe-area-inset-right)';
        el.style.paddingBottom = 'env(safe-area-inset-bottom)';
        el.style.paddingLeft = 'env(safe-area-inset-left)';
        document.body.append(el);
        probes.safeArea = el;
    }
    const cs = getComputedStyle(el);
    // Computed style lengths carry a "px" suffix, which Number() would reject as NaN
    const parsePxValue = function (value: string): number {
        // eslint-disable-next-line unicorn/prefer-number-coercion -- see the comment above
        return Number.parseInt(value, 10) || 0;
    };
    const top = parsePxValue(cs.paddingTop);
    const right = parsePxValue(cs.paddingRight);
    const bottom = parsePxValue(cs.paddingBottom);
    const left = parsePxValue(cs.paddingLeft);
    return `T${top} R${right} B${bottom} L${left}`;
};

const getVirtualKeyboardState = function (): string {
    const vv = window.visualViewport;
    if (!vv) {
        return 'n/a';
    }
    const delta = Math.round(window.innerHeight - vv.height);
    return delta > 120 ? `open (${delta}px)` : 'closed';
};

const getStorageSize = function (): string {
    let bytes = 0;
    for (let i = 0; i < localStorage.length; i += 1) {
        const key = localStorage.key(i);
        if (key) {
            bytes += key.length + (localStorage.getItem(key) || '').length;
        }
    }
    return `${formatBytes(bytes * 2)} (${localStorage.length})`;
};

// Backs the `build` metric. Only the host application knows its own build mode, so it supplies this via
// `mountStatsForDevs({ buildInfo })`. A function is re-read on every tick, a string is fixed.
//
// A Vite host restores the classic dev/prod/HMR readout with:
//     mountStatsForDevs({ buildInfo: () => `${import.meta.env.DEV ? 'dev' : 'prod'}${import.meta.hot ? ' HMR' : ''}` });
let buildInfo: string | (() => string) | undefined;

const setBuildInfo = function (next: string | (() => string) | undefined) {
    buildInfo = next;
};

const BUILT_IN_METRICS: StatMetric[] = [
    // Layout & viewport
    { getValue: () => `${window.innerWidth} x ${window.innerHeight}`, group: 'layout', id: 'viewportSize', label: 'Viewport' },
    { getValue: () => window.devicePixelRatio, group: 'layout', id: 'dpr', label: 'Device pixel ratio' },
    { getValue: () => computeActiveBreakpoint(window.innerWidth), group: 'layout', id: 'activeBreakpoint', label: 'Active breakpoint' },
    {
        getValue: () => (window.innerWidth >= window.innerHeight ? 'landscape' : 'portrait'),
        group: 'layout',
        id: 'orientation',
        label: 'Orientation'
    },
    {
        getValue: () => `${window.innerWidth - document.documentElement.clientWidth}px`,
        group: 'layout',
        id: 'scrollbarWidth',
        label: 'Scrollbar width'
    },
    { getValue: getSafeAreaInsets, group: 'layout', id: 'safeAreaInsets', label: 'Safe-area insets' },

    // Responsiveness
    { getValue: () => readProbeHeight('dvh', '100dvh'), group: 'responsive', id: 'dvh', label: 'dvh' },
    { getValue: () => readProbeHeight('svh', '100svh'), group: 'responsive', id: 'svh', label: 'svh' },
    { getValue: () => readProbeHeight('lvh', '100lvh'), group: 'responsive', id: 'lvh', label: 'lvh' },
    {
        getValue: () => readProbeHeight('lvh', '100lvh') - readProbeHeight('svh', '100svh'),
        group: 'responsive',
        id: 'urlBarDelta',
        label: 'URL bar'
    },
    { getValue: () => getMatchedBreakpoints(window.innerWidth), group: 'responsive', id: 'matchedBreakpoints', label: 'Matched breakpoints' },
    { getValue: () => (window.matchMedia('(pointer: coarse)').matches ? 'coarse' : 'fine'), group: 'responsive', id: 'pointerType', label: 'Pointer type' },
    { getValue: () => (window.matchMedia('(any-hover: hover)').matches ? 'yes' : 'no'), group: 'responsive', id: 'anyHover', label: 'Any-hover' },
    { getValue: () => `${getTouch().activeTouches}/${navigator.maxTouchPoints}`, group: 'responsive', id: 'touchPoints', label: 'Touch pts' },

    // Mobile input
    { getValue: () => getVisualViewport().scale, group: 'mobileInput', id: 'pinchZoomScale', label: 'Pinch-zoom scale' },
    { getValue: getVirtualKeyboardState, group: 'mobileInput', id: 'virtualKeyboard', label: 'Virtual keyboard' },
    {
        getValue: () => {
            const scroll = getScroll();
            return `${scroll.direction} ${scroll.velocity}px/s`;
        },
        group: 'mobileInput',
        id: 'scrollVelocity',
        label: 'Scroll velocity'
    },

    // Device orientation
    {
        getValue: () => {
            const orientation = getDeviceOrientation();
            return resolveSensorSentinel(getSensorPermissionState(), orientation.hasEvent) ??
            formatOrientationAngles(orientation.alpha, orientation.beta, orientation.gamma);
        },
        group: 'deviceOrientation',
        id: 'orientationAngles',
        label: 'Orientation angles'
    },
    {
        // `screen.orientation` is a live object - read per tick like `viewportSize`; optional-chained for jsdom
        getValue: () => {
            const screenOrientation = window.screen?.orientation;
            return screenOrientation ? `${screenOrientation.type} ${screenOrientation.angle}deg` : 'n/a';
        },
        group: 'deviceOrientation',
        id: 'screenOrientation',
        label: 'Screen orientation'
    },
    {
        getValue: () => {
            const motion = getDeviceMotion();
            return resolveSensorSentinel(getSensorPermissionState(), motion.hasEvent) ??
            formatXyzTriplet(motion.accelX, motion.accelY, motion.accelZ);
        },
        group: 'deviceOrientation',
        id: 'motionAcceleration',
        label: 'Accel (m/s^2)'
    },
    {
        getValue: () => {
            const motion = getDeviceMotion();
            return resolveSensorSentinel(getSensorPermissionState(), motion.hasEvent) ??
            formatXyzTriplet(motion.rotationAlpha, motion.rotationBeta, motion.rotationGamma);
        },
        group: 'deviceOrientation',
        id: 'motionRotationRate',
        label: 'Rotation (deg/s)'
    },
    {
        getValue: () => {
            const orientation = getDeviceOrientation();
            const sentinel = resolveSensorSentinel(getSensorPermissionState(), orientation.hasEvent);
            if (sentinel) {
                return sentinel;
            }
            // iOS `webkitCompassHeading` is already degrees clockwise from north; absolute alpha counts the other way
            const heading = orientation.webkitCompassHeading ??
            (orientation.absoluteAlpha === null ? null : normalizeAngle(360 - orientation.absoluteAlpha));
            if (heading === null) {
                // Events fire but no absolute/compass source (e.g. iOS non-Safari, some desktops)
                return 'n/a';
            }
            const rounded = Math.round(heading) % 360;
            return `${rounded} (${cardinalFromHeading(rounded)})`;
        },
        group: 'deviceOrientation',
        id: 'compassHeading',
        label: 'Compass'
    },

    // Performance
    {
        getValue: () => {
            const memory = (performance as PerformanceWithMemory).memory;
            return memory ? Math.round(memory.usedJSHeapSize / (1024 * 1024)) : 0;
        },
        group: 'performance',
        id: 'jsHeapMb',
        isAvailable: () => Boolean((performance as PerformanceWithMemory).memory),
        label: 'JS heap (MB)',
        numeric: true
    },
    { getValue: getLongTaskCount, group: 'performance', id: 'longTasks', label: 'Long tasks', numeric: true },
    { getValue: () => document.getElementsByTagName('*').length, group: 'performance', id: 'domNodes', label: 'DOM nodes', numeric: true },

    // Interaction & DOM
    {
        getValue: () => {
            const pointer = getPointer();
            return `(${pointer.clientX}, ${pointer.clientY})`;
        },
        group: 'interaction',
        id: 'mouseCoords',
        label: 'Pointer'
    },
    {
        getValue: () => {
            const scroll = getScroll();
            const max = document.documentElement.scrollHeight - window.innerHeight;
            const pct = max > 0 ? Math.round((scroll.y / max) * 100) : 0;
            return `${scroll.y}px (${pct}%)`;
        },
        group: 'interaction',
        id: 'scrollPosition',
        label: 'Scroll position'
    },
    {
        getValue: () => describeElement(document.activeElement),
        group: 'interaction',
        id: 'focusedElement',
        label: 'Focused element',
        maxDisplayChars: 30
    },
    {
        getValue: () => {
            const hovered = getHoveredElement();
            return hovered ? `${hovered.selector} ${hovered.width}x${hovered.height}` : '(inspect off)';
        },
        group: 'interaction',
        id: 'hoveredElement',
        label: 'Hovered element',
        maxDisplayChars: 30
    },

    // Light readouts
    {
        getValue: () => {
            const effectiveType = (navigator as NavigatorWithConnection).connection?.effectiveType;
            return `${navigator.onLine ? 'online' : 'offline'}${effectiveType ? ` (${effectiveType})` : ''}`;
        },
        group: 'readouts',
        id: 'connection',
        label: 'Connection'
    },
    {
        getValue: () => {
            const seconds = Math.floor(performance.now() / 1000);
            const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
            const ss = String(seconds % 60).padStart(2, '0');
            return `${mm}:${ss} | ${new Date().toLocaleTimeString()}`;
        },
        group: 'readouts',
        id: 'uptime',
        label: 'Uptime | clock'
    },
    { getValue: getStorageSize, group: 'readouts', id: 'storageSize', label: 'localStorage' },
    {
        getValue: () => {
            if (typeof buildInfo === 'function') {
                return buildInfo();
            }
            return buildInfo || 'n/a';
        },
        group: 'readouts',
        id: 'build',
        label: 'Build'
    }
];

const getAllMetrics = function (): StatMetric[] {
    return BUILT_IN_METRICS;
};

const getAllMetricIds = function (): string[] {
    return getAllMetrics().map((metric) => metric.id);
};

export type {
    MetricGroup,
    StatMetric
};

export {
    cardinalFromHeading,
    computeActiveBreakpoint,
    formatBytes,
    formatOrientationAngles,
    formatXyzTriplet,
    getAllMetricIds,
    getAllMetrics,
    getMatchedBreakpoints,
    METRIC_GROUP_LABELS,
    METRIC_GROUP_ORDER,
    normalizeAngle,
    resolveSensorSentinel,
    setBuildInfo
};
