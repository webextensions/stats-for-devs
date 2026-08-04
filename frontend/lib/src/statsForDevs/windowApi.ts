// The `window.statsForDevs` console API - just the overlay visibility controls. It only needs the
// lightweight visibility store, so it is installed eagerly (from `mountStatsForDevs`) and works from the
// console even before the overlay's lazy chunk loads.

import {
    getShown,
    setShown,
    toggleShown
} from './visibility.ts';

type StatsForDevsWindowApi = {
    hide: () => void;
    isShown: () => boolean;
    show: () => void;
    toggle: () => void;

    // Present in the self-contained drop-in build (`dist/stats-for-devs.js`) only, where the global is the
    // whole public API because there is nothing to import. Optional so a React consumer - who installed only
    // the visibility controls above - is not told these exist.
    mount?: (options?: { buildInfo?: string | (() => string) }) => void;
    setBuildInfo?: (next: string | (() => string) | undefined) => void;
    subscribe?: (listener: VoidFunction) => VoidFunction;
    unmount?: () => void
};

declare global {
    interface Window {
        // Optional: the property only exists once this package has been loaded on the page.
        statsForDevs?: StatsForDevsWindowApi
    }
}

let installed = false;

const installStatsForDevsWindowApi = function () {
    if (installed || typeof window === 'undefined') {
        return;
    }
    // Assign onto any existing object rather than replacing it. In the IIFE build the bundle wrapper also
    // assigns `window.statsForDevs` (the module's default export), and the two assignments can happen in
    // either order - merging makes the order irrelevant.
    // eslint-disable-next-line unicorn/no-global-object-property-assignment -- installing window.statsForDevs IS this module's purpose
    window.statsForDevs = Object.assign(window.statsForDevs || {}, {
        hide: () => setShown(false),
        isShown: getShown,
        show: () => setShown(true),
        toggle: toggleShown
    });
    installed = true;
};

export { installStatsForDevsWindowApi };
export type { StatsForDevsWindowApi };
