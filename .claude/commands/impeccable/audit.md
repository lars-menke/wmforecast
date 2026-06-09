# /impeccable audit

Technical quality audit across five dimensions. **Diagnostic only** — documents issues without fixing them. Use `/impeccable polish` or targeted commands to fix.

## Five Dimensions

Score each 0–4:
- 0 = severe/failing
- 2 = acceptable
- 4 = excellent

**Accessibility (0–4)**
- WCAG contrast ratios (4.5:1 body, 3:1 large)
- ARIA implementation (labels, roles, live regions)
- Keyboard navigation (focus order, focus-visible, trapping)
- Semantic HTML (headings, landmarks, lists)
- Alt text on images
- Form accessibility (labels, error association, required)

**Performance (0–4)**
- Layout thrashing (reads + writes interleaved in JS)
- Animation on transform/opacity only (not width/height/top/left)
- Image optimization (format, sizing, lazy loading)
- Bundle bloat (unnecessary imports)
- Render cycle efficiency

**Theming (0–4)**
- Design token usage (no hardcoded colors/spacing/radii)
- Dark mode functional
- Token consistency across components
- Dynamic theme switching works without flash

**Responsive Design (0–4)**
- No fixed-width breakdowns
- Touch targets ≥ 44px
- Overflow handled everywhere
- Text scales without layout breaks
- All intended viewport variants work

**Anti-Patterns (0–4)**
- 1 = heavy AI/slop tells (gradient text, glassmorphism, generic fonts, purple-blue gradients)
- 2 = some tells present
- 3 = minor issues
- 4 = intentional, distinctive design

## Report Format

```
Health score: X/20

| Dimension       | Score | Top finding |
|-----------------|-------|-------------|
| Accessibility   | X/4   | ...         |
| Performance     | X/4   | ...         |
| Theming         | X/4   | ...         |
| Responsive      | X/4   | ...         |
| Anti-Patterns   | X/4   | ...         |

FINDINGS:
[P0] Critical — description, impact, fix command
[P1] High     — description, impact, fix command
[P2] Medium   — description, impact, fix command
[P3] Low      — description, impact, fix command

SYSTEMIC PATTERNS:
[Patterns that indicate broader architectural gaps]

WORKING WELL:
[Implementations worth preserving]
```

## Priority Tags

- **P0**: Blocks ship — accessibility failure, broken interaction, data loss risk
- **P1**: Ship with fix — significant UX degradation
- **P2**: Next sprint — noticeable but not blocking
- **P3**: Backlog — minor / polish
