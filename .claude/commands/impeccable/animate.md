# /impeccable animate

Purposeful motion only. Every animation must earn its place by conveying state, providing feedback, or clarifying hierarchy. Cut everything decorative.

## Four Purposeful Layers

1. **Hero moments** — signature animations for marquee interactions (max 1–2 per surface)
2. **Feedback interactions** — acknowledge user actions (button press, form submit, drag)
3. **State transitions** — smooth changes in content, layout, or data
4. **Delight** — surprising, memorable interactions (used sparingly)

## Timing: 100/300/500 Rule

| Duration | Use case |
|----------|----------|
| 100–150ms | Instant feedback (button press, toggle, checkbox) |
| 200–300ms | State changes (tab switch, dropdown open, card expand) |
| 300–500ms | Layout shifts (page transition, sidebar open, modal) |

Product UI default: 150–250ms. Users are in a task — don't make them wait.

## Easing

- **Ease-out** (`cubic-bezier(0.16, 1, 0.3, 1)` — spring) for entrances and reveals
- **Ease-in** for exits and dismissals
- **Linear** only for continuous loops (spinners, progress)
- **Never**: bounce, elastic, overshoot — these read as dated

## Performance Rules

- Animate `transform` and `opacity` only — these don't trigger layout
- Use `will-change: transform` sparingly and only on actively animating elements
- Remove `will-change` after animation completes
- Never animate: `width`, `height`, `top`, `left`, `margin`, `padding`
- Expensive effects (`backdrop-filter`, `filter`, `box-shadow`) max 1 per viewport

## Accessibility (non-negotiable)

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Guardrails

- No fade-and-rise on every scroll section — reserve entrance animations for 1–2 key moments
- No page-load orchestration sequences — the product loads into a task
- No animation that blocks user interaction (pointer-events: none during transition is OK)
- One well-executed entrance beats scattered micro-interactions
- Animation fatigue is real — every motion has a cost
