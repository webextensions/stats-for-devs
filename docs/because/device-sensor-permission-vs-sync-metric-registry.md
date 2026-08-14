# Device sensors need an async, gesture-gated permission, but the metric registry is synchronous

## What

The Device orientation metrics (`orientationAngles`, `motionAcceleration`, `motionRotationRate`,
`compassHeading`) are backed by `deviceorientation` / `devicemotion` events. On iOS 13+ Safari those events
only fire after `DeviceOrientationEvent.requestPermission()` resolves - an async call the browser rejects
unless it happens synchronously inside a user gesture, and only in a secure context. The registry contract in
[frontend/lib/src/statsForDevs/metrics.ts](../../frontend/lib/src/statsForDevs/metrics.ts) is the opposite:
every metric is a synchronous `getValue()` read on the snapshot tick, with no React and no async.

## Why this shape

The two constraints are reconciled in
[frontend/lib/src/statsForDevs/trackers.ts](../../frontend/lib/src/statsForDevs/trackers.ts) with a
module-level permission state machine plus display sentinels:

- `getSensorPermissionState()` lazily classifies the environment as `unsupported`, `insecure-context`,
  `needs-permission` (iOS), `granted`, or `denied` - a synchronous read the metrics can consult on every tick.
- `resolveSensorSentinel()` (in `metrics.ts`, pure and unit-tested) maps that state plus a per-sensor
  "has an event fired yet" flag to the row text: `n/a` / `needs https` / `tap to enable` / `denied` /
  `no data`.
- The async part lives outside the registry: `requestSensorPermissionAsync()` collects the
  `requestPermission()` promises synchronously (the gesture requirement), and the overlay row itself becomes
  the gesture - while the state is `needs-permission`, tapping any sensor row triggers the request
  (tap-to-grant in `StatsForDevs.tsx`). No React state is involved; the next snapshot tick simply reads the
  updated tracker state.
- `denied` is session-sticky because iOS auto-rejects silent re-requests until the page reloads.

## Alternatives rejected

- **Async metrics** - would break the one-pass snapshot model and complicate every consumer of the registry.
- **Auto-requesting on mount** - iOS rejects `requestPermission()` calls that lack a user gesture, so it can
  never work; it would also burn the one graceful prompt.
- **Hiding the rows via `isAvailable`** - desktop Chrome defines the event constructors but never fires
  events, so hiding would be inconsistent across platforms and would make the feature undiscoverable exactly
  where the grant is needed.

## What would make this unnecessary

A synchronous, gesture-free permission surface (e.g. Permissions API coverage for the sensor events across
engines), or the Generic Sensor API becoming universal - either would let the trackers subscribe
unconditionally and drop the sentinel machine down to `n/a` / `no data`.
