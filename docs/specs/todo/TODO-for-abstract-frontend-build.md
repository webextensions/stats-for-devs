# TODO - For `abstract-frontend-build` template base

> TODOs for the `abstract-frontend-build` base branch itself (the shared base of the frontend
> template branches - see [docs/template-project/README.md](../../template-project/README.md)).
>
> Project-specific TODOs live in [TODO.md](./TODO.md).

* Drop `SplitMultiClassAtScopePlugin` (and its test) and revert `cssMinify: 'esbuild'` back to the
  default once the upstream Vite/lightningcss `@scope` bugs are fixed - tracking notes live in the
  REVISIT comments in
  [frontend/build/build-config-generator.ts](../../../frontend/build/build-config-generator.ts)
  and in [frontend/build/build.ts](../../../frontend/build/build.ts).
* Consider a stylelint staged-files health check and Stop-hook stylelint integration (the eslint
  pair has both).
* HTTPS support for the Express server is deliberately absent here - it returns with the
  backend-carrying branches (e.g. `template-web-app`).
