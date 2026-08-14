// Optional, off-by-default visual debugging aids drawn directly on the page (not via React, since they
// overlay the whole document). Each aid is independently toggleable and tears down cleanly. Driven by
// `settings.visualAids` from the overlay.

import {
    getDeviceOrientation,
    getSensorPermissionState
} from './trackers.ts';

const OVERLAY_Z_INDEX = '2147483640';
const TAP_TARGET_MIN_PX = 44;
const INTERACTIVE_SELECTOR = 'a, button, input, select, textarea, [role="button"], [tabindex]';

// --- Outline all elements -------------------------------------------------------------------------------

let outlineStyleEl: HTMLStyleElement | null = null;

const setOutlineAll = function (enabled: boolean) {
    if (enabled) {
        if (outlineStyleEl) {
            return;
        }
        const style = document.createElement('style');
        style.textContent = '* { outline: 1px solid rgb(255 80 80 / 0.35) !important; }';
        document.head.append(style);
        outlineStyleEl = style;
    } else if (outlineStyleEl) {
        outlineStyleEl.remove();
        outlineStyleEl = null;
    }
};

// --- Tap-target size checker ----------------------------------------------------------------------------

let tapTargetContainer: HTMLDivElement | null = null;
let tapTargetIntervalId = 0;

const renderTapTargets = function (container: HTMLDivElement) {
    container.textContent = '';
    const elements = document.querySelectorAll(INTERACTIVE_SELECTOR);
    for (const el of elements) {
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) {
            continue;
        }
        if (rect.width >= TAP_TARGET_MIN_PX && rect.height >= TAP_TARGET_MIN_PX) {
            continue;
        }
        const marker = document.createElement('div');
        marker.style.position = 'fixed';
        marker.style.left = `${rect.left}px`;
        marker.style.top = `${rect.top}px`;
        marker.style.width = `${rect.width}px`;
        marker.style.height = `${rect.height}px`;
        marker.style.border = '1px dashed rgb(255 170 0)';
        marker.style.background = 'rgb(255 170 0 / 0.15)';
        marker.style.boxSizing = 'border-box';
        container.append(marker);
    }
};

const setTapTargets = function (enabled: boolean) {
    if (enabled) {
        if (tapTargetContainer) {
            return;
        }
        const container = document.createElement('div');
        container.style.position = 'fixed';
        container.style.inset = '0';
        container.style.zIndex = OVERLAY_Z_INDEX;
        container.style.pointerEvents = 'none';
        document.body.append(container);
        tapTargetContainer = container;
        renderTapTargets(container);
        tapTargetIntervalId = window.setInterval(() => renderTapTargets(container), 1000);
    } else {
        if (tapTargetIntervalId) {
            window.clearInterval(tapTargetIntervalId);
            tapTargetIntervalId = 0;
        }
        if (tapTargetContainer) {
            tapTargetContainer.remove();
            tapTargetContainer = null;
        }
    }
};

// --- Cursor crosshair + ruler ---------------------------------------------------------------------------

let crosshairContainer: HTMLDivElement | null = null;
let crosshairVertical: HTMLDivElement | null = null;
let crosshairHorizontal: HTMLDivElement | null = null;
let crosshairLabel: HTMLDivElement | null = null;

const handleCrosshairMove = function (evt: PointerEvent) {
    if (!crosshairVertical || !crosshairHorizontal || !crosshairLabel) {
        return;
    }
    crosshairVertical.style.left = `${evt.clientX}px`;
    crosshairHorizontal.style.top = `${evt.clientY}px`;
    crosshairLabel.style.left = `${evt.clientX + 8}px`;
    crosshairLabel.style.top = `${evt.clientY + 8}px`;
    crosshairLabel.textContent = `${evt.clientX}, ${evt.clientY}`;
};

