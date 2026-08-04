// Standalone (script-tag / CDN) entry - the extra tsdown passes bundle this into dist/widget.js
// and dist/widget.min.js as a self-contained IIFE (react bundled in, styles self-injected; see
// frontend/lib/tsdown.config.ts, where the global name and artifact basename live, and
// docs/because/widget-standalone-build.md for the rationale). Loaded straight from a page:
//
//     <script src="widget.min.js"></script>
//     <script>statsForDevs.show();</script>
//
// Three things here exist only for this build shape:
//
// - **The global is installed here, synchronously.** `window.statsForDevs` must be usable on the
//   line after the <script> tag, so this module assigns it during evaluation. The global is
//   defined twice over, on purpose:
//     - tsdown's globalName IIFE wrapper ("var statsForDevs = ...") covers the classic
//       <script src> load. The wrapper's assignment runs AFTER this module body, overwriting the
//       merge below with the module's export value - which is why the default export must BE the
//       full api object (a named-exports namespace would clobber it with a frozen namespace).
//     - The explicit assignment below also covers the artifact being evaluated as a MODULE -
//       e.g. a bundler consumer side-effect-importing "<package>/widget.js" (the exports
//       subpath), where the wrapper's "var" stays module-scoped and never reaches window.
//   `installStatsForDevsWindowApi()` and the merge below use Object.assign, so every order
//   converges on the full api. Keep the property name in sync with GLOBAL_NAME in
//   frontend/lib/tsdown.config.ts (see docs/init/CUSTOMIZE/CUSTOMIZE-widget.md).
// - **DOM readiness.** A <script src> in <head> runs before <body> exists, and mounting appends
//   a container to document.body. So mounting is deferred to DOMContentLoaded while the document
//   is still loading. (Auto-mounting is this build's one-script-tag promise; the HUD still
//   renders nothing until shown.)
// - **Style injection.** The page loads no stylesheet, so the compiled CSS ships inside this
//   bundle and is injected at evaluation (see ./injectStyles.ts; a hand-linked
//   [data-stats-for-devs] stylesheet wins).

/* eslint-disable unicorn/no-top-level-side-effects -- this entry's whole purpose is its load-time side effects (see the header) */

import { setBuildInfo } from '../statsForDevs/metrics.ts';
import {
    mountStatsForDevs,
    unmountStatsForDevs
} from '../statsForDevs/mount.tsx';
import {
    getShown,
    setShown,
    subscribe,
    toggleShown
} from '../statsForDevs/visibility.ts';
import { installStatsForDevsWindowApi } from '../statsForDevs/windowApi.ts';
import { injectStatsForDevsStyles } from './injectStyles.ts';

const api = {
    hide: () => setShown(false),
    isShown: getShown,
    mount: mountStatsForDevs,
    setBuildInfo,
    show: () => setShown(true),
    subscribe,
    toggle: toggleShown,
    unmount: unmountStatsForDevs
};

const mountWhenReady = function () {
    if (typeof document === 'undefined') {
        return;
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => mountStatsForDevs(), { once: true });
    } else {
        mountStatsForDevs();
    }
};

installStatsForDevsWindowApi();
if (typeof window !== 'undefined') {
    // eslint-disable-next-line unicorn/no-global-object-property-assignment -- the module-evaluation half of the dual-global pattern (see the header)
    window.statsForDevs = Object.assign(window.statsForDevs || {}, api);
}

injectStatsForDevsStyles();
mountWhenReady();

// The one permitted default export in the library (see the header): the IIFE wrapper must
// receive the api object itself, not a namespace.
// eslint-disable-next-line import-x/no-default-export
export default api;
