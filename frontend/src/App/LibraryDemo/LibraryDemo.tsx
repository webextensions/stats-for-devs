// Demos the publishable library (frontend/lib/) inside this dev/demo harness app - all via the
// public barrel, but through a relative SOURCE import (not the built dist/), so the dev build and
// HMR pick up library edits instantly without a rebuild:
//
// - In-tree: <StatsForDevsRoot /> rendered inside this React tree, the way a React consumer
//   would; show/hide/toggle drive the shared visibility store.
// - Imperative self-mount: mountStatsForDevs()/unmountStatsForDevs() the way a non-React host
//   would call them - the HUD creates its own container + React root outside this tree. The
//   buildInfo option is demoed here because only the HOST may read import.meta.env (the library
//   source never does - see docs/because/self-contained-decoupling.md).
//
// Both share ONE visibility store and ONE settings blob, so mounting both while shown renders two
// identical overlapping overlays - which is itself a demonstration of the self-contained
// decoupling. The standalone script-tag artifact (dist/widget.js) wraps these same functions -
// see frontend/lib/src/widget/standalone.ts and demo/demo.html at the repo root.

import {
    mountStatsForDevs,
    setShown,
    StatsForDevsRoot,
    toggleShown,
    unmountStatsForDevs
} from '../../../lib/src/index.ts';

const LibraryDemo = function () {
    const handleMountClick = function () {
        mountStatsForDevs({
            buildInfo: () => `${import.meta.env.DEV ? 'dev' : 'prod'}${import.meta.hot ? ' HMR' : ''}`
        });
    };

    return (
        <div>
            <h2>stats-for-devs - in-tree (StatsForDevsRoot)</h2>
            <StatsForDevsRoot />
            <p>
                <button type="button" onClick={() => setShown(true)}>Show</button>
                {' '}
                <button type="button" onClick={() => setShown(false)}>Hide</button>
                {' '}
                <button type="button" onClick={() => toggleShown()}>Toggle</button>
            </p>

            <h2>stats-for-devs - imperative self-mount</h2>
            <p>
                <button type="button" onClick={handleMountClick}>mountStatsForDevs()</button>
                {' '}
                <button type="button" onClick={() => unmountStatsForDevs()}>unmountStatsForDevs()</button>
            </p>
            <p>
                Also try the console (<code>statsForDevs.toggle()</code>) or the{' '}
                <code>?statsForDevs=yes</code> URL param. Settings persist in localStorage.
            </p>
        </div>
    );
};

export { LibraryDemo };
