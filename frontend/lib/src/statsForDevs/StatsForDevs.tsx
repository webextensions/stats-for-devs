import classNames from 'classnames';
import React, {
    type CSSProperties,
    useCallback,
    useEffect,
    useLayoutEffect,
    useRef,
    useState
} from 'react';
import Draggable, {
    type DraggableBounds,
    type DraggableData,
    type DraggableEvent
} from 'react-draggable';

import { hasPersistentScrollbar } from './dom.ts';
import {
    CloseIcon,
    ContentCopyIcon,
    DragIndicatorIcon,
    ExpandMoreIcon,
    SettingsIcon,
    UnfoldLessIcon
} from './icons/icons.tsx';
import {
    computeActiveBreakpoint,
    getAllMetrics,
    METRIC_GROUP_LABELS,
    METRIC_GROUP_ORDER
} from './metrics.ts';
import {
    isThresholdExceeded,
    type StatsForDevsSettings
} from './settings.ts';
import { Sparkline } from './Sparkline/Sparkline.tsx';
import {
    body,
    caretCollapsed,
    cornerBottomLeft,
    cornerBottomRight,
    cornerTopLeft,
    cornerTopRight,
    customScrollbar,
    danger,
    grip,
    groupHeader,
    groupHeaderCaret,
    groupSection,
    headerButtons,
    iconButton,
    iconButtonActive,
    labelCell,
    pill,
    resizeHandle,
    row,
    rowTappable,
    StatsForDevs as styles_StatsForDevs,
    title as titleClass,
    titleRow,
    valueCell,
    valueText
} from './StatsForDevs.module.css';
import { StatsForDevsSettings as StatsForDevsSettingsView } from './StatsForDevsSettings.tsx';
import {
    getSensorPermissionState,
    requestSensorPermissionAsync,
    setInspectMode
} from './trackers.ts';
import { useStatsForDevsSettings } from './useSettings.ts';
import { useStatsSnapshot } from './useStatsSnapshot.ts';
import {
    clampValue,
    computeAxisBound
} from './viewportClamp.ts';
import { setShown } from './visibility.ts';
import {
    setCrosshair,
    setFocusHighlight,
    setOutlineAll,
    setTapTargets,
    setTiltIndicator
} from './visualAids.ts';

const CORNER_CLASS = {
    bottomLeft: cornerBottomLeft,
    bottomRight: cornerBottomRight,
    topLeft: cornerTopLeft,
    topRight: cornerTopRight
};

// Max pointer travel (px) for a press to still count as a tap (expand) rather than a drag (reposition).
// Generous enough to tolerate finger jitter on touch devices.
const TAP_MAX_MOVE_PX = 8;

// The drag handle (grip when expanded, the whole pill when collapsed) must always stay at least this far
// inside every viewport edge, so it can never be dragged or restored out of reach.
const HANDLE_VIEWPORT_MARGIN_PX = 20;

// Minimum panel size when resizing via the custom bottom-right handle.
const MIN_PANEL_WIDTH_PX = 160;
const MIN_PANEL_HEIGHT_PX = 80;

