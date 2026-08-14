---
name: skill-create-new-component
description: Scaffold a new React component with its CSS module following project conventions
argument-hint: ComponentName [parent/path]
disable-model-invocation: true
---

# Create a New React Component

Create a React component named `$0` at the path `$1` (if no path given, ask where to place it).

## Steps

- Create the component file: `{path}/$0/$0.tsx`
- Create the matching CSS module: `{path}/$0/$0.module.css`
- Follow the rules below; deep-dive details live in
  [react-components.md](../../rules/react-components.md) and
  [css-modules.md](../../rules/css-modules.md)

## Component File (`$0.tsx`)

Follow this exact structure and style:

```tsx
import { $0 as styles_$0 } from './$0.module.css';

const $0 = (
    { prop1,          prop2         }:
    { prop1: string;  prop2: number }
) => {
    // hooks and state

    // business logic

    return (
        <div className={styles_$0}>
            {/* JSX */}
        </div>
    );
};

export { $0 };
```

## CSS Module File (`$0.module.css`)

```css
.$0 {
    /* placeholder for component-specific styles (empty blocks are banned) */
}
```

## Rules to Follow

- **Named exports only** - no default exports
- **PascalCase** for component name, file name, and directory name
- **CSS module** with named import, aliased as `styles_$0` when the name collides
- **Destructured props** in the function parameters
- **Props type** inline in the parameter signature (not a separate interface, unless complex)
- **4 spaces** indentation, **single quotes** for strings (double quotes for JSX/HTML
  attributes), **semicolons** required, **no trailing commas**
- **File extensions** in all imports (`.tsx`, `.ts`, `.module.css`)
- **Import order** is autofixed by `simple-import-sort` (`node --run eslint:fix`); CSS-module
  imports sort like any other relative import - see
  [import-organization.md](../../rules/import-organization.md)
- Event handlers: separate named functions with `handle` prefix
- Boolean state: `flag` prefix (preferred), or `is`/`has`
- Async functions: `Async` suffix
