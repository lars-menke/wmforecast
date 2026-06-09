# UI/UX Pro Max - Design Intelligence

Skill source: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill

A comprehensive design skill providing structured guidance for UI/UX decisions. Apply whenever a task changes how something looks, feels, moves, or is interacted with.

---

## When to Apply

**Must use:**
- Designing new pages or interfaces
- Creating/refactoring UI components
- Selecting color schemes, typography, or layout systems
- Reviewing UX, accessibility, or visual consistency
- Implementing navigation, animations, or responsive behavior
- Making product-level design decisions
- Improving perceived quality and usability

**Skip when:**
- Working on backend logic, APIs, or databases
- Optimizing non-visual performance
- Handling infrastructure or DevOps

---

## Rule Priorities (1-10)

| Priority | Category | Key Requirement |
|----------|----------|-----------------|
| 1 | **Accessibility** | 4.5:1 contrast ratio, keyboard navigation, proper labeling |
| 2 | **Touch & Interaction** | 44×44px minimum targets, 8px+ spacing, loading feedback |
| 3 | **Performance** | Modern image formats, lazy loading, minimal layout shift |
| 4 | **Style Selection** | Match product type, consistency, SVG icons only |
| 5 | **Layout & Responsive** | Mobile-first approach, no horizontal scroll |
| 6 | **Typography & Color** | 16px base, 1.5+ line-height, semantic color tokens |
| 7 | **Animation** | 150–300ms duration, meaningful motion, respects reduced-motion |
| 8 | **Forms & Feedback** | Visible labels, errors near fields, clear messaging |
| 9 | **Navigation Patterns** | Predictable behavior, max 5 bottom nav items, deep linking |
| 10 | **Charts & Data** | Legends, tooltips, colorblind-friendly palettes |

---

## Core Workflow

**Step 1 - Analyze Requirements**
Extract: product type, target audience, style keywords, tech stack

**Step 2 - Generate Design System**
Define: pattern recommendations, style priorities, color palette, typography, effects/animations, anti-patterns, pre-delivery checklist

**Step 3 - Apply Stack Guidelines**
For this project: React 18 + CSS Modules + Apple iOS 17 HIG + Geist Variable Font

**Step 4 - Validate Before Delivery**
- [ ] Accessibility labels on interactive elements
- [ ] Disabled states visually distinct
- [ ] Micro-animations under 300ms
- [ ] Tested on small/large viewports and both color modes
- [ ] Touch targets min 44x44px
- [ ] No hardcoded colors (use CSS custom properties / tokens)
- [ ] Contrast ratio 4.5:1 for small text, 3:1 for large

---

## Non-Negotiable Rules

**Icons & Assets:** Use vector-based SVG icons only. No emojis as UI icons. No raster graphics that blur/pixelate.

**Interaction States:** Clear pressed feedback (scale/opacity) within 80-150ms. Touch targets min 44x44pt on iOS.

**Contrast & Accessibility:** 4.5:1 for small text, 3:1 minimum for large UI elements. Test light AND dark mode independently.

**Safe Areas & Layout:** Respect iOS safe-area-inset-* for notches and gesture bars. Use consistent 4/8px spacing rhythm.

**Animations:** Duration 150-300ms. Use `cubic-bezier(0.16, 1, 0.3, 1)` (spring) for entrances, `ease` for exits. Respect `prefers-reduced-motion`.

**Design Tokens:** Every color, radius, and spacing value from `tokens.css`. Never hardcode. No inline styles except CSS custom property values.

---

## Design Style Reference

**67 UI styles available** — relevant to this project:

- **iOS Native / HIG**: System colors, dynamic type, translucent materials, spring physics
- **Glassmorphism**: `backdrop-filter: blur()`, frosted glass surfaces, subtle borders
- **Minimalism**: Ample whitespace, restrained color palette, strong typographic hierarchy
- **Claymorphism**: Soft shadows, rounded shapes, pastel tones (avoid for this app)
- **Brutalism**: High contrast, raw grid (avoid for this app)

---

## Color Palette Guidance (161 palettes)

For sports/prediction apps:
- Primary action: system blue (`#007AFF` / `#0A84FF` dark)
- Success/home win: system green (`#34C759` / `#30D158` dark)
- Draw: neutral gray (`#C7C7CC` / `#636366` dark)
- Away win: system orange (`#FF9500` / `#FF9F0A` dark)
- Danger/live: system red (`#FF3B30` / `#FF453A` dark)
- Background hierarchy: page > card > fill (3 levels)

---

## Typography (57 pairings)

This project: **Geist Variable** (100-900 weight range) + SF Pro fallback

Scale (iOS HIG):
- Large Title: 30px / 800
- Title 1: 24px / 700
- Title 2: 20px / 700
- Headline: 17px / 600
- Body: 15px / 400
- Callout: 14px / 400
- Subhead: 13px / 400
- Footnote: 12px / 600 (uppercase labels)
- Caption 1: 11px
- Caption 2: 10px

Numeric data: always `font-variant-numeric: tabular-nums`

---

## Anti-Patterns (avoid)

- Gradients on primary surfaces (use flat fills)
- Drop shadows heavier than `0 1px 3px rgba(0,0,0,0.12)`
- Neon/glow effects
- More than 3 background levels
- Animations over 300ms on list items
- `if (darkMode)` in component logic (use CSS tokens instead)
- Hardcoded colors anywhere
- Non-semantic HTML (div soup instead of button/section/header)
- Missing focus-visible states
- Touch targets under 44px
