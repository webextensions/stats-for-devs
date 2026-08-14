---
description: TypeScript pitfalls observed in first-pass code generation - stale references, unused symbols, escape hatches
paths: ["**/*.cjs", "**/*.cts", "**/*.js", "**/*.jsx", "**/*.mjs", "**/*.mts", "**/*.ts", "**/*.tsx"]
---

# TypeScript Gotchas - Avoid First-Pass Type Errors

These TypeScript errors recur in first-pass code. They are not autofixable; getting them right up
front avoids a typecheck round-trip.

Run `node --run test:types` (or the scoped `node --run test:types:frontend` - the frontend has its
own tsconfig) - do **not** invoke `tsc` directly; the npm scripts encode the intended flags and
project files. This repo is JS-first with `strict: false` ([tsconfig.json](../../tsconfig.json)) -
do not impose strict-mode fixes the checker does not require.

## "Cannot find name" - TS2304 / TS2552

- Every referenced symbol needs an import or local declaration - do not assume helpers exist
  globally.
- After renaming, verify all references - TS2552 (`Did you mean 'X'?`) usually means a stale
  reference survived the rename. Grep for the old name before saving.

## Wrong Overload from Unknown Keys - TS2769

- For library options objects, pass only documented keys - an unknown key makes the call resolve
  against the wrong overload and yields a TS2769 whose message points nowhere near the actual typo.

## Tuple Narrowing

- Destructure async results as `[err, result]` (see [error-handling.md](./error-handling.md)) -
  control-flow narrowing of `result` relies on the explicit `if (err) return ...` check.

## Stale Imports and Locals - TS6133 (`declared but never read`)

- After every edit, remove imports and locals that no longer have a use site.
- Do **not** silence with a `_` prefix unless the symbol is genuinely required by an API contract
  (e.g. a callback signature).

## React 19 Type Patterns (frontend)

- `ref` is a regular prop in React 19. Type it as `Ref<HTMLElementType>`, not via `forwardRef`
  generics (see [react-components.md](./react-components.md)).
- Children type: prefer `ReactNode` from `react`, imported explicitly. Do not assume it is
  globally available.
- Event handlers: type the event parameter (e.g., `(evt: ChangeEvent<HTMLInputElement>) => void`) -
  leaving it implicit triggers `TS7006` "implicitly has 'any'".

## Jotai Atom Typing (writable vs read-only)

- `atom(initialValue)` infers a writable `PrimitiveAtom<T>`; `atom<T>()` with **no** argument (or
  `atom((get) => ...)`) infers a read-only `Atom<T>`. Getting this wrong breaks `useSetAtom` /
  `useAtom` write usage:

  ```ts
  // Good - writable, allows useSetAtom and useAtom write
  const blockerAtom = atom<Blocker | null>(null);

  // Bad - read-only Atom<Blocker>; useSetAtom(blockerAtom) > TS2769
  const blockerAtom = atom<Blocker>();
  ```

- Rule of thumb: if the atom is meant to be set by components, **always provide an initial
  value**, and widen the type with `| null` (or another sentinel) when there is no natural
  initial value.

## Workflow

- After non-trivial edits, run `node --run test:types` once and read the **first** error before
  fixing - later errors are often cascades.
- After a typecheck fix, run `node --run eslint` too - `tsc` does not enforce ESLint-only rules
  (see [eslint-gotchas.md](./eslint-gotchas.md)).
- Do not paper over failures with `as any`, `// @ts-expect-error`, or `// @ts-ignore`. If one is
  truly unavoidable, document why in [docs/because/](../../docs/because/README.md).
