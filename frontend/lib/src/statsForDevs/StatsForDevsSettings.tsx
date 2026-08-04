import { type ChangeEvent } from 'react';

import { ChevronLeftIcon } from './icons/icons.tsx';
import {
    getAllMetricIds,
    getAllMetrics,
    METRIC_GROUP_LABELS,
    METRIC_GROUP_ORDER
} from './metrics.ts';
import {
    resolvePresetMetricIds,
    type VisualAids
} from './settings.ts';
import {
    backButton,
    checkbox,
    checkRow,
    checkRowDisabled,
    control,
    controlLabel,
    controlRow,
    group,
    groupTitle,
    numberInput,
    presetButton,
    presetRow,
    range,
    sliderHeader,
    sliderRow,
    sliderValue,
    StatsForDevsSettings as styles_StatsForDevsSettings
} from './StatsForDevsSettings.module.css';
import { useStatsForDevsSettings } from './useSettings.ts';

// Visual page aids, in display order (label + the `visualAids` key it toggles).
const VISUAL_AID_OPTIONS: { key: keyof VisualAids; label: string }[] = [
    { key: 'outlineAll', label: 'Outline all elements' },
    { key: 'tapTargets', label: 'Tap-target checker (44px)' },
    { key: 'crosshair', label: 'Cursor crosshair + ruler' },
    { key: 'focusHighlight', label: 'Focused-element highlight' }
];

