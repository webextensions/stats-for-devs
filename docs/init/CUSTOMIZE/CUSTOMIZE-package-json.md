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
  for scoped packages), `main` / `exports` (pointing at the placeholder `index.js`), and the
  `files` allowlist (`CHANGELOG.md` is listed explicitly because npm does not auto-include it;
  [.npmignore](../../../.npmignore) is only a redundant denylist behind it). A new layer branch
  extends them for its layer (e.g. `bin` for a CLI, a `./lib/*` subpath export); a new project
  points them at its real entry points and updates `files` to what it ships. If your project is
  NOT published to npm, add `"private": true` and optionally drop these fields plus the `publint`
  script/check.
- `engines.node` - the advertised Node floor (consumer-facing when the manifest is published); the
  inline note on the value line in `package.json.ts` states this branch's derivation (here the
  support-policy floor: the lowest still-maintained Node LTS line, since no runtime dependency
  needs more). Set it to your project's own floor - but note that changing it does not change the
  dev/tooling floor: you still develop and run the checks on the pinned Node in
  [.nvmrc](../../../.nvmrc) (CI matrix per
  [.github/workflows/ci.yml](../../../.github/workflows/ci.yml)).
- `dependencies` - add your project's runtime dependencies inside the marked block.

Then regenerate the manifest:

```sh
node --run housekeeping:generate-package-json
npm install   # refresh package-lock.json
```
