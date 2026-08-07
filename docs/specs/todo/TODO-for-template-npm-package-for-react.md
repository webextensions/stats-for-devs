# TODO - For `template-npm-package-for-react` template

> TODOs for the `template-npm-package-for-react` template branch itself (the React components +
> hooks npm package template - see
> [docs/template-project/README.md](../../template-project/README.md)).
>
> Project-specific TODOs live in [TODO.md](./TODO.md).

* Upstream the `dist/` ignore-list entries added on this branch to `abstract-javascript-project`
  (then merge down) so the shared lists converge again: `dist/` in the `eslint.config.js`
  `globalIgnores` and `dist` in the root `tsconfig.json` `exclude`. They were added here with
  explicit approval despite the root-only model (policy:
  [.claude/skills/skill-update-ignore-rules/SKILL.md](../../../.claude/skills/skill-update-ignore-rules/SKILL.md));
  until upstreamed, template merges may conflict on these two lists.
* Future merges from `abstract-npm-package` will hit modify/delete conflicts on `index.js` and
  `test/index.test.js` (this branch replaced them with the `frontend/lib/` layout) - keep the
  deletions.
* Future merges from `abstract-frontend-build` will conflict on the dependency blocks in
  `package.json.ts`: that family keeps the demo/dev harness's runtime stack (react, express,
  jotai, ...) in `dependencies`, while this branch moved it into the `dependenciesForApp` /
  `dependenciesForServer` categories (mapped to devDependencies) and moved `react` / `react-dom`
  to `peerDependencies` + dev copies - keep this branch's side.
* Consider enabling `isolatedDeclarations` in
  [frontend/lib/tsconfig.json](../../../frontend/lib/tsconfig.json) for faster tsdown declaration
  emits (requires explicit types on every export; tsdown currently falls back to the TypeScript
  compiler for the `.d.ts` bundle).
* Re-verify the `"!**/*.test.*"` negation in the `files` allowlist when the npm major version
  changes - the colocated `frontend/lib/src/` tests staying out of the tarball depends on it
  (guarded today by `npm pack --dry-run` and the `publint` health check).
