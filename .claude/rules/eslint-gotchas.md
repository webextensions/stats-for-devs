---
description: Non-autofixable ESLint rules that commonly trip up first-pass code generation
paths: ["**/*.cjs", "**/*.cts", "**/*.js", "**/*.jsx", "**/*.mjs", "**/*.mts", "**/*.ts", "**/*.tsx"]
---

# ESLint Gotchas - Get These Right on First Pass

These rules are **not autofixable**, so violations survive `node --run eslint:fix` and require
manual correction. Internalize them when writing new code.

## Banned Identifiers

- `id-denylist` bans `e`, `event`, `raw`, `location` (each entry in
  [eslint.config.js](../../eslint.config.js) documents its reason). Use `err`, `evt`, the fully
  named field, and a non-conflicting name respectively.

## String Methods

- Use `String#slice()`, never `String#substring()`. Rule: `unicorn/prefer-string-slice`.

## Multi-line Operator Placement

- Place binary operators at the **end** of the previous line, not the start of the next. Rules:
  `@stylistic/operator-linebreak`, `@stylistic/indent-binary-ops`.

  ```js
  // Good
  const total = subtotal +
      tax +
      shipping;

  // Bad - operator at start of line
  const total = subtotal
      + tax
      + shipping;
  ```

## `__dirname` in ES Modules

- `no-restricted-globals` bans bare `__dirname` in ES module files (`.js`, `.mjs`, `.mts`, `.ts`);
  CommonJS files (`.cjs`, `.cts`) are unaffected. In ES modules, use `import.meta.dirname`.

## Imports and References

- Do not import symbols speculatively - `no-unused-vars` / `@typescript-eslint/no-unused-vars` are
  not autofixable. Import only what the code references right now. An especially common slip:
  importing CSS-module class names and forgetting to attach them to the JSX.
- `no-undef` fires for symbols referenced but never imported or declared - add the import when
  introducing a new identifier; do not assume it is globally available.
- Never use namespace imports (`import * as ns`) - destructure the named members instead. Rule:
  `import-x/no-namespace` (its auto-fix covers only trivial cases).

## Callback Returns

- Calls to `callback`, `done`, `exitWithError`, `reject`, `resolve` must be `return`ed. Rule:
  `n/callback-return`.
- Under `backend/`, the Express callees `next`, `res.end`, `res.send`, `res.status` are also
  registered (see the backend override block in [eslint.config.js](../../eslint.config.js)).
  Forgetting `return` after sending a response is a top cause of "headers already sent" bugs:

  ```ts
  // Good - return prevents fall-through
  if (err) return res.status(404).send('Not found');
  return res.send(result);

  // Bad - execution continues past the response and reaches the next send
  if (err) res.status(404).send('Not found'); // no return > headers-already-sent
  res.send(result);
  ```

## React Hooks Order (frontend)

- Rule: `react-hooks/rules-of-hooks`. Hooks must be called unconditionally at the top of the
  component or custom-hook body - never inside `if`, loops, ternaries, after an early `return`, or
  inside event handlers.

  ```tsx
  // Good - hook at top level; the value is used conditionally below
  const Component = ({ flagShowList }: { flagShowList: boolean }) => {
      const [items, setItems] = useLocalStorage('items', []);
      if (!flagShowList) return null;
      return <List items={items} />;
  };

  // Bad - hook is conditional; React cannot guarantee call order between renders
  const Component = ({ flagShowList }: { flagShowList: boolean }) => {
      if (!flagShowList) return null;
      const [items, setItems] = useLocalStorage('items', []); // rules-of-hooks error
      return <List items={items} />;
  };
  ```

## Async / Await Discipline

The Async-suffix convention ([function-patterns.md](./function-patterns.md)) will be lint-enforced
by `eslint-plugin-async-protect` once it supports ESLint 10 (tracked in
[docs/specs/todo/TODO-for-abstract-javascript-project.md](../../docs/specs/todo/TODO-for-abstract-javascript-project.md)).
Write conforming code now - the paired rules (`async-protect/async-suffix`,
`async-protect/async-await`) are errors and not autofixable when they arrive:

- Every `async` function name ends with `Async`; non-async functions must not use the suffix (the
  plugin enforces both directions).
- Every call to an `Async`-suffixed function is `await`ed (or `return`ed); conversely, `await` on a
  non-`Async` (sync) function is an error.
- Never fire-and-forget an `Async` function without an explicit comment justifying it.

  ```js
  // Good - name carries the Async suffix; sync call has no await
  const fetchUserAsync = async function (id) { ... };
  const port = getPort();

  // Bad - async function missing the suffix
  const fetchUser = async function (id) { ... };
  // Bad - awaiting a sync function
  const port = await getPort();
  ```

## Workflow

- Before reporting a task done, run `node --run eslint:fix` (or the scoped
  `node --run eslint:changed-files:fix`), then confirm no surviving errors.
- When the change touched CSS, also run `node --run stylelint:fix` then `node --run stylelint` -
  see [stylelint-gotchas.md](./stylelint-gotchas.md).
- Do not paper over a real failure with `// eslint-disable-next-line` - fix the underlying issue,
  or surface the blocker.
