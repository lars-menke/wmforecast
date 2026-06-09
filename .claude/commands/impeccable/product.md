# Register: Product

Design **serves** the product. The interface disappears into the task.

**The test**: Would a user fluent in Linear, Figma, Notion, Raycast, or Stripe sit down and trust this — or pause at every subtly-off component? Earned familiarity is the bar.

## Typography

- **One family is often right.** Product UI doesn't need display/body pairing. A well-tuned sans carries headings, buttons, labels, body, and data.
- **Fixed rem scale, not fluid clamp.** Clamp-sized headings look wrong in sidebars. Users view at consistent DPI.
- **Tighter scale ratio: 1.125–1.2** between steps. More type elements than brand surfaces; exaggerated contrast creates noise.
- **Line length still applies for prose** (65–75ch). Data tables at 120ch+ are fine.

## Color

Product defaults to **Restrained**:
- Accent color for primary actions, current selection, and state indicators only — not decoration
- Second neutral layer for sidebars, toolbars, and panels
- State-rich semantic vocabulary: hover, focus, active, disabled, selected, loading, error, warning, success, info
- No full-saturation accents on inactive states

## Components

Every interactive component must have all states:
`default` → `hover` → `focus` → `active` → `disabled` → `loading` → `error`

- Skeleton states for loading — not centered spinners in content
- Empty states that teach the interface
- Consistent affordances screen to screen: same button shape, same form vocabulary, same icon style

## Layout

- Responsive behavior is structural (collapse sidebar, responsive table, breakpoint columns) — not fluid typography
- Density is a virtue when users need information
- Consistency over surprise — same visual vocabulary screen to screen

## Motion

- 150–250ms. Users are in flow; don't make them wait for choreography
- Motion conveys state, not decoration
- No orchestrated page-load sequences

## Product Bans

- Decorative motion that doesn't convey state
- Inconsistent component vocabulary across screens
- Display fonts in UI labels, buttons, or data
- Reinventing standard affordances (custom scrollbars, non-standard modals, weird form controls)
- Modal as first thought — exhaust inline/progressive alternatives first

## Product Permissions

Things brand surfaces can't do but product can:
- System fonts and familiar sans (Inter, SF Pro, system-ui)
- Standard navigation patterns: top bar + side nav, breadcrumbs, tabs, command palettes
- Density — tables with many rows, dense panels when users need it
- Consistency — the same vocabulary screen to screen is a virtue
