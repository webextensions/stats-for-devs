// Lazy, refcounted global listeners feeding the high-frequency / event-driven metrics. Values are written
// into plain module variables (NOT React state) so pointer/scroll/touch activity never triggers a render.
// The throttled snapshot tick in `useStatsSnapshot.ts` reads these getters on its own cadence.
//
// `startTrackers()` / `stopTrackers()` are refcounted so multiple consumers can share one set of listeners.
// Inspect-mode (hovered element) tracking is opt-in via `setInspectMode()` and also draws a highlight box.

import { describeElement } from './dom.ts';
import type { InspectMode } from './settings.ts';

type PointerState = { clientX: number; clientY: number; pageX: number; pageY: number };
type ScrollState = { direction: 'down' | 'idle' | 'left' | 'right' | 'up'; velocity: number; x: number; y: number };
type TouchState = { activeTouches: number };
type VisualViewportState = { height: number; offsetTop: number; scale: number };
type HoveredElementState = { height: number; selector: string; width: number } | null;

const pointerState: PointerState = { clientX: 0, clientY: 0, pageX: 0, pageY: 0 };
const scrollState: ScrollState = { direction: 'idle', velocity: 0, x: 0, y: 0 };
const touchState: TouchState = { activeTouches: 0 };
const visualViewportState: VisualViewportState = { height: 0, offsetTop: 0, scale: 1 };

let longTaskCount = 0;
let longTaskObserver: PerformanceObserver | null = null;
let lastScrollX = 0;
let lastScrollY = 0;
let lastScrollTimestamp = 0;

let hoveredElementState: HoveredElementState = null;
let inspectMode: InspectMode = 'off';
let inspectFrozen = false;
let highlightEl: HTMLDivElement | null = null;
let refCount = 0;

const ensureHighlightEl = function (): HTMLDivElement {
    if (highlightEl) {
        return highlightEl;
    }
    const el = document.createElement('div');
    el.style.position = 'fixed';
    el.style.zIndex = '2147483646';
    el.style.pointerEvents = 'none';
    el.style.border = '1px solid rgb(80 200 255)';
    el.style.background = 'rgb(80 200 255 / 0.15)';
    el.style.borderRadius = '2px';
    el.style.display = 'none';
    document.body.append(el);
    highlightEl = el;
    return el;
};

const updateHoveredFromPoint = function (clientX: number, clientY: number) {
    const el = document.elementFromPoint(clientX, clientY);
    if (!el || (highlightEl && el === highlightEl)) {
        return;
    }
    const rect = el.getBoundingClientRect();
    hoveredElementState = {
        height: Math.round(rect.height),
        selector: describeElement(el),
        width: Math.round(rect.width)
    };

    const box = ensureHighlightEl();
    box.style.display = 'block';
    box.style.left = `${rect.left}px`;
    box.style.top = `${rect.top}px`;
    box.style.width = `${rect.width}px`;
    box.style.height = `${rect.height}px`;
};

const handlePointerMove = function (evt: PointerEvent) {
    pointerState.clientX = Math.round(evt.clientX);
    pointerState.clientY = Math.round(evt.clientY);
    pointerState.pageX = Math.round(evt.pageX);
    pointerState.pageY = Math.round(evt.pageY);

    if (inspectMode !== 'off' && !inspectFrozen) {
        updateHoveredFromPoint(evt.clientX, evt.clientY);
    }
};

const handleScroll = function () {
    const now = performance.now();
    const currentY = window.scrollY;
    const currentX = window.scrollX;
    const deltaY = currentY - lastScrollY;
    const deltaX = currentX - lastScrollX;
    const deltaTime = now - lastScrollTimestamp;

    if (deltaTime > 0) {
        scrollState.velocity = Math.round(Math.abs(deltaY || deltaX) / (deltaTime / 1000));
    }
    if (deltaY !== 0) {
        scrollState.direction = deltaY > 0 ? 'down' : 'up';
    } else if (deltaX !== 0) {
        scrollState.direction = deltaX > 0 ? 'right' : 'left';
    }
    scrollState.x = Math.round(currentX);
    scrollState.y = Math.round(currentY);

    lastScrollY = currentY;
    lastScrollX = currentX;
    lastScrollTimestamp = now;
};

