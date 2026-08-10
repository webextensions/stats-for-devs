---
description: Import formatting and ordering conventions - file extensions, destructured members, group order
paths: ["**/*.cjs", "**/*.cts", "**/*.js", "**/*.jsx", "**/*.mjs", "**/*.mts", "**/*.ts", "**/*.tsx"]
---

# Import Organization

- Always include the file extension in relative imports (`.js`, `.ts`, `.json`).
- Import Node.js builtins with the `node:` prefix (`import path from 'node:path'`).
- Use destructured imports for named exports, one member per line when there is more than one
  (`import-newlines/enforce` with `items: 1`):

  ```js
  import {
      getTrackedFiles,
      readFileAsTextOrNull
  } from '../utils/repo-files.ts';
  ```

- Group order is governed by `simple-import-sort` (autofixable via `node --run eslint:fix`);
  within each group, members and statements stay alphabetized - see
  [alphabetical-sorting.md](./alphabetical-sorting.md).
- Frontend files follow the same autofixed order - npm packages first, then relative/internal
  imports. CSS-module imports sort like any other relative import (they are not forced last); do
  not hand-reorder against the autofixer.