// The settings view shown inside the floating overlay (toggled by the header gear). Every setting the overlay
// has lives here, built from native controls styled to match the dark, theme-independent HUD (see
// StatsForDevsSettings.module.css).
const StatsForDevsSettings = function ({ onBack }: { onBack?: () => void }) {
    const { settings, updateSettings } = useStatsForDevsSettings();

    const enabledSet = new Set(settings.enabledMetricIds);
    const allMetrics = getAllMetrics();

    const handleApplyPreset = function (presetId: string) {
        updateSettings({
            activePresetId: presetId,
            enabledMetricIds: resolvePresetMetricIds(presetId, getAllMetricIds())
        });
    };

    const handleToggleMetric = function (id: string, checked: boolean) {
        const next = new Set(settings.enabledMetricIds);
        if (checked) {
            next.add(id);
        } else {
            next.delete(id);
        }
        updateSettings({ activePresetId: null, enabledMetricIds: [...next] });
    };

    const handleThresholdChange = function (id: string, evt: ChangeEvent<HTMLInputElement>) {
        const nextThresholds = { ...settings.thresholds };
        const rawValue = evt.target.value;
        if (rawValue === '') {
            delete nextThresholds[id];
        } else {
            nextThresholds[id] = Number(rawValue);
        }
        updateSettings({ thresholds: nextThresholds });
    };

    const updateRateValue = settings.updateRateHz === 'frame' ? 'frame' : String(settings.updateRateHz);
    const enabledNumericMetrics = allMetrics.filter((metric) => metric.numeric && enabledSet.has(metric.id));

    return (
        <div className={styles_StatsForDevsSettings}>
            {
                onBack &&
                <button type="button" className={backButton} onClick={onBack}>
                    <ChevronLeftIcon />
                    Back to stats
                </button>
            }

            <div className={presetRow}>
                <button type="button" className={presetButton} onClick={() => handleApplyPreset('none')}>None</button>
                <button type="button" className={presetButton} onClick={() => handleApplyPreset('minimal')}>Minimal</button>
                <button type="button" className={presetButton} onClick={() => handleApplyPreset('common')}>Common</button>
                <button type="button" className={presetButton} onClick={() => handleApplyPreset('extensive')}>Extensive</button>
                <button type="button" className={presetButton} onClick={() => handleApplyPreset('all')}>All</button>
            </div>

            {
                METRIC_GROUP_ORDER.map((groupId) => {
                    const groupMetrics = allMetrics.filter((metric) => metric.group === groupId);
                    if (groupMetrics.length === 0) {
                        return null;
                    }
                    return (
                        <div key={groupId} className={group}>
                            <div className={groupTitle}>{METRIC_GROUP_LABELS[groupId]}</div>
                            {
                                groupMetrics.map((metric) => {
                                    const available = !metric.isAvailable || metric.isAvailable();
                                    return (
                                        <label
                                            key={metric.id}
                                            className={available ? checkRow : `${checkRow} ${checkRowDisabled}`}
                                        >
                                            <input
                                                type="checkbox"
                                                className={checkbox}
                                                checked={enabledSet.has(metric.id)}
                                                disabled={!available}
                                                onChange={(evt) => handleToggleMetric(metric.id, evt.target.checked)}
                                            />
                                            <span>{available ? metric.label : `${metric.label} (n/a)`}</span>
                                        </label>
                                    );
                                })
                            }
                        </div>
                    );
                })
            }

            <div className={group}>
                <div className={groupTitle}>Behavior</div>

                <div className={sliderRow}>
                    <div className={sliderHeader}>
                        <span className={controlLabel}>Opacity</span>
                        <span className={sliderValue}>{settings.opacity.toFixed(2)}</span>
                    </div>
                    <input
                        type="range"
                        className={range}
                        min={0.3}
                        max={1}
                        step={0.05}
                        value={settings.opacity}
                        onChange={(evt) => updateSettings({ opacity: Number(evt.target.value) })}
                    />
                </div>

                <div className={sliderRow}>
                    <div className={sliderHeader}>
                        <span className={controlLabel}>Font scale</span>
                        <span className={sliderValue}>{settings.overlayFontScale.toFixed(2)}</span>
                    </div>
                    <input
                        type="range"
                        className={range}
                        min={0.85}
                        max={1.4}
                        step={0.05}
                        value={settings.overlayFontScale}
                        onChange={(evt) => updateSettings({ overlayFontScale: Number(evt.target.value) })}
                    />
                </div>

                <div className={controlRow}>
                    <span className={controlLabel}>Update rate</span>
                    <select
                        className={control}
                        value={updateRateValue}
                        onChange={(evt) => updateSettings({
                            updateRateHz: evt.target.value === 'frame' ? 'frame' : (Number(evt.target.value) as 1 | 4)
                        })}
                    >
                        <option value="frame">Every frame</option>
                        <option value="4">4 per sec</option>
                        <option value="1">1 per sec</option>
                    </select>
                </div>

                <div className={controlRow}>
                    <span className={controlLabel}>Inspect mode</span>
                    <select
                        className={control}
                        value={settings.inspectMode}
                        onChange={(evt) => updateSettings({
                            inspectMode: evt.target.value as 'live' | 'off' | 'pick'
                        })}
                    >
                        <option value="off">Off</option>
                        <option value="live">Live hover</option>
                        <option value="pick">Pick and freeze</option>
                    </select>
                </div>
            </div>

            <div className={group}>
                <div className={groupTitle}>Visual page aids</div>
                {
                    VISUAL_AID_OPTIONS.map((option) => (
                        <label key={option.key} className={checkRow}>
                            <input
                                type="checkbox"
                                className={checkbox}
                                checked={settings.visualAids[option.key]}
                                onChange={(evt) => updateSettings({
                                    visualAids: { ...settings.visualAids, [option.key]: evt.target.checked }
                                })}
                            />
                            <span>{option.label}</span>
                        </label>
                    ))
                }
            </div>

            {
                enabledNumericMetrics.length > 0 &&
                <div className={group}>
                    <div className={groupTitle}>Thresholds (highlight when exceeded)</div>
                    {
                        enabledNumericMetrics.map((metric) => (
                            <div key={metric.id} className={controlRow}>
                                <span className={controlLabel}>{metric.label}</span>
                                <input
                                    className={numberInput}
                                    type="number"
                                    value={settings.thresholds[metric.id] ?? ''}
                                    onChange={(evt) => handleThresholdChange(metric.id, evt)}
                                />
                            </div>
                        ))
                    }
                </div>
            }
        </div>
    );
};

export { StatsForDevsSettings };
