# [`./package.json.ts`](../../../package.json.ts)

Applies to: new project (a new layer branch keeps the family identity and only adds the
dependencies/scripts its layer introduces).

`package.json.ts` is the source of truth - edit it, never `package.json` directly. Update:

- `name` - from `@webextensions/template-javascript-project` to your project name.
- `description` - to describe your project.
- `keywords` - to match your project.
- `homepage`, `repository.url`, `bugs.url` - point to your new repository.
- `author` / `license` - adjust if different from the defaults.
- Publish fields - this branch ships a publishable manifest: `publishConfig` (`"access": "public"`
  for scoped packages), `sideEffects` (only `**/*.css` is side-effectful), `main` / `module` /
  `types` / `exports` (pointing at the tsdown build output in `dist/`; the `"."` export stays a
  plain string instead of a `types`/`default` conditions object because package-cjson alphabetizes
  the generated keys - see the comment in `package.json.ts`), and the `files` allowlist (`dist/` +
  `frontend/lib/src/`, with the `"!**/*.test.*"` negation keeping the colocated tests out;
  `CHANGELOG.md` is listed explicitly because npm does not auto-include it;
  [.npmignore](../../../.npmignore) is only a redundant denylist behind it). A new project points
  them at its real entry points and updates `files` to what it ships. If your project is NOT
  published to npm, add `"private": true` and optionally drop these fields plus the `publint`
  script/check.
- `peerDependencies` - `react` / `react-dom` at `">=18"` (supplied by the consuming project;
  tsdown externalizes every `dependencies` / `peerDependencies` entry automatically). Tighten the
  ranges to what your package actually supports, and drop `react-dom` if nothing needs it anymore
  (e.g. after removing the `mount()`/`unmount()` helpers).
- `engines.node` - the advertised Node floor (consumer-facing when the manifest is published); the
  inline note on the value line in `package.json.ts` states this branch's derivation (here the
  support-policy floor: the lowest still-maintained Node LTS line, since no runtime dependency
  needs more). Set it to your project's own floor - but note that changing it does not change the
  dev/tooling floor: you still develop and run the checks on the pinned Node in
  [.nvmrc](../../../.nvmrc) (CI matrix per
  [.github/workflows/ci.yml](../../../.github/workflows/ci.yml)).
- `dependencies` - add your LIBRARY's runtime dependencies (installed by every consumer) inside
  the marked block. The demo/dev harness's runtime stack deliberately lives in the
  `dependenciesForDemo` variable instead (merged into `devDependencies` - see its comment in
  `package.json.ts`), so consumers of the published package do not install it transitively.

Then regenerate the manifest:

```sh
node --run housekeeping:generate-package-json
npm install   # refresh package-lock.json
```