const setCrosshair = function (enabled: boolean) {
    if (enabled) {
        if (crosshairContainer) {
            return;
        }
        const container = document.createElement('div');
        container.style.position = 'fixed';
        container.style.inset = '0';
        container.style.zIndex = OVERLAY_Z_INDEX;
        container.style.pointerEvents = 'none';

        const vertical = document.createElement('div');
        vertical.style.position = 'fixed';
        vertical.style.top = '0';
        vertical.style.bottom = '0';
        vertical.style.width = '1px';
        vertical.style.background = 'rgb(80 200 255 / 0.6)';

        const horizontal = document.createElement('div');
        horizontal.style.position = 'fixed';
        horizontal.style.left = '0';
        horizontal.style.right = '0';
        horizontal.style.height = '1px';
        horizontal.style.background = 'rgb(80 200 255 / 0.6)';

        const label = document.createElement('div');
        label.style.position = 'fixed';
        label.style.font = '11px monospace';
        label.style.color = 'rgb(255 255 255)';
        label.style.background = 'rgb(0 0 0 / 0.7)';
        label.style.padding = '1px 4px';
        label.style.borderRadius = '3px';

        container.append(vertical, horizontal, label);
        document.body.append(container);

        crosshairContainer = container;
        crosshairVertical = vertical;
        crosshairHorizontal = horizontal;
        crosshairLabel = label;

        window.addEventListener('pointermove', handleCrosshairMove, { passive: true });
    } else {
        window.removeEventListener('pointermove', handleCrosshairMove);
        if (crosshairContainer) {
            crosshairContainer.remove();
        }
        crosshairContainer = null;
        crosshairVertical = null;
        crosshairHorizontal = null;
        crosshairLabel = null;
    }
};

// --- Focused-element highlight --------------------------------------------------------------------------

let focusBox: HTMLDivElement | null = null;
let focusIntervalId = 0;

const updateFocusBox = function () {
    if (!focusBox) {
        return;
    }
    const active = document.activeElement;
    if (!active || active === document.body) {
        focusBox.style.display = 'none';
        return;
    }
    const rect = active.getBoundingClientRect();
    focusBox.style.display = 'block';
    focusBox.style.left = `${rect.left}px`;
    focusBox.style.top = `${rect.top}px`;
    focusBox.style.width = `${rect.width}px`;
    focusBox.style.height = `${rect.height}px`;
};

const setFocusHighlight = function (enabled: boolean) {
    if (enabled) {
        if (focusBox) {
            return;
        }
        const box = document.createElement('div');
        box.style.position = 'fixed';
        box.style.zIndex = OVERLAY_Z_INDEX;
        box.style.pointerEvents = 'none';
        box.style.border = '2px solid rgb(180 120 255)';
        box.style.borderRadius = '2px';
        box.style.display = 'none';
        document.body.append(box);
        focusBox = box;

        document.addEventListener('focusin', updateFocusBox);
        document.addEventListener('focusout', updateFocusBox);
        focusIntervalId = window.setInterval(updateFocusBox, 500);
        updateFocusBox();
    } else {
        document.removeEventListener('focusin', updateFocusBox);
        document.removeEventListener('focusout', updateFocusBox);
        if (focusIntervalId) {
            window.clearInterval(focusIntervalId);
            focusIntervalId = 0;
        }
        if (focusBox) {
            focusBox.remove();
            focusBox = null;
        }
    }
};

// --- Tilt indicator (bubble level) ----------------------------------------------------------------------
// Reads the device-orientation tracker state instead of owning a listener: an own listener would
// re-create the whole iOS permission problem (no user gesture to request from). Aids are only
// toggleable from the mounted overlay, whose snapshot hook keeps the refcounted trackers running.

let tiltContainer: HTMLDivElement | null = null;
let tiltBubble: HTMLDivElement | null = null;
let tiltLabel: HTMLDivElement | null = null;
let tiltIntervalId = 0;

const TILT_SIZE_PX = 96;
const TILT_BUBBLE_PX = 14;
// Angles at or beyond this pin the bubble to the circle's edge
const TILT_MAX_DEG = 45;

