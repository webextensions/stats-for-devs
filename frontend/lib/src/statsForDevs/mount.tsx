import {
    createRoot,
    type Root
} from 'react-dom/client';

import { setBuildInfo } from './metrics.ts';
import { StatsForDevsRoot } from './StatsForDevsRoot.tsx';
import { installStatsForDevsWindowApi } from './windowApi.ts';

// The single integration seam for a host page: self-mount the overlay into its OWN DOM container + React root
// (a second root, stats.js-style). Because it renders in its own root, the overlay is independent of the host
// page - it shares no component tree, no providers and no context, which is also what makes it safe for this
// package to bundle its own copy of React in the standalone build. Idempotent.
//
// This is intentionally tiny: `StatsForDevsRoot` renders nothing (and loads no overlay code) until the
// overlay is shown - the heavy overlay chunk is code-split behind a `React.lazy` boundary inside
// `StatsForDevsRoot`. The `window.statsForDevs` console controls only need the lightweight visibility store,
// so they are installed here eagerly and work before that chunk loads.

type StatsForDevsOptions = {
    // Value for the `Build` metric. Only the host knows its own build mode, so it supplies it here. A
    // function is re-read on every tick; a string is fixed. See `metrics.ts`.
    buildInfo?: string | (() => string)
};

const CONTAINER_ID = 'stats-for-devs-root';

let container: HTMLDivElement | null = null;
let root: Root | null = null;

const mountStatsForDevs = function (options: StatsForDevsOptions = {}) {
    if (typeof document === 'undefined') {
        return;
    }

    // Applied even on a repeat call, so a host can refresh `buildInfo` without unmounting.
    setBuildInfo(options.buildInfo);

    if (container) {
        return;
    }

    installStatsForDevsWindowApi();

    container = document.createElement('div');
    container.id = CONTAINER_ID;
    document.body.append(container);

    root = createRoot(container);
    root.render(<StatsForDevsRoot />);
};

// Tear the overlay down again: unmounts the React root and removes the container, leaving the page as it was.
// A subsequent `mountStatsForDevs()` call mounts afresh. The `window.statsForDevs` controls stay installed
// (they are just the visibility store, and remain useful).
const unmountStatsForDevs = function () {
    if (root) {
        root.unmount();
        root = null;
    }
    if (container) {
        container.remove();
        container = null;
    }
};

export {
    mountStatsForDevs,
    unmountStatsForDevs
};
export type { StatsForDevsOptions };
