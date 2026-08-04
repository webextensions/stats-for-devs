// Library entry point - the package's public API. tsdown bundles this into dist/index.js (the
// "." export in package.json.ts) with bundled type declarations (dist/index.d.ts); react /
// react-dom stay external and resolve from the consuming project (see "peerDependencies" in
// package.json.ts). Named exports only - no default export.
//
// This module is deliberately side-effect free: importing it mounts nothing and touches no DOM,
// so it is safe under SSR and for consumers that only want the visibility store or the metric
// registry. To mount by import alone, use the `stats-for-devs/auto` entry (./auto.ts) instead;
// the standalone script-tag entry (./widget/standalone.ts) is its own tsdown entry and
// deliberately NOT re-exported here.
//
// The blank lines between the export groups are load-bearing: `simple-import-sort` sorts within
// a group, so they are what keeps each comment attached to the exports it describes.

// Mounting - the usual entry point.
export type { StatsForDevsOptions } from './statsForDevs/mount.tsx';
export { mountStatsForDevs, unmountStatsForDevs } from './statsForDevs/mount.tsx';

// For React hosts that would rather render the HUD inside their own tree than let it self-mount. It is
// show-gated and keeps the `React.lazy` boundary, so it costs nothing until the overlay is shown.
//
// The overlay component itself (`StatsForDevs`) is deliberately NOT re-exported here. Doing so makes it a
// static import of this entry, which collapses the lazy boundary and pulls the whole overlay chunk into every
// consumer's eager payload - the exact cost this package is built to avoid. (Rolldown says so out loud:
// "INEFFECTIVE_DYNAMIC_IMPORT ... also statically imported by src/index.ts".)
export { StatsForDevsRoot } from './statsForDevs/StatsForDevsRoot.tsx';

// Show / hide, for driving the overlay from your own UI. `subscribe` is the framework-agnostic observer;
// `useStatsForDevsShown` is the React adapter.
export {
    getShown,
    setShown,
    subscribe,
    toggleShown,
    useStatsForDevsShown
} from './statsForDevs/visibility.ts';

// The `window.statsForDevs` console controls. `mountStatsForDevs()` installs these already; this is exposed
// for hosts that render `<StatsForDevsRoot />` themselves and still want the console API.
export type { StatsForDevsWindowApi } from './statsForDevs/windowApi.ts';
export { installStatsForDevsWindowApi } from './statsForDevs/windowApi.ts';

// Metric registry introspection, plus `setBuildInfo` for updating the `Build` metric after mount.
export type { MetricGroup, StatMetric } from './statsForDevs/metrics.ts';
export { getAllMetricIds, getAllMetrics, setBuildInfo } from './statsForDevs/metrics.ts';

// The settings model. Settings are normally edited inside the overlay itself (header gear); these are here so
// a host can read the persisted shape or seed its own defaults.
export type {
    DockedCorner,
    InspectMode,
    StatsForDevsSettings,
    UpdateRate,
    VisualAids
} from './statsForDevs/settings.ts';
export { DEFAULT_SETTINGS, normalizeSettings } from './statsForDevs/settings.ts';
