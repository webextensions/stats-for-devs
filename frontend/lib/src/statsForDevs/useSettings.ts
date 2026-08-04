// Wraps the persisted `statsForDevs.settings` blob (localStorage, shared across the overlay and its in-panel
// settings view via `use-local-storage-state`). The overlay's show/hide state lives separately in
// `visibility.ts`.

import { useCallback } from 'react';
import useLocalStorageState from 'use-local-storage-state';

import {
    DEFAULT_SETTINGS,
    normalizeSettings,
    type StatsForDevsSettings
} from './settings.ts';

const useStatsForDevsSettings = function () {
    const [rawSettings, setRawSettings] = useLocalStorageState<StatsForDevsSettings>(
        'statsForDevs.settings',
        { defaultValue: DEFAULT_SETTINGS }
    );

    const settings = normalizeSettings(rawSettings);

    const updateSettings = useCallback(function (changes: Partial<StatsForDevsSettings>) {
        setRawSettings((previous) => ({ ...normalizeSettings(previous), ...changes }));
    }, [setRawSettings]);

    return {
        settings,
        updateSettings
    };
};

export { useStatsForDevsSettings };
