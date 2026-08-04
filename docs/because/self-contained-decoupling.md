# The overlay self-mounts and stays decoupled from the host page

## What

The overlay does not render through the host page's React tree, and `frontend/lib/src/` imports nothing from the host.
Instead:

- It **self-mounts** into its own DOM container and its own React root via `mountStatsForDevs()` (a second
  `createRoot`, stats.js-style).
- Its **show/hide state** lives in a self-contained store, `frontend/lib/src/statsForDevs/visibility.ts` (a plain-JS observable plus
  localStorage `statsForDevs.shown` plus `?statsForDevs=yes`), exposed as `window.statsForDevs.show()/hide()/
  toggle()/isShown()`, a `subscribe()` observer, and a `useStatsForDevsShown()` React hook.
- The whole integration surface for a consumer is therefore one call - or one `<script>` tag.

## Why

Every one of these properties earns something concrete:

- **A separate React root means React can be bundled.** Because the overlay shares no component tree, no
  providers and no context with the page, a second copy of React on the page is harmless - the two never
  interact. That is what makes the self-contained drop-in build possible at all: a single `<script src>` that
  works on a plain HTML page, a Vue app, or anything else, with nothing installed.
- **Owning its visibility means the console API works immediately.** `window.statsForDevs` needs only the
  lightweight store, so it is installed during evaluation, before the overlay's lazily-loaded chunk exists. You
  can type `statsForDevs.show()` the moment the script tag has run.
- **Not touching the host tree means it cannot perturb what it measures.** An earlier version of this code (as
  an in-app component) used a root React `<Profiler>` to count commits; that reached into the app's render tree
  and was removed. The HUD already perturbs the page enough by existing - see the observer-effect note in the
  README - and should not add render-tree overhead on top.

## Invariants

Things that will quietly break the package if changed:

- **No bundler-specific globals in `frontend/lib/src/`** - no `import.meta.env`, no `process.env`, no `__DEV__`. These do not
  merely fail in a published bundle, they *silently constant-fold to the wrong answer*: a `import.meta.env.DEV`
  check baked in at publish time reports `prod` forever inside a consumer's dev server, which is precisely the
  thing only this tool can see. Anything only the host can know arrives through an option instead - that is what
  `mountStatsForDevs({ buildInfo })` exists for.
- **The `React.lazy` boundary in `StatsForDevsRoot.tsx` is load-bearing.** It is what keeps "renders nothing
  until shown" true in bytes as well as pixels. In particular, do not re-export the `StatsForDevs` component
  from `frontend/lib/src/index.ts`: a static export makes it a static import of the entry, collapsing the boundary and pulling
  the whole overlay into every consumer's eager payload. Rolldown says so out loud when it happens
  (`INEFFECTIVE_DYNAMIC_IMPORT`).
- **`frontend/lib/src/` must stay free of Node-only APIs.** It runs in a browser, and is imported (unmounted) during SSR.
- **The localStorage keys, the URL param, the container id and the `sfd-` class prefix are public surface.**
  Consumers script against them and developers have state saved under them.

## Third-party dependencies

The overlay depends on `react-draggable`, `classnames` and `use-local-storage-state` (declared as
`dependencies`; react / react-dom are peers), with the seven icons inlined as local SVG components
(`frontend/lib/src/statsForDevs/icons/` - they were `@mui/icons-material` once, which dragged in
`@mui/material` and Emotion, about 30 kB gzip). The ESM build externalizes the dependencies so consumers
dedupe them; the standalone IIFE twins bundle everything, React included - that bundling is exactly what the
separate-root decoupling above makes harmless.

Shedding the rest - a vanilla-JS build with no React at all, which would take the drop-in bundle to a fraction
of its size - is tracked in [docs/specs/todo/TODO.md](../specs/todo/TODO.md).