const StatsForDevs = function () {
    const { settings, updateSettings } = useStatsForDevsSettings();
    const { histories, snapshot } = useStatsSnapshot(settings.enabledMetricIds, settings.updateRateHz);

    const panelRef = useRef<HTMLDivElement>(null);
    // Drag-start position, used to tell a tap from a drag in `onStop` (see handleDragStop).
    const dragStartRef = useRef({ x: 0, y: 0 });
    const [flagCopied, setFlagCopied] = useState(false);
    // Ephemeral: the overlay always opens on the stats view; the gear toggles the in-overlay settings view.
    const [flagSettingsView, setFlagSettingsView] = useState(false);
    // Detected once: only style the scrollbar dark on platforms with persistent (space-occupying) scrollbars.
    const [flagPersistentScrollbar] = useState(hasPersistentScrollbar);

    // Custom pointer-event resize (native CSS `resize` does not respond to touch). `liveSize` drives the
    // panel while resizing; the committed value is persisted to `settings.size` on pointer up.
    const [liveSize, setLiveSize] = useState<{ height: number; width: number } | null>(null);
    const resizeStartRef = useRef<{
        height: number;
        pointerX: number;
        pointerY: number;
        startPosX: number;
        startPosY: number;
        width: number
    } | null>(null);
    const lastResizeSizeRef = useRef<{ height: number; width: number } | null>(null);

    // Controlled drag position (react-draggable). `positionRef` mirrors it so the resize/load clamp can read
    // the latest value without re-subscribing. `bounds` is the live hard-stop fed to <Draggable>.
    const [position, setPosition] = useState(settings.position);
    const positionRef = useRef(settings.position);
    const [bounds, setBounds] = useState<DraggableBounds | false>(false);

    const applyPosition = useCallback(function (next: { x: number; y: number }) {
        positionRef.current = next;
        setPosition(next);
    }, []);

    // Apply the visual page aids whenever their toggles change, and tear them all down on unmount.
    useEffect(function () {
        setOutlineAll(settings.visualAids.outlineAll);
        setTapTargets(settings.visualAids.tapTargets);
        setCrosshair(settings.visualAids.crosshair);
        setFocusHighlight(settings.visualAids.focusHighlight);
        setTiltIndicator(settings.visualAids.tiltIndicator);
    }, [
        settings.visualAids.crosshair,
        settings.visualAids.focusHighlight,
        settings.visualAids.outlineAll,
        settings.visualAids.tapTargets,
        settings.visualAids.tiltIndicator
    ]);

    useEffect(function () {
        return function () {
            setOutlineAll(false);
            setTapTargets(false);
            setCrosshair(false);
            setFocusHighlight(false);
            setTiltIndicator(false);
        };
    }, []);

    // Drive the trackers' inspect mode (hovered-element selector + highlight box).
    useEffect(function () {
        setInspectMode(settings.inspectMode);
        return function () {
            setInspectMode('off');
        };
    }, [settings.inspectMode]);

    // Keep the drag handle inside the viewport (uniform 20px margin) on load, on resize / rotation, AND
    // whenever the panel's own size changes. The panel is corner-anchored (bottom-left by default), so a
    // change in panel height moves the grip relative to the anchor and invalidates the measured offset -
    // critically, the panel starts empty and grows once metrics populate on the first tick. A
    // `ResizeObserver` keeps the bounds in sync with the grip's actual position. `useLayoutEffect` measures
    // and corrects before paint, so a clamp never flashes on screen.
    useLayoutEffect(function () {
        const recomputeAndClamp = function () {
            const handleEl = document.getElementById('sfd-drag-handle');
            if (!handleEl) {
                return;
            }
            const rect = handleEl.getBoundingClientRect();
            const current = positionRef.current;
            const xBound = computeAxisBound({
                handleSize: rect.width,
                handleStart: rect.left,
                margin: HANDLE_VIEWPORT_MARGIN_PX,
                position: current.x,
                viewportSize: window.innerWidth
            });
            const yBound = computeAxisBound({
                handleSize: rect.height,
                handleStart: rect.top,
                margin: HANDLE_VIEWPORT_MARGIN_PX,
                position: current.y,
                viewportSize: window.innerHeight
            });

            setBounds({ bottom: yBound.max, left: xBound.min, right: xBound.max, top: yBound.min });

            const clampedX = clampValue(current.x, xBound.min, xBound.max);
            const clampedY = clampValue(current.y, yBound.min, yBound.max);
            if (clampedX !== current.x || clampedY !== current.y) {
                applyPosition({ x: clampedX, y: clampedY });
                updateSettings({ position: { x: clampedX, y: clampedY } });
            }
        };

        recomputeAndClamp();

        const panelEl = panelRef.current;
        const resizeObserver = (panelEl && typeof ResizeObserver !== 'undefined') ?
            new ResizeObserver(recomputeAndClamp) :
            null;
        if (resizeObserver && panelEl) {
            resizeObserver.observe(panelEl);
        }

        // VIEWPORT-size changes have no observer API (the panel's own size IS observed, above)
        // eslint-disable-next-line unicorn/prefer-observer-apis
        window.addEventListener('resize', recomputeAndClamp);
        window.addEventListener('orientationchange', recomputeAndClamp);
        return function () {
            if (resizeObserver) {
                resizeObserver.disconnect();
            }
            window.removeEventListener('resize', recomputeAndClamp);
            window.removeEventListener('orientationchange', recomputeAndClamp);
        };
    }, [applyPosition, settings.collapsed, settings.overlayFontScale, updateSettings]);

    const cornerClass = CORNER_CLASS[settings.dockedCorner];

    const overlayStyle = { opacity: settings.opacity } as CSSProperties & Record<string, number | string>;
    overlayStyle['--overlayFontScale'] = settings.overlayFontScale;

    const handleDragStart = function (_evt: DraggableEvent, data: DraggableData) {
        dragStartRef.current = { x: data.x, y: data.y };
    };

    const handleDrag = function (_evt: DraggableEvent, data: DraggableData) {
        // `data` is already constrained to `bounds` by react-draggable, so this is the live hard-stop.
        applyPosition({ x: data.x, y: data.y });
    };

    const handleDragStop = function (_evt: DraggableEvent, data: DraggableData) {
        applyPosition({ x: data.x, y: data.y });
        const movedDistance = Math.hypot(data.x - dragStartRef.current.x, data.y - dragStartRef.current.y);
        const changes: Partial<StatsForDevsSettings> = { position: { x: data.x, y: data.y } };
        // A near-stationary press on the collapsed pill is a tap -> expand. Deciding by drag DISTANCE
        // (instead of a click event) makes tap-to-expand reliable on touch, where the finger always jitters
        // slightly and a synthetic click may not fire after a drag gesture.
        if (settings.collapsed && movedDistance < TAP_MAX_MOVE_PX) {
            changes.collapsed = false;
        }
        updateSettings(changes);
    };

    if (settings.collapsed) {
        return (
            <Draggable
                handle="#sfd-drag-handle"
                nodeRef={panelRef}
                position={position}
                bounds={bounds}
                onStart={handleDragStart}
                onDrag={handleDrag}
                onStop={handleDragStop}
            >
                <div
                    id="sfd-drag-handle"
                    ref={panelRef}
                    className={classNames(pill, cornerClass)}
                    style={overlayStyle}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(evt) => {
                        if (evt.key === 'Enter' || evt.key === ' ') {
                            updateSettings({ collapsed: false });
                        }
                    }}
                >
                    {`${computeActiveBreakpoint(window.innerWidth)} | ${window.innerWidth} x ${window.innerHeight}`}
                </div>
            </Draggable>
        );
    }

    const panelStyle = { ...overlayStyle } as CSSProperties & Record<string, number | string>;
    const effectiveSize = liveSize || settings.size;
    if (effectiveSize) {
        panelStyle.width = effectiveSize.width;
        panelStyle.height = effectiveSize.height;
    }

    const enabledSet = new Set(settings.enabledMetricIds);
    const visibleMetrics = getAllMetrics().filter((metric) => {
        return enabledSet.has(metric.id) && (!metric.isAvailable || metric.isAvailable());
    });

    const handleResizePointerDown = function (evt: React.PointerEvent<HTMLDivElement>) {
        const el = panelRef.current;
        if (!el) {
            return;
        }
        evt.stopPropagation();
        resizeStartRef.current = {
            height: el.offsetHeight,
            pointerX: evt.clientX,
            pointerY: evt.clientY,
            startPosX: positionRef.current.x,
            startPosY: positionRef.current.y,
            width: el.offsetWidth
        };
        evt.currentTarget.setPointerCapture(evt.pointerId);
    };

    const handleResizePointerMove = function (evt: React.PointerEvent<HTMLDivElement>) {
        const start = resizeStartRef.current;
        if (!start) {
            return;
        }
        const width = clampValue(start.width + (evt.clientX - start.pointerX), MIN_PANEL_WIDTH_PX, window.innerWidth);
        const height = clampValue(start.height + (evt.clientY - start.pointerY), MIN_PANEL_HEIGHT_PX, window.innerHeight);

        // The panel is corner-anchored, so on the anchored edge(s) a size change would otherwise grow away
        // from the resize handle (e.g. with the default bottom-left anchor, increasing height moves the TOP
        // up while the bottom stays put). Translate the panel by the size delta on those edges so the
        // top-left corner stays fixed and the bottom-right handle tracks the pointer as expected.
        const flagBottomAnchored = settings.dockedCorner === 'bottomLeft' || settings.dockedCorner === 'bottomRight';
        const flagRightAnchored = settings.dockedCorner === 'bottomRight' || settings.dockedCorner === 'topRight';
        const nextX = flagRightAnchored ? start.startPosX + (width - start.width) : start.startPosX;
        const nextY = flagBottomAnchored ? start.startPosY + (height - start.height) : start.startPosY;

        lastResizeSizeRef.current = { height, width };
        setLiveSize({ height, width });
        applyPosition({ x: nextX, y: nextY });
    };

    const handleResizePointerUp = function (evt: React.PointerEvent<HTMLDivElement>) {
        if (!resizeStartRef.current) {
            return;
        }
        resizeStartRef.current = null;
        try {
            evt.currentTarget.releasePointerCapture(evt.pointerId);
        } catch {
            // Pointer may already be released; ignore.
        }
        if (lastResizeSizeRef.current) {
            updateSettings({ position: positionRef.current, size: lastResizeSizeRef.current });
            setLiveSize(null);
        }
    };

    const handleCopy = function () {
        const text = visibleMetrics
            .map((metric) => `${metric.label}: ${snapshot[metric.id] ?? ''}`)
            .join('\n');
        // Fire-and-forget from a sync click handler; an async handler would need awaiting per the
        // async-protect conventions for no benefit here
        navigator.clipboard.writeText(text)
            // eslint-disable-next-line unicorn/prefer-await
            .then(() => {
                setFlagCopied(true);
                window.setTimeout(() => setFlagCopied(false), 1200);
                return undefined;
            })
            // eslint-disable-next-line unicorn/prefer-await
            .catch(() => {
                // Clipboard can be blocked (permissions / insecure context); silently ignore in this dev tool.
            });
    };

    const handleToggleGroup = function (groupId: string) {
        updateSettings({
            collapsedGroups: { ...settings.collapsedGroups, [groupId]: settings.collapsedGroups[groupId] !== true }
        });
    };

    const handleSensorPermissionTap = function () {
        // Fire-and-forget from a sync click handler: requestPermission() must be invoked synchronously
        // within the user gesture (iOS), and the row re-renders from tracker state on the next snapshot
        // tick. The function never rejects (error-tuple convention), so there is nothing to catch.
        void requestSensorPermissionAsync();
    };

    const handleSensorPermissionKeyDown = function (evt: React.KeyboardEvent<HTMLDivElement>) {
        if (!(evt.key === 'Enter' || evt.key === ' ')) {
            return;
        }

        evt.preventDefault();
        handleSensorPermissionTap();
    };

    return (
        <Draggable
            handle="#sfd-drag-handle"
            nodeRef={panelRef}
            position={position}
            bounds={bounds}
            onStart={handleDragStart}
            onDrag={handleDrag}
            onStop={handleDragStop}
        >
            <div
                ref={panelRef}
                className={classNames(styles_StatsForDevs, cornerClass)}
                style={panelStyle}
            >
                <div className={titleRow}>
                    <span id="sfd-drag-handle" className={grip} aria-label="Drag">
                        <DragIndicatorIcon />
                    </span>
                    <span className={titleClass}>{flagSettingsView ? 'Settings' : 'Stats for devs'}</span>
                    <span className={headerButtons}>
                        <button
                            type="button"
                            className={classNames(iconButton, flagSettingsView && iconButtonActive)}
                            title={flagSettingsView ? 'Back to stats' : 'Settings'}
                            aria-pressed={flagSettingsView}
                            onClick={() => setFlagSettingsView((flag) => !flag)}
                        >
                            <SettingsIcon />
                        </button>
                        {
                            !flagSettingsView &&
                            <button
                                type="button"
                                className={iconButton}
                                title={flagCopied ? 'Copied' : 'Copy stats'}
                                onClick={handleCopy}
                            >
                                <ContentCopyIcon />
                            </button>
                        }
                        <button
                            type="button"
                            className={iconButton}
                            title="Collapse"
                            onClick={() => updateSettings({ collapsed: true })}
                        >
                            <UnfoldLessIcon />
                        </button>
                        <button
                            type="button"
                            className={iconButton}
                            title="Hide overlay"
                            onClick={() => setShown(false)}
                        >
                            <CloseIcon />
                        </button>
                    </span>
                </div>

                <div className={classNames(body, flagPersistentScrollbar && customScrollbar)}>
                    {
                        flagSettingsView &&
                        <StatsForDevsSettingsView onBack={() => setFlagSettingsView(false)} />
                    }
                    {
                        !flagSettingsView &&
                        visibleMetrics.length === 0 &&
                        <div className={row}>No metrics selected. Tap the gear icon above.</div>
                    }
                    {
                        !flagSettingsView &&
                        METRIC_GROUP_ORDER.map((group) => {
                            const groupMetrics = visibleMetrics.filter((metric) => metric.group === group);
                            if (groupMetrics.length === 0) {
                                return null;
                            }
                            const groupCollapsed = settings.collapsedGroups[group] === true;
                            return (
                                <section key={group} className={groupSection}>
                                    <div
                                        className={groupHeader}
                                        role="button"
                                        tabIndex={0}
                                        aria-expanded={!groupCollapsed}
                                        onClick={() => handleToggleGroup(group)}
                                        onKeyDown={(evt) => {
                                            if (!(evt.key === 'Enter' || evt.key === ' ')) {
                                                return;
                                            }

                                            evt.preventDefault();
                                            handleToggleGroup(group);
                                        }}
                                    >
                                        <span>{METRIC_GROUP_LABELS[group]}</span>
                                        <ExpandMoreIcon className={classNames(groupHeaderCaret, groupCollapsed && caretCollapsed)} />
                                    </div>
                                    {
                                        !groupCollapsed &&
                                        groupMetrics.map((metric) => {
                                            const value = snapshot[metric.id];
                                            if (value === undefined) {
                                                return null;
                                            }
                                            const exceeded = typeof value === 'number' &&
                                            isThresholdExceeded(value, settings.thresholds[metric.id]);
                                            const history = histories[metric.id];
                                            const rawText = String(value);
                                            const displayText = (metric.maxDisplayChars && rawText.length > metric.maxDisplayChars) ?
                                                `${rawText.slice(0, metric.maxDisplayChars)}...` :
                                                rawText;
                                            // Any sensor row doubles as the iOS permission trigger while the
                                            // grant is pending (its value shows the 'tap to enable' sentinel)
                                            const flagTapToGrant = metric.group === 'deviceOrientation' &&
                                            getSensorPermissionState() === 'needs-permission';
                                            return (
                                                <div
                                                    key={metric.id}
                                                    className={classNames(row, flagTapToGrant && rowTappable)}
                                                    {
                                                        ...(
                                                            flagTapToGrant && {
                                                                onClick: handleSensorPermissionTap,
                                                                onKeyDown: handleSensorPermissionKeyDown,
                                                                role: 'button',
                                                                tabIndex: 0,
                                                                title: 'Tap to enable device sensors'
                                                            }
                                                        )
                                                    }
                                                >
                                                    <span className={labelCell}>{metric.label}</span>
                                                    <span className={classNames(valueCell, exceeded && danger)}>
                                                        {
                                                            Boolean(history && metric.numeric) &&
                                                            <Sparkline values={history} />
                                                        }
                                                        <span className={valueText} title={rawText}>{displayText}</span>
                                                    </span>
                                                </div>
                                            );
                                        })
                                    }
                                </section>
                            );
                        })
                    }
                </div>

                <div
                    className={resizeHandle}
                    aria-label="Resize"
                    onPointerDown={handleResizePointerDown}
                    onPointerMove={handleResizePointerMove}
                    onPointerUp={handleResizePointerUp}
                    onPointerCancel={handleResizePointerUp}
                />
            </div>
        </Draggable>
    );
};

export { StatsForDevs };
