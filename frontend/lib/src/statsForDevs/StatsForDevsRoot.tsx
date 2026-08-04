import {
    lazy,
    Suspense
} from 'react';

import { useStatsForDevsShown } from './visibility.ts';

// The overlay is code-split here: its chunk (overlay UI, metrics, trackers, registry/window API,
// react-draggable) is fetched only the first time `shown` becomes true. Until then this root
// renders nothing, so none of that script loads.
const StatsForDevsLazy = lazy(async () => ({ default: (await import('./StatsForDevs.tsx')).StatsForDevs }));

const StatsForDevsRoot = function () {
    const shown = useStatsForDevsShown();
    if (!shown) {
        return null;
    }
    return (
        <Suspense fallback={null}>
            <StatsForDevsLazy />
        </Suspense>
    );
};

export { StatsForDevsRoot };
