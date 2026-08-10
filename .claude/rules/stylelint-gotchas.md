---
description: Non-autofixable Stylelint rules that commonly trip up first-pass CSS generation
paths: ["frontend/**/*.css"]
---

# Stylelint Gotchas - Get These Right on First Pass

These rules are **not autofixable**, so violations survive `node --run stylelint:fix` and require
manual correction. Internalize them when writing new CSS. The full project config is at
[stylelint.config.js](../../stylelint.config.js).

## Color Functions: `hsl` / `hsla` Banned

- Rule: `function-disallowed-list` bans `hsl()` and `hsla()`. Use `rgb()`, `rgba()`, hex, or
  `color()` instead - and prefer referencing an existing CSS variable over a hardcoded color value
  where one exists.

  ```css
  /* Good */ color: rgb(21 44 74);
  /* Bad  */ color: hsl(210 56% 19%);
  ```

## Color-space Keyword Casing

- Rule: `value-keyword-case` (with `camelCaseSvgKeywords: true`) - write `sRGB` (not `srgb`),
  `display-p3` etc. exactly as the CSS spec defines.

  ```css
  /* Good */ color: color(sRGB 0.1 0.2 0.3);
  /* Bad  */ color: color(srgb 0.1 0.2 0.3);
  ```

## Reading Custom Properties Requires `var()`

- Rule: `custom-property-no-missing-var-function`. A bare custom-property name in a value position
  is treated as the literal token `--foo`, not a variable read. Always wrap in `var(...)` when
  reading.

  ```css
  /* Good */ color: var(--colorPrimaryDark);
  /* Bad  */ color: --colorPrimaryDark;
  ```

## `calc()` Operators Need Spaces

- Rule: `function-calc-no-unspaced-operator`. Binary operators inside `calc()` must have whitespace
  on both sides - otherwise the parser reads `100%-10px` as a single token.

  ```css
  /* Good */ width: calc(100% - 10px);
  /* Bad  */ width: calc(100%-10px);
  ```

## Shorthand After Longhand Wipes the Longhand

- Rule: `declaration-block-no-shorthand-property-overrides`. A shorthand property (`border`,
  `background`, `font`, `margin`, `padding`, ...) declared **after** a related longhand resets the
  longhand to its initial value. Either drop the longhand or move the shorthand above it.

  ```css
  /* Good */ .x { border: 1px solid blue; border-top-color: red; }
  /* Bad  */ .x { border-top-color: red; border: 1px solid blue; } /* red is wiped */
  ```

## No Trailing Zeros

- Rule: `@stylistic/number-no-trailing-zeros`. Use `0.5` (not `0.50`), `1.2` (not `1.20`).

## Leading Zero Required

- Rule: `@stylistic/number-leading-zero` is `'always'` (autofixable, but get it right). Write
  `0.5`, never `.5`.

## Alpha as Number, Not Percentage

- Rule: `alpha-value-notation` is `'number'`. Write alpha as `0.5`, not `50%`.

  ```css
  /* Good */ background: rgb(0 0 0 / 0.5);
  /* Bad  */ background: rgb(0 0 0 / 50%);
  ```

## Typo-Catchers (NOT autofixable)

These fire when a name is unknown to CSS / the configured stylelint plugins. The fix is always: use
the correct identifier.

- `property-no-unknown` - typos like `colour` instead of `color`
- `function-no-unknown` - typos like `clmp(...)` instead of `clamp(...)`
- `unit-no-unknown` - typos like `10pxx` or `2reem`
- `at-rule-no-unknown` and `at-rule-prelude-no-invalid` - typos in `@media`, `@supports`,
  `@keyframes`, etc.
- `selector-pseudo-class-no-unknown` - but `:export` and `:global` are allowed (CSS Modules); typos
  like `:hover-not` are not
- `selector-pseudo-element-no-unknown` - `::before`, `::after`, `::placeholder` are valid;
  `::placeholderr` is not
- `selector-type-no-unknown` - typos in element selectors
- `media-feature-name-no-unknown` - `(min-width: ...)` is valid, `(min-wdth: ...)` is not

## Disallowed: `!important` in `@keyframes`

- Rule: `keyframe-declaration-no-important`. Stylelint rejects `!important` inside `@keyframes`
  blocks (browsers ignore it there anyway).

  ```css
  /* Bad */ @keyframes pulse { 50% { opacity: 0.5 !important; } }
  ```

## Block Cannot Be Empty

- Rule: `block-no-empty`. If a CSS class is intentionally a placeholder (per the
  [css-modules.md](./css-modules.md) "create a CSS class matching the component name even if
  initially empty" guidance), still include at least a comment so the block is not empty.

  ```css
  /* Good */ .Component { /* placeholder for component-specific overrides */ }
  /* Bad  */ .Component { }
  ```

## Spaces Around Braces (single-line rules)

- Rules: `@stylistic/block-opening-brace-space-before` (`always`) and friends. Even on single-line
  rules, surround braces with spaces.

  ```css
  /* Good */ .foo { color: red; }
  /* Bad  */ .foo{color:red;}
  ```

## Workflow

- Always run `node --run stylelint:fix` after writing CSS - many `@stylistic/*` rules autofix
  (indentation, casing, comma/semicolon spacing, leading zero, etc.). The rules above survive
  autofix and need first-pass correctness.
- Never paper over a real violation with `/* stylelint-disable */`. If a real disable is
  unavoidable, document it in [docs/because/](../../docs/because/README.md).
