# Review Report - Graceful Shutdown (close the HTTP listener and Vite dev servers on SIGTERM/SIGINT)

- **Area:** Node Runtime & Environment
- **Aspect:** "Add graceful shutdown (close the HTTP listener and Vite dev servers on SIGTERM/SIGINT)" - see
  [aspects-to-review-for-abstract-frontend-build.md](../aspects-to-review-for-abstract-frontend-build.md)
- **Status:** Aspirational - the capability does not exist today (tracked in
  [TODO-for-abstract-frontend-build.md](../../specs/todo/TODO-for-abstract-frontend-build.md))
- **Severity:** Medium (dev-loop and deploy correctness), low-cost to fix
- **Reviewed against:** `backend/src/server/*`, `package.json.ts`

---

## Summary

The minimal Express server has **no graceful-shutdown path**. There is no `SIGTERM` / `SIGINT` /
`beforeExit` handler anywhere in `backend/`, and the HTTP listener (plus, in HMR mode, the Vite dev
servers) is created and then discarded - never retained for a later `.close()`. Every process exit
today is abrupt:

- `node --watch` (the dev runner) sends `SIGTERM` to the old process on **every file save** -
  Node's default action terminates it immediately, dropping in-flight requests.
- The unhandled-error path (`handleUnhandledErrors`) calls `process.exit(1)` with no cleanup.

This is low-risk to add and pays off in clean dev restarts and clean container orchestration
(Docker/Kubernetes/PM2 send `SIGTERM` before `SIGKILL`).

---

## Evidence (what the code does today)

### No signal handlers exist in the server

A repo-wide search for `SIGTERM` / `SIGINT` / `beforeExit` / `closeAllConnections` /
`server.close` returns only one hit, and it is unrelated to the server - it lives in the dev
health-check runner:

- [scripts/health-checks/all-is-well.ts:560](../../../scripts/health-checks/all-is-well.ts#L560) -
  `process.on('SIGINT', ...)` exists only so `concurrently` doesn't swallow Ctrl-C during checks.

The server entry point installs only unhandled-error traps, not signal traps:

- [backend/src/server/server.ts:268](../../../backend/src/server/server.ts#L268) calls
  `handleUnhandledErrors()`.
- [backend/src/server/handleUnhandledErrors.ts:14-21](../../../backend/src/server/handleUnhandledErrors.ts#L14-L21)
  registers `unhandledRejection` and `uncaughtException`, both of which call `process.exit(1)`
  immediately ([handleUnhandledErrors.ts:11](../../../backend/src/server/handleUnhandledErrors.ts#L11)) -
  no `server.close()`, no drain.

### The server objects are thrown away

- [backend/src/server/server.ts:217](../../../backend/src/server/server.ts#L217) -
  `const server = useHmr ? sharedHmrHttpServer : http.createServer(exp);` is a local inside
  `application.startAsync`, consumed only by the `error` handler and `server.listen(...)`
  ([server.ts:246](../../../backend/src/server/server.ts#L246)).
- `application.startAsync(...)` **returns nothing**, so the caller in the `import.meta.main` block
  has no handle to close. There is no place that can later call `.close()` on the listener.

In HMR mode there are additional resources - the shared HMR HTTP server
([server.ts:164](../../../backend/src/server/server.ts#L164)) doubles as the listener, and one
Vite dev server is created per bundle config
([server.ts:180-204](../../../backend/src/server/server.ts#L180-L204)), each of which owns an
async `.close()` that is likewise never called (Vite dev servers keep watchers and HMR WebSocket
connections alive).

### The runtime makes restarts frequent

- [package.json.ts:677](../../../package.json.ts#L677) - `server:development:local` runs
  `node --watch --watch-preserve-output ... server.ts`. `node --watch` sends `SIGTERM` to restart
  on each change, so the abrupt-teardown path is hit constantly during normal development, not
  just on deploy.
- [package.json.ts:91](../../../package.json.ts#L91) - `engines.node` is `>=24.15.0`, so the
  modern shutdown APIs (`server.closeAllConnections()` / `server.closeIdleConnections()`,
  available since Node 18.2) can be used unconditionally.

---

## Why this matters

- **In-flight requests are cut.** Without `server.close()` (which stops accepting new connections
  but lets active requests finish), a `SIGTERM` drops responses mid-flight. Under `node --watch`
  this happens on every save; under an orchestrator it happens on every deploy and scale-down.
- **Orchestrators escalate to SIGKILL.** Docker/Kubernetes/PM2 send `SIGTERM`, wait a grace
  period, then `SIGKILL`. With no handler, the app never uses the grace window - it is always
  killed hard.
- **`unhandledRejection` > instant `exit(1)`** means even the existing error path tears down
  abruptly; a shared shutdown routine would let it drain first.

---

## Recommendation

Add a single, idempotent shutdown coordinator and wire all teardown through it. Keep it generic
(this is a template-family base branch merged downstream), parameterized by the resources to
close, so the backend-carrying branches (e.g. `template-web-app`) can register additional closers
(PostgreSQL pool, SQLite handle) without editing core logic.

### Make resources reachable

The blocker today is that the listener and the Vite dev servers never bubble up to a place that
can close them. Keep module-scoped (or `startAsync`-returned) collections:

- the HTTP listener (`server`), covering both the plain and the `sharedHmrHttpServer` case
- the Vite dev servers created in the HMR loop (each has an async `close()`)

### Shutdown sequence (order matters)

- Stop accepting new connections: `server.close()` on the listener.
- Drain: allow in-flight requests a bounded window; then `server.closeAllConnections()` (Node
  18.2+) to force-close stragglers so the process can exit.
- Close the remaining resources (Vite dev servers; downstream branches add DB closers here).
- Exit `0` on a clean shutdown; exit non-zero only if a forced timeout fired.

### Sketch (illustrative, not final)

```ts
// backend/src/server/gracefulShutdown.ts
const SHUTDOWN_TIMEOUT_MS = 10_000; // make configurable via config

const registerGracefulShutdown = function ({ servers, closersAsync }) {
    let shuttingDown = false;

    const shutdownAsync = async function (signal) {
        if (shuttingDown) return;
        shuttingDown = true;
        logger.info(`Received ${signal}, shutting down gracefully...`);

        const forceTimer = setTimeout(function () {
            logger.error('Graceful shutdown timed out; forcing exit');
            process.exit(1); // eslint-disable-line n/no-process-exit
        }, SHUTDOWN_TIMEOUT_MS);
        forceTimer.unref();

        for (const server of servers) {
            server.close();
            server.closeIdleConnections();
        }

        for (const closeAsync of closersAsync) {
            const [err] = await closeAsync();
            if (err) logger.error('Error during shutdown closer', err);
        }

        clearTimeout(forceTimer);
        logger.info('Graceful shutdown complete');
        process.exit(0); // eslint-disable-line n/no-process-exit
    };

    process.on('SIGTERM', () => { shutdownAsync('SIGTERM'); }); // fire-and-forget by design
    process.on('SIGINT', () => { shutdownAsync('SIGINT'); }); // fire-and-forget by design
};

export { registerGracefulShutdown };
```

Notes on conventions to honour when implementing:

- Tuple returns (`[err]` / `[null, result]`) from each closer, logged before returning - matches
  [.claude/rules/error-handling.md](../../../.claude/rules/error-handling.md).
- `Async` suffix on every promise-returning function; `await` every `Async` call. The signal
  callbacks invoke an `Async` function fire-and-forget, so they need a comment justifying it (see
  the Async / Await Discipline section of
  [.claude/rules/eslint-gotchas.md](../../../.claude/rules/eslint-gotchas.md)).
- `process.exit` is gated by `n/no-process-exit`; reuse the existing
  `// eslint-disable-line n/no-process-exit` pattern already present in
  [server.ts](../../../backend/src/server/server.ts#L242).

### Template / forkability considerations

- Keep the timeout (and any "drain enabled" flag) in **config**, not hardcoded.
- Design `closersAsync` as an open list so downstream branches register extra resources (DB pools,
  queues) without diffing core files - minimizes merge conflicts on template sync.
- Have `handleUnhandledErrors` route through the same shutdown coordinator (best-effort, still
  exit non-zero) so there is one teardown path instead of two.

---

## Suggested verification

- **Dev loop:** start `node --run start:server`, hit a slow endpoint, save a file to trigger
  `node --watch` > confirm the in-flight request completes before exit.
- **Signal test:** `kill -TERM <pid>` and Ctrl-C (`SIGINT`) > confirm logs show the drain sequence
  and a clean exit `0`.
- **HMR mode:** repeat with `node --run start:app:use-hmr` to confirm the shared HMR server and
  the per-bundle Vite dev servers also close (no lingering file watchers or HMR sockets).

---

## Related aspects (cross-references)

- **Node Runtime & Environment > "Review unhandled-rejection / uncaught-exception handling"**
  (family-wide [aspects-to-review.md](../aspects-to-review.md)) - share the teardown path with
  `handleUnhandledErrors`.
- **Developer Experience & HMR > "Review the per-bundle Vite dev-server setup in HMR mode"** -
  the dev-server handles needed here are created there.
- **Backend Architecture & Express > "Review the HMR-in-Express integration"** - the shared HMR
  HTTP server is one of the listeners to close.
