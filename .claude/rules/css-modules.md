---
description: CSS module naming, import patterns, global styles, and styling conventions
paths: ["frontend/**/*.css", "frontend/**/*.jsx", "frontend/**/*.tsx"]
---

# CSS Conventions

## CSS Modules

- All component styles use the `.module.css` extension; regular `.css` files are global (not
  scoped). The global entry is [frontend/src/index.css](../../frontend/src/index.css).
- Keep CSS files alongside their component in the same directory.
- Create a CSS class matching the component name even if initially empty (for consistency) - but
  never leave the block literally empty; include a placeholder comment so `block-no-empty` passes
  (see [stylelint-gotchas.md](./stylelint-gotchas.md)).

## Naming

- **PascalCase** for CSS class names matching component names: `.PageHeader`.
- **camelCase** for child elements and variants: `.expandCollapseBar`.

## Import Patterns (in .tsx files)

- Use **named imports only**, never `import styles from ...` (default) or `import * as ...`
  (namespace) - a typo in a named class fails the build via the `MISSING_EXPORT` onwarn guard in
  [frontend/build/build-config-generator.ts](../../frontend/build/build-config-generator.ts)
  (demonstrated in [frontend/src/App/App.tsx](../../frontend/src/App/App.tsx)).
- When a component name collides with its CSS class name, alias with the `styles_` prefix:
  `import { PageHeader as styles_PageHeader } from './PageHeader.module.css';`
- Direct class import otherwise:
  `import { specificClass, anotherClass } from './ComponentName.module.css';`

## Global Styles

- Use `:global()` syntax for unscoped CSS within modules.
- App-wide styles live in [frontend/src/App/App.module.css](../../frontend/src/App/App.module.css).

## Formatting

- 4-space indentation.
- Avoid deeply nested selectors.
- Document hacks/workarounds in [docs/because/](../../docs/because/README.md).
- Stylelint config: [stylelint.config.js](../../stylelint.config.js) (extends recommended +
  css-modules configs).

## Stylelint Gotchas

- See [stylelint-gotchas.md](./stylelint-gotchas.md) for the non-autofixable rules (banned
  `hsl`/`hsla`, `value-keyword-case` sRGB casing, `custom-property-no-missing-var-function`,
  `function-calc-no-unspaced-operator`, `declaration-block-no-shorthand-property-overrides`, typo
  catchers, etc.).
- After writing CSS, run `node --run stylelint:fix` then `node --run stylelint` to confirm no
  surviving errors.
