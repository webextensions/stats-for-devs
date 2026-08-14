# stats-for-devs

[![CI](https://github.com/webextensions/stats-for-devs/actions/workflows/ci.yml/badge.svg)](https://github.com/webextensions/stats-for-devs/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

A floating, draggable dev HUD - "stats for devs", in the spirit of YouTube's "stats for nerds" - showing live
viewport, breakpoint, responsiveness, mobile-input, device-orientation, performance and interaction metrics
for the page you are working on. Plus optional visual page aids: outline-all, a 44px tap-target checker, a
cursor crosshair, a focused-element highlight, and a sensor-driven bubble level.

It is a dev-only tool and it looks like one: a fixed dark, deliberately theme-independent overlay that stays
readable on top of whatever you are building.

- Drops into **any** page with one `<script>` tag - no build step, no install, no framework.
- Or install it and `import` it - `react` / `react-dom` come from your project (they are `peerDependencies`).
- Renders nothing until you show it.

## Install

```sh
npm install --save-dev stats-for-devs
```

Or skip installing entirely and use the drop-in build from a CDN (see below).

## Usage

There are four ways in, in increasing order of control.

### 1. A single script tag (any page, any framework, no build)

```html
<script src="https://unpkg.com/stats-for-devs"></script>
<script>statsForDevs.show();</script>
```

This build is self-contained: React and every other dependency is bundled in, and the stylesheet is injected
by the JS. There is nothing else to load. It works over `file://` too - see [demo/demo.html](demo/demo.html).

### 2. Import for the side effect

```js
import 'stats-for-devs/auto';
import 'stats-for-devs/style.css';
```

Two lines in your entry file: the first mounts the overlay (nothing renders until it is shown), the second is
its stylesheet - the npm builds do not inject styles.

### 3. Mount it yourself

```js
import { mountStatsForDevs } from 'stats-for-devs';
import 'stats-for-devs/style.css';

mountStatsForDevs();
```

`mountStatsForDevs()` is idempotent and self-mounting: it creates its own `<div id="stats-for-devs-root">` and
its own React root, so it is independent of your component tree and providers - while your existing React is
reused (`react` / `react-dom` are peers, never bundled into the npm builds).

To make the `Build` metric report something, pass `buildInfo` - only your app knows its own build mode:

```js
mountStatsForDevs({
    buildInfo: () => `${import.meta.env.DEV ? 'dev' : 'prod'}${import.meta.hot ? ' HMR' : ''}`
});
```

### 4. Render it inside your own React tree

```jsx
import { StatsForDevsRoot } from 'stats-for-devs';
import 'stats-for-devs/style.css';

const App = function () {
    return (
        <>
            <YourApp />
            <StatsForDevsRoot />
        </>
    );
};
```

`StatsForDevsRoot` is show-gated and keeps the lazy-loading boundary, so it costs nothing until the overlay is
shown. It reads `window.innerWidth` during render, so it is client-only - in Next.js or Remix, mark it
`"use client"` and keep it out of the server pass.

### Build outputs

| Artifact | Format | `react` | For |
| --- | --- | --- | --- |
| `dist/index.js` (+ `index.d.ts`) | ESM | external (peer) | Bundler consumers (the `.` export) |
| `dist/auto.js` (+ `auto.d.ts`) | ESM | external (peer) | The `./auto` side-effect entry |
| `dist/style.css` | CSS | - | Stylesheet for the npm builds (`./style.css` export) |
| `dist/widget.js` | IIFE | bundled (development) | Script-tag debugging (readable, unminified; styles self-injected) |
| `dist/widget.min.js` | IIFE | bundled (production) | Script-tag / CDN use (the `unpkg` / `jsdelivr` target; styles self-injected) |

## Showing and hiding

Three ways, all sharing the same state:

- **From the console**: `window.statsForDevs.show()`
- **From the URL**: add `?statsForDevs=yes` to force it shown on load
- **From your own UI**: the programmatic API below

| `window.statsForDevs` | Purpose |
|---|---|
| `show()` / `hide()` / `toggle()` | Show / hide / toggle the overlay |
| `isShown()` | Whether the overlay is currently shown |

These console controls are installed eagerly, so they work even before the overlay's lazily-loaded chunk
arrives. In the drop-in build the global carries the whole API as well: `mount()`, `unmount()`,
`setBuildInfo()` and `subscribe()`.

## Programmatic API

| Export | Purpose |
|---|---|
| `mountStatsForDevs(options?)` | Self-mount the overlay. Idempotent. `options.buildInfo` feeds the `Build` metric |
| `unmountStatsForDevs()` | Remove the overlay and its container; a later mount starts fresh |
| `StatsForDevsRoot` | The show-gated React component, for rendering inside your own tree |
| `getShown()` / `setShown(next)` / `toggleShown()` | Read and drive visibility |
| `subscribe(listener)` | Observe visibility changes; returns a disposer. No React required |
| `useStatsForDevsShown()` | React hook form of the same, via `useSyncExternalStore` |
| `getAllMetrics()` / `getAllMetricIds()` | Inspect the metric registry |
| `setBuildInfo(next)` | Update the `Build` metric after mounting |
| `installStatsForDevsWindowApi()` | Install `window.statsForDevs` (mounting already does this) |
| `DEFAULT_SETTINGS` / `normalizeSettings(persisted)` | The settings model |

TypeScript declarations are included, and `window.statsForDevs` is typed (as optional - it only exists once the
package has loaded).

## Metrics

All settings, including which of these are shown, live behind the gear icon in the overlay's own header.

### Layout and viewport

| Metric id | Label |
|---|---|
| `viewportSize` | Viewport |
| `dpr` | Device pixel ratio |
| `activeBreakpoint` | Active breakpoint |
| `orientation` | Orientation |
| `scrollbarWidth` | Scrollbar width |
| `safeAreaInsets` | Safe-area insets |

### Responsiveness

| Metric id | Label |
|---|---|
| `dvh` / `svh` / `lvh` | Dynamic / small / large viewport height |
| `urlBarDelta` | URL bar |
| `matchedBreakpoints` | Matched breakpoints |
| `pointerType` | Pointer type |
| `anyHover` | Any-hover |
| `touchPoints` | Touch pts |

### Mobile input

| Metric id | Label |
|---|---|
| `pinchZoomScale` | Pinch-zoom scale |
| `virtualKeyboard` | Virtual keyboard |
| `scrollVelocity` | Scroll velocity |

### Device orientation

| Metric id | Label | Notes |
|---|---|---|
| `orientationAngles` | Orientation angles | `deviceorientation` alpha / beta / gamma, as `a173 b12 g-4` |
| `screenOrientation` | Screen orientation | `screen.orientation` type and angle |
| `motionAcceleration` | Accel (m/s^2) | `devicemotion` acceleration including gravity |
| `motionRotationRate` | Rotation (deg/s) | `devicemotion` rotation rate (gyroscope) |
| `compassHeading` | Compass | Degrees clockwise from north + cardinal direction; needs an absolute source |

These rows stay visible where sensors cannot deliver and say why: `n/a` (API absent), `needs https` (sensors
require a secure context), `tap to enable` (iOS 13+ - tap any sensor row to trigger the permission prompt;
it must come from a tap), `denied` (grant refused; sticky until reload), or `no data` (API present but silent,
which is the normal desktop case).

### Performance

| Metric id | Label | Notes |
|---|---|---|
| `jsHeapMb` | JS heap (MB) | Chromium-only (`performance.memory`); hidden where unavailable |
| `longTasks` | Long tasks | Needs `PerformanceObserver('longtask')` - unsupported in Safari and Firefox, where it stays at 0 |
| `domNodes` | DOM nodes | |

These three are numeric, so they get a sparkline of their recent history and can be given a threshold (in the
settings) above which the value turns red.

### Interaction and DOM

| Metric id | Label | Notes |
|---|---|---|
| `mouseCoords` | Pointer | |
| `scrollPosition` | Scroll position | |
| `focusedElement` | Focused element | |
| `hoveredElement` | Hovered element | Needs *Inspect mode* set to `live` or `pick` in the settings |

### Readouts

| Metric id | Label | Notes |
|---|---|---|
| `connection` | Connection | Uses `navigator.connection` where available |
| `uptime` | Uptime and clock | |
| `storageSize` | localStorage | Approximate size and key count |
| `build` | Build | Shows `n/a` unless you pass `buildInfo` |

### Presets

| Preset | Metrics |
|---|---|
| `none` | nothing |
| `minimal` (default) | `activeBreakpoint`, `viewportSize` |
| `common` | the minimal set plus `build`, `connection`, `dpr`, `matchedBreakpoints`, `orientation`, `pointerType` |
| `extensive` | 29 of the 33 |
| `all` | everything |

### Breakpoints

`activeBreakpoint` and `matchedBreakpoints` use the widely-used 5-step scale, which matches Tailwind's
defaults:

| Name | Min width |
|---|---|
| `base` | 0 |
| `sm` | 640px |
| `md` | 768px |
| `lg` | 1024px |
| `xl` | 1280px |
| `2xl` | 1536px |

This is currently fixed rather than configurable.

## Visual page aids

Toggleable in the settings; each one draws directly on the page rather than through React, and tears down
cleanly when switched off.

- **Outline all elements** - an injected stylesheet outlining every element.
- **Tap-target checker (44px)** - flags interactive elements smaller than the 44px guideline.
- **Cursor crosshair and ruler** - pointer-following guide lines with a coordinate label.
- **Focused-element highlight** - a box around whatever currently has focus.
- **Tilt indicator (bubble level)** - a top-center bubble level driven by the device-orientation sensors; shows
  `no sensor data` until the sensors deliver (see the Device orientation metric notes above).

## Settings and persistence

Two localStorage keys, both written only when you change something:

| Key | Contents |
|---|---|
| `statsForDevs.shown` | `yes` / `no` - whether the overlay is shown |
| `statsForDevs.settings` | Selected metrics, preset, panel position and size, opacity, font scale, docked corner, update rate, thresholds, visual aids |

Older or partial saved shapes are tolerated: anything missing falls back to the defaults, and a corrupt value
falls back to the whole default set rather than throwing.

## Styling

The overlay is deliberately theme-independent - fixed dark translucent chrome with hardcoded colors, so it
stays legible on any page and does not restyle itself while you toggle the very theme, spacing and font-size
preferences it is reporting. See
[docs/because/theme-independent-styling.md](docs/because/theme-independent-styling.md).

- Its font size is driven by its own **Font scale** slider (`--overlayFontScale`), independent of the page.
- Class names are prefixed `sfd-` and have no build hash, so they are stable and safe to target.
- The container is `#stats-for-devs-root` and the drag handle is `#sfd-drag-handle`.
- The overlay sits at z-index `2147483630`, the visual aids at `2147483640`, and the inspect highlight at
  `2147483646`. If you run another tool that parks itself at the top of the stacking order, expect them to
  compete.
- The npm builds do not inject styles - import `stats-for-devs/style.css` once (see Usage above). The drop-in
  build **does** inject its styles as a `<style data-stats-for-devs="1">` element, so a script tag is all it
  needs. If your Content-Security-Policy forbids inline styles, link the shipped file instead and the injector
  will see the sentinel and skip:

  ```html
  <link rel="stylesheet" href="node_modules/stats-for-devs/dist/style.css" data-stats-for-devs="1">
  ```

## The observer effect

Worth knowing before you file a bug: while it is shown, the HUD runs a `requestAnimationFrame` loop at the
configured update rate, and the tap-target and focus aids re-query the document on an interval. It also adds
DOM nodes that it then counts. So the overlay measurably perturbs `longTasks`, `jsHeapMb` and `domNodes` - those
figures describe your page *with the HUD running on it*. Lower the update rate, or enable fewer metrics, to
reduce its footprint.

## Browser support

Modern evergreen browsers. Individual metrics degrade rather than break: unsupported APIs are either hidden from
the settings list (`jsHeapMb`), silently stay at their initial value (`longTasks`), or report `n/a`. A metric
whose read throws shows `(error)` instead of taking the overlay down with it.

The Device orientation sensors have extra gates: browsers only deliver `deviceorientation` / `devicemotion`
events in a secure context (HTTPS or `localhost`), and iOS 13+ additionally requires a user-gesture permission
grant - tap any sensor row in the HUD to trigger it. The rows spell out the current gate (`needs https`,
`tap to enable`, `denied`, `no data`), so for phone testing over plain LAN HTTP expect `needs https`; use an
HTTPS tunnel or the hosted demo instead.

## Size

| Build | Payload | Gzipped |
|---|---|---|
| Drop-in (`dist/widget.min.js`) | everything bundled, including React | ~77 kB |
| npm build (the `.` export) | eager: mount + visibility store | ~6 kB |
| | lazy: the overlay itself, fetched on first show | ~9 kB |

The npm build additionally resolves `classnames`, `react-draggable` and `use-local-storage-state` from its
`dependencies` (deduped with your project's copies) and `react` / `react-dom` from your project (peers).

## Design notes

- [docs/because/self-contained-decoupling.md](docs/because/self-contained-decoupling.md) - why the overlay self-mounts
  into its own React root, owns its own visibility state, and is safe to ship with React bundled.
- [docs/because/theme-independent-styling.md](docs/because/theme-independent-styling.md) - why it ignores the host page's
  theme.
- [docs/because/widget-standalone-build.md](docs/because/widget-standalone-build.md) - the standalone build's mechanics
  (global name, CSS self-injection, the `?inline` gotcha).

## Development

```sh
npm install
node --run test          # the full health-check suite (lint, typecheck, vitest, build checks, ...)
node --run start         # dev harness at http://localhost:3000/ - renders the HUD from source, with HMR
node --run build:lib     # dist/ (ESM + declarations + style.css + the standalone IIFE twins)
```

After `node --run build:lib`, open [demo/demo.html](demo/demo.html) - it loads the built drop-in bundle
straight off the filesystem and exercises every metric group (see [demo/README.md](demo/README.md)).

To publish: `node --run test`, then `npm version <patch|minor|major>`, then `npm publish` (its `prepack`
rebuilds `dist/` fresh).

## Where to look

- **Vision and the git branching tree** -
  [docs/template-project/README.md](./docs/template-project/README.md)
- **Documentation index (commands, health checks, releases, template sync)** -
  [docs/README.md](./docs/README.md)
- **Customizing a new template/project forked from this branch** -
  [docs/init/CUSTOMIZE/README.md](./docs/init/CUSTOMIZE/README.md)
- **Local setup, style and commit conventions** - [CONTRIBUTING.md](./CONTRIBUTING.md)
- **Agent-facing guide** (Claude Code, Cursor, Codex, ...) - [AGENTS.md](./AGENTS.md)

## Credits

The overlay's seven icons use Material Design icon path data (via `@mui/icons-material`), Copyright (c)
Google LLC / MUI contributors, licensed under the
[Apache License, Version 2.0](https://www.apache.org/licenses/LICENSE-2.0) - see
[frontend/lib/src/statsForDevs/icons/icons.tsx](./frontend/lib/src/statsForDevs/icons/icons.tsx).

## Security

See [SECURITY.md](./SECURITY.md) for how to report vulnerabilities privately.

## License

[MIT](./LICENSE)
