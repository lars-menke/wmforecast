# Impeccable: Frontend Design Agent (v3.5.0)

Source: https://github.com/pbakaus/impeccable — Apache 2.0, by Paul Bakaus

**Purpose**: Production-grade frontend interface design, iteration, and quality assurance across websites, dashboards, apps, and components.

---

## Essential Setup (run once per session)

1. Review existing code for design patterns, tokens, and components
2. If using a sub-command, read its reference file in `.claude/commands/impeccable/<command>.md`
3. Load the appropriate register reference: **product.md** for app/tool UI, **brand.md** for marketing/identity
4. For new projects without established colors, define an OKLCH-based palette first

**This project's register: PRODUCT** (app UI, data-driven, task-focused — see `impeccable/product.md`)

---

## Core Design Principles

**Color**
- Verify WCAG contrast (4.5:1 for body text, 3:1 for large/UI elements)
- Use OKLCH for perceptually uniform color manipulation
- Avoid tinted near-whites or warm-neutral beige as default backgrounds
- State-rich semantic vocabulary: hover, focus, active, disabled, selected, loading, error, warning, success

**Typography**
- Cap body line length at 65–75 characters
- Enforce scale hierarchy (≥1.25 ratio); tighter 1.125–1.2 for product UI
- Limit font families to 3 (1 is often right for product UI)
- Use `text-wrap: balance` on headings
- No all-caps body copy; no display fonts in UI labels/buttons/data

**Layout**
- Flexbox for 1D, grid for 2D
- `repeat(auto-fit, minmax(280px, 1fr))` for responsive grids
- Avoid nested cards — cards inside cards signal structural confusion
- Vary spacing; use token-based rhythm, not arbitrary values
- Semantic z-index scales, not arbitrary values

**Motion**
- 150–250ms for product transitions (fast — users are in a task)
- Ease-out curves; cubic-bezier only — no bounce, no elastic
- Always include `@media (prefers-reduced-motion: reduce)` fallback
- Motion conveys state (change, feedback, loading, reveal) — nothing else
- No page-load sequences; no scatter-gun micro-interactions

**Copy**
- Every word earns inclusion
- Button labels: verb + object ("Save changes", not "Submit")
- Avoid buzzwords, em dashes, marketing clichés

---

## Absolute Bans (non-negotiable)

- Side-stripe borders as decoration
- Gradient text (`background-clip: text`)
- Decorative glassmorphism (blur for its own sake)
- Identical card grids without semantic purpose
- Tiny uppercase tracked eyebrows (`SECTION LABEL`) on every section
- Numbered section markers as default scaffolding
- Text overflow on containers (always handle it)
- Bounce / elastic animation curves
- Pure black (#000) or pure white (#fff) — use tinted neutrals
- Inconsistent component vocabulary across screens

---

## 25 Commands

| Group | Commands |
|-------|----------|
| **Build** | `craft`, `shape`, `init`, `document`, `extract` |
| **Evaluate** | `critique`, `audit` |
| **Refine** | `polish`, `bolder`, `quieter`, `distill`, `harden`, `onboard` |
| **Enhance** | `animate`, `colorize`, `typeset`, `layout`, `delight`, `overdrive` |
| **Fix** | `clarify`, `adapt`, `optimize` |
| **Iterate** | `live` |
| **Utilities** | `pin`, `unpin` |

---

## Routing

- **No argument** → assess current code with context signals; recommend 2–3 highest-value commands
- **Command name** → load `impeccable/<command>.md` and execute
- **General request** → map intent to nearest command; apply register guidance

---

## Anti-Pattern Detection (41 rules)

The skill detects these AI/slop patterns automatically:

**Overused aesthetics**: gradient text, glassmorphism, identical card grids, purple-to-blue gradients, aurora backgrounds, generic hero layouts

**Typography tells**: Inter/Poppins/DM Sans defaults without purpose, all-caps section headers, eyebrow text on every section

**Color tells**: tinted near-white backgrounds, pure #000/#fff, cool gray as default neutral, gradient-heavy palettes

**Layout tells**: side-stripe borders, numbered section markers, nested cards, 3-column feature grids by default

**Motion tells**: bounce/elastic easing, fade-and-rise on every scroll section, page-load orchestration sequences

---

## Register Reference (quick summary — full file: `impeccable/product.md`)

This project is **Product register**:
- One font family is often right (no display/body pairing needed)
- Fixed rem scale, not fluid clamp
- Accent color for primary actions and state indicators only — not decoration
- Every interactive component needs: default, hover, focus, active, disabled, loading, error states
- Skeleton states for loading, not centered spinners
- Density is a virtue; consistency over surprise
- Standard affordances — no reinventing scrollbars, form controls, modals for flavor
