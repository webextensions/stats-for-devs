# The overlay uses fixed, theme-independent styling

## What

The overlay (`frontend/lib/src/statsForDevs/StatsForDevs.module.css`) is styled with a fixed dark translucent chrome: hardcoded `rgb()`
colors, fixed spacing, and its own `--overlayFontScale` for sizing. It does not read the host page's colors,
fonts, spacing tokens or theme variables, and it does not adapt to light mode.

The in-overlay settings view (`frontend/lib/src/statsForDevs/StatsForDevsSettings.module.css`) is the same - native controls restyled for
the dark HUD rather than inheriting from the page.

## Why

This is a live debugging HUD that floats on top of whatever you are working on, so:

- **It must stay readable on any page**, in any theme, including a page caught mid-transition or one whose CSS
  you have just broken. A fixed high-contrast dark chrome guarantees that; inheriting from the page cannot.
- **It must not restyle itself while you are debugging styling.** Several of the things the HUD reports are the
  page's own theme, spacing and font-size preferences. An overlay that resized or recolored itself every time
  you toggled one of those would be changing the instrument along with the experiment.
- **A "stats for nerds"-style HUD is conventionally a fixed dark overlay**, for exactly these reasons, so this
  also reads as what it is: a dev tool, visibly not part of the product.

The overlay's font size is controlled by its own **Font scale** slider rather than the page's font-size
preference, so you can size the HUD independently of the layout you are inspecting.

## Consequences for consumers

- Do not expect the overlay to follow your design system - it will not, by design.
- Do not copy this fixed-color approach into product UI. It is right for a dev-only overlay that must survive
  any page, and wrong for anything a user sees.
- Class names are prefixed `sfd-` and carry no build hash, so they are stable across releases and safe to
  target if you really do want to restyle it.
