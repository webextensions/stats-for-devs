// Single throttled update loop for the overlay. One requestAnimationFrame loop (gated by the configured
// update rate) reads every enabled metric into one snapshot and setStates once per due tick - so the
// overlay re-renders at most `updateRateHz` times per second regardless of pointer/scroll activity.
//
// `enabledMetricIds` and `updateRateHz` are synced into refs via effects so changing them does NOT tear
// down and recreate the loop (or the shared trackers). Numeric metrics also accumulate a small rolling
// history for the sparklines, exposed through React state (never read off a ref during render).

import {
    useEffect,
    useRef,
    useState
} from 'react';

import { getAllMetrics } from './metrics.ts';
import {
    startTrackers,
    stopTrackers
} from './trackers.ts';

type Snapshot = Record<string, number | string>;
type Histories = Record<string, number[]>;
type StatsState = { histories: Histories; snapshot: Snapshot };

const HISTORY_LENGTH = 40;

const intervalForRate = function (updateRateHz: 1 | 4 | 'frame'): number {
    if (updateRateHz === 'frame') {
        return 0;
    }
    return 1000 / updateRateHz;
};

const useStatsSnapshot = function (enabledMetricIds: string[], updateRateHz: 1 | 4 | 'frame'): StatsState {
    const [state, setState] = useState<StatsState>({ histories: {}, snapshot: {} });
    const historiesRef = useRef<Histories>({});
    const enabledRef = useRef(enabledMetricIds);
    const rateRef = useRef(updateRateHz);

    useEffect(function () {
        enabledRef.current = enabledMetricIds;
    }, [enabledMetricIds]);

    useEffect(function () {
        rateRef.current = updateRateHz;
    }, [updateRateHz]);

    useEffect(function () {
        startTrackers();

        let rafId = 0;
        let lastTickTime = 0;

        const loop = function (now: number) {
            if (now - lastTickTime >= intervalForRate(rateRef.current)) {
                lastTickTime = now;

                const metricsById = new Map(getAllMetrics().map((metric) => [metric.id, metric]));
                const histories = historiesRef.current;
                const nextSnapshot: Snapshot = {};
                const nextHistories: Histories = {};

                for (const id of enabledRef.current) {
                    const metric = metricsById.get(id);
                    if (!metric || (metric.isAvailable && !metric.isAvailable())) {
                        continue;
                    }

                    let value: number | string;
                    try {
                        value = metric.getValue();
                    } catch {
                        value = '(error)';
                    }
                    nextSnapshot[id] = value;

                    if (typeof value === 'number' && metric.numeric) {
                        const buffer = histories[id] || [];
                        buffer.push(value);
                        if (buffer.length > HISTORY_LENGTH) {
                            buffer.shift();
                        }
                        histories[id] = buffer;
                        nextHistories[id] = [...buffer];
                    }
                }

                setState({ histories: nextHistories, snapshot: nextSnapshot });
            }

            rafId = requestAnimationFrame(loop);
        };

        rafId = requestAnimationFrame(loop);

        return function () {
            cancelAnimationFrame(rafId);
            stopTrackers();
        };
    }, []);

    return state;
};

export { useStatsSnapshot };
