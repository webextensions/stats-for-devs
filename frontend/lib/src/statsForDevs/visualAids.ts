// Optional, off-by-default visual debugging aids drawn directly on the page (not via React, since they
// overlay the whole document). Each aid is independently toggleable and tears down cleanly. Driven by
// `settings.visualAids` from the overlay.

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

export {
    setCrosshair,
    setFocusHighlight,
    setOutlineAll,
    setTapTargets
};
