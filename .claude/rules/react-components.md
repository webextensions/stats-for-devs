---
description: React component structure, CSS module imports, conditional rendering, and JSX patterns
paths: ["frontend/**/*.jsx", "frontend/**/*.tsx"]
---

# React Component Conventions

## React 19 Idioms (avoid common ESLint errors)

- **Do not** use `React.forwardRef` - React 19 accepts `ref` as a regular prop. Wrapping in
  `forwardRef` triggers `@eslint-react/no-forward-ref`.
- Pass refs via props directly:
  `const Btn = ({ ref, ...rest }: { ref?: Ref<HTMLButtonElement> }) => <button ref={ref} {...rest} />`
- File extension matters: a file containing JSX must be `.tsx`; a file with **no** JSX must be
  `.ts`. Do not create a `.tsx` for plain hooks/utilities. (House convention - the old
  `@eslint-react/naming-convention/filename-extension` lint rule was removed upstream in
  `@eslint-react/eslint-plugin` v5, so nothing enforces this automatically.)
- Components (and non-component exports) mixed in one file trigger
  `react-refresh/only-export-components` (error) - keep components in component-only files so hot
  reload stays reliable.

## Component Structure

- Use function components with destructured props.
- Named exports only - never default exports.
- Two accepted forms:

  ```tsx
  const Component = ({ propA, propB }: { propA: string; propB: number }) => {
      // hooks and state
      // business logic
      return (/* JSX */);
  };
  ```

  ```tsx
  const Component = function ({ propA, propB }: { propA: string; propB: number }) {
      // hooks and state
      // business logic
      return (/* JSX */);
  };
  ```

- Export at end of file: `export { Component };`

## CSS Module Imports

- Named imports only; import only the classes the JSX references right now; alias with the
  `styles_` prefix on name collisions - details and the build-time rationale in
  [css-modules.md](./css-modules.md).

## Conditional Rendering

- Simple: `{condition && <Component />}`
- If-else: use an IIFE pattern.
- Prefer React Fragments (`<>...</>`) for multiple elements.

## Hooks and State

- Hooks must be called unconditionally at the top of the component/hook body - no hooks inside
  `if`, loops, ternaries, after early `return`, or inside event handlers (rule:
  `react-hooks/rules-of-hooks` - not autofixable; see [eslint-gotchas.md](./eslint-gotchas.md)).
- All `useEffect` dependencies must be listed (`react-hooks/exhaustive-deps` warns); clean up
  resources in the returned function.
- Boolean state vars: prefix with `flag` (preferred), `is`, or `has`.
- State libraries at this layer: jotai for UI state (`Atom`-suffixed atoms, registered on the
  explicit store in
  [frontend/src/App/store/jotaiStore.ts](../../frontend/src/App/store/jotaiStore.ts)), zustand
  for app/domain state
  ([frontend/src/App/store/zustandStore.ts](../../frontend/src/App/store/zustandStore.ts)). For
  atom typing (writable vs read-only), see [typescript-gotchas.md](./typescript-gotchas.md).

## Event Handlers

- Define as separate named functions, not inline.
- Prefix with `handle` (e.g., `handleClick`, `handleSubmit`).
- State setters prefixed with `set` (e.g., `setFlagEditMode`).