const updateTiltIndicator = function () {
    if (!tiltBubble || !tiltLabel) {
        return;
    }
    const orientation = getDeviceOrientation();
    if (getSensorPermissionState() !== 'granted' || !orientation.hasEvent ||
    orientation.beta === null || orientation.gamma === null) {
        tiltBubble.style.display = 'none';
        tiltLabel.textContent = 'no sensor data';
        return;
    }
    const clampTilt = function (degrees: number): number {
        return Math.max(-TILT_MAX_DEG, Math.min(TILT_MAX_DEG, degrees));
    };
    const radius = (TILT_SIZE_PX - TILT_BUBBLE_PX) / 2;
    const offsetX = (clampTilt(orientation.gamma) / TILT_MAX_DEG) * radius;
    const offsetY = (clampTilt(orientation.beta) / TILT_MAX_DEG) * radius;
    tiltBubble.style.display = 'block';
    tiltBubble.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
    tiltLabel.textContent = `b${Math.round(orientation.beta)} g${Math.round(orientation.gamma)}`;
};

const setTiltIndicator = function (enabled: boolean) {
    if (enabled) {
        if (tiltContainer) {
            return;
        }
        const container = document.createElement('div');
        container.style.position = 'fixed';
        container.style.top = '8px';
        container.style.left = '50%';
        container.style.transform = 'translateX(-50%)';
        container.style.zIndex = OVERLAY_Z_INDEX;
        container.style.pointerEvents = 'none';
        container.style.textAlign = 'center';

        const circle = document.createElement('div');
        circle.style.position = 'relative';
        circle.style.width = `${TILT_SIZE_PX}px`;
        circle.style.height = `${TILT_SIZE_PX}px`;
        circle.style.margin = '0 auto';
        circle.style.border = '1px solid rgb(80 200 255 / 0.8)';
        circle.style.borderRadius = '50%';
        circle.style.background = 'rgb(0 0 0 / 0.25)';

        const crossVertical = document.createElement('div');
        crossVertical.style.position = 'absolute';
        crossVertical.style.left = '50%';
        crossVertical.style.top = '0';
        crossVertical.style.bottom = '0';
        crossVertical.style.width = '1px';
        crossVertical.style.background = 'rgb(80 200 255 / 0.3)';

        const crossHorizontal = document.createElement('div');
        crossHorizontal.style.position = 'absolute';
        crossHorizontal.style.top = '50%';
        crossHorizontal.style.left = '0';
        crossHorizontal.style.right = '0';
        crossHorizontal.style.height = '1px';
        crossHorizontal.style.background = 'rgb(80 200 255 / 0.3)';

        const bubble = document.createElement('div');
        bubble.style.position = 'absolute';
        bubble.style.left = `${(TILT_SIZE_PX - TILT_BUBBLE_PX) / 2}px`;
        bubble.style.top = `${(TILT_SIZE_PX - TILT_BUBBLE_PX) / 2}px`;
        bubble.style.width = `${TILT_BUBBLE_PX}px`;
        bubble.style.height = `${TILT_BUBBLE_PX}px`;
        bubble.style.borderRadius = '50%';
        bubble.style.background = 'rgb(80 200 255 / 0.9)';
        bubble.style.display = 'none';

        const label = document.createElement('div');
        label.style.display = 'inline-block';
        label.style.marginTop = '4px';
        label.style.font = '11px monospace';
        label.style.color = 'rgb(255 255 255)';
        label.style.background = 'rgb(0 0 0 / 0.7)';
        label.style.padding = '1px 4px';
        label.style.borderRadius = '3px';

        circle.append(crossVertical, crossHorizontal, bubble);
        container.append(circle, label);
        document.body.append(container);

        tiltContainer = container;
        tiltBubble = bubble;
        tiltLabel = label;

        updateTiltIndicator();
        tiltIntervalId = window.setInterval(updateTiltIndicator, 100);
    } else {
        if (tiltIntervalId) {
            window.clearInterval(tiltIntervalId);
            tiltIntervalId = 0;
        }
        if (tiltContainer) {
            tiltContainer.remove();
        }
        tiltContainer = null;
        tiltBubble = null;
        tiltLabel = null;
    }
};

export {
    setCrosshair,
    setFocusHighlight,
    setOutlineAll,
    setTapTargets,
    setTiltIndicator
};
