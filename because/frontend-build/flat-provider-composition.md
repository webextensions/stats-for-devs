# Providers are composed from a flat list, not hand-written JSX nesting

## Why this exists

React apps accumulate root providers (state stores, theming, query clients, routers), and each one
deepens the hand-written JSX pyramid in the app root. In this repository that nesting is a merge
hazard, not just noise: the template branches built on `abstract-frontend-build` each add their own
providers, and when two branches extend a nested pyramid, git produces ugly, error-prone conflicts.
A flat one-provider-per-line array merges like an import list - branches appending at different
positions auto-merge, and same-position appends conflict on two trivially resolvable lines.

## The decision

- `frontend/src/common/ComposeProviders/ComposeProviders.tsx` folds a flat `ReactElement[]`
  (outermost first) into the nested tree via `reduceRight` + `cloneElement`.
- `frontend/src/App/AppProviders.tsx` holds the app's flat provider list, so all provider churn
  (and any merge conflict) localizes in that one file; `App.tsx` just wraps its content in
  `<AppProviders>`.
- The utility is vendored in-repo instead of installed from npm: research (July 2026) found no
  package in this niche that is both popular and maintained - the ecosystem treats it as a
  copy-paste utility, and a single-maintainer dormant dependency would be a worse supply-chain
  trade than ~20 lines of code.
- JSX elements (not `[Component, props]` tuples) keep full prop type-checking on every line, and
  `cloneElement` keeps the lines cleaner than the wrapper-function alternative
  (`(children) => <X>{children}</X>`), which was considered and skipped. The resulting
  `@eslint-react/no-clone-element` lint warning is accepted: the "fragile code" concern targets
  cloning arbitrary children, not this contained fold over a local list.

## Caveats

- Provider order is semantic: index 0 is the outermost. This list is a deliberate exception to the
  alphabetical-sorting rule - never sort it. After merging branches that both added providers,
  sanity-check the relative order of the newly combined entries (e.g. a theme provider that reads
  from a store must sit inside that store's provider).
- The `key` props on the list entries exist for lint cleanliness; React never renders the array as
  children (it is folded into a single nested element), so no reconciliation depends on them.

## Related files

- `frontend/src/common/ComposeProviders/ComposeProviders.tsx` (the composer + its colocated test)
- `frontend/src/App/AppProviders.tsx` (the flat list)
