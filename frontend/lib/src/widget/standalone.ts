// Standalone (script-tag / CDN) entry - the extra tsdown passes bundle this into dist/widget.js
// and dist/widget.min.js as an IIFE with react / react-dom bundled in (see
// frontend/lib/tsdown.config.ts, where the global name and artifact basename live, and
// docs/because/widget-standalone-build.md for the rationale). Loading the script only DEFINES the
// global (window.StatsForDevs) and never auto-mounts; the consumer calls
// StatsForDevs.mount(el, props) or StatsForDevs.mountInShadowDom(el, props) explicitly.
// Light-DOM mounts still need the dist/style.css <link>; mountInShadowDom carries its styles
// inside the shadow root.
//
// The global is defined twice over, on purpose:
// - tsdown's globalName IIFE wrapper ("var StatsForDevs = ...") covers the classic
//   <script src> load.
// - The explicit globalThis assignment below also covers the artifact being evaluated as a
//   MODULE - e.g. a bundler consumer side-effect-importing "<package>/widget.js" (the exports
//   subpath), where the wrapper's "var" would stay module-scoped and never reach window.
// Keep the property name in sync with GLOBAL_NAME in frontend/lib/tsdown.config.ts (see
// docs/init/CUSTOMIZE/CUSTOMIZE-widget.md).

import {
    mount,
    unmount
} from '../react/mount.tsx';
import { mountInShadowDom } from './mount.tsx';

const api = { mount, mountInShadowDom, unmount };

const globalScope = globalThis as { StatsForDevs?: typeof api };
globalScope.StatsForDevs = api;

export {
    mount,
    unmount
} from '../react/mount.tsx';
export { mountInShadowDom } from './mount.tsx';