const updateTouchCount = function (evt: TouchEvent) {
    touchState.activeTouches = evt.touches.length;
};

const handleVisualViewportChange = function () {
    const vv = window.visualViewport;
    if (!vv) {
        return;
    }
    visualViewportState.height = Math.round(vv.height);
    visualViewportState.offsetTop = Math.round(vv.offsetTop);
    visualViewportState.scale = Math.round(vv.scale * 100) / 100;
};

const handleInspectClick = function (evt: MouseEvent) {
    if (inspectMode !== 'pick') {
        return;
    }
    evt.preventDefault();
    evt.stopPropagation();
    inspectFrozen = !inspectFrozen;
    if (!inspectFrozen) {
        updateHoveredFromPoint(evt.clientX, evt.clientY);
    }
};

const setInspectMode = function (mode: InspectMode) {
    if (mode === inspectMode) {
        return;
    }
    inspectMode = mode;
    inspectFrozen = false;

    if (mode === 'off') {
        document.removeEventListener('click', handleInspectClick, true);
        hoveredElementState = null;
        if (highlightEl) {
            highlightEl.remove();
            highlightEl = null;
        }
        return;
    }

    if (mode === 'pick') {
        document.addEventListener('click', handleInspectClick, { capture: true });
    } else {
        document.removeEventListener('click', handleInspectClick, true);
    }
};

const startTrackers = function () {
    refCount += 1;
    if (refCount > 1) {
        return;
    }

    lastScrollY = window.scrollY;
    lastScrollX = window.scrollX;
    lastScrollTimestamp = performance.now();
    handleVisualViewportChange();

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('touchstart', updateTouchCount, { passive: true });
    window.addEventListener('touchmove', updateTouchCount, { passive: true });
    window.addEventListener('touchend', updateTouchCount, { passive: true });
    window.addEventListener('touchcancel', updateTouchCount, { passive: true });

    const vv = window.visualViewport;
    if (vv) {
        // visualViewport (pinch-zoom / URL-bar geometry) has no observer API - these events ARE its interface
        // eslint-disable-next-line unicorn/prefer-observer-apis
        vv.addEventListener('resize', handleVisualViewportChange);
        // eslint-disable-next-line unicorn/prefer-observer-apis
        vv.addEventListener('scroll', handleVisualViewportChange);
    }

    try {
        const observer = new PerformanceObserver(function (list) {
            longTaskCount += list.getEntries().length;
        });
        observer.observe({ entryTypes: ['longtask'] });
        longTaskObserver = observer;
    } catch {
        // `longtask` is not supported everywhere (e.g. Safari / Firefox) - the metric just stays at its count.
    }
};

const stopTrackers = function () {
    refCount = Math.max(0, refCount - 1);
    if (refCount > 0) {
        return;
    }

    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('scroll', handleScroll);
    window.removeEventListener('touchstart', updateTouchCount);
    window.removeEventListener('touchmove', updateTouchCount);
    window.removeEventListener('touchend', updateTouchCount);
    window.removeEventListener('touchcancel', updateTouchCount);

    const vv = window.visualViewport;
    if (vv) {
        vv.removeEventListener('resize', handleVisualViewportChange);
        vv.removeEventListener('scroll', handleVisualViewportChange);
    }

    if (longTaskObserver) {
        longTaskObserver.disconnect();
        longTaskObserver = null;
    }

    setInspectMode('off');
};

const getPointer = function (): PointerState {
    return pointerState;
};

const getScroll = function (): ScrollState {
    // Decay velocity / direction to idle when there has been no recent scroll activity.
    if (performance.now() - lastScrollTimestamp > 200) {
        scrollState.velocity = 0;
        scrollState.direction = 'idle';
    }
    return scrollState;
};

const getTouch = function (): TouchState {
    return touchState;
};

const getVisualViewport = function (): VisualViewportState {
    return visualViewportState;
};

const getLongTaskCount = function (): number {
    return longTaskCount;
};

const getHoveredElement = function (): HoveredElementState {
    return hoveredElementState;
};

export {
    getHoveredElement,
    getLongTaskCount,
    getPointer,
    getScroll,
    getTouch,
    getVisualViewport,
    setInspectMode,
    startTrackers,
    stopTrackers
};
