# /impeccable polish

Polish is the **last step, not the first**. Polish without design-system alignment is decoration on top of drift — it makes the next person's job harder.

## Before touching code

1. Confirm the feature is functionally complete
2. Assess the actual user flow — a beautiful feature that fights the user isn't polished
3. Identify systematic issues vs. one-off deviations
4. Classify every deviation: missing token / one-off implementation / conceptual misalignment

## Eight dimensions to work through

**1. Visual Alignment & Spacing**
- Grid adherence
- Token-based spacing throughout (no magic numbers)
- Consistent component sizing

**2. Information Architecture & Flow**
- Progressive disclosure applied correctly
- Established patterns used where they exist
- Hierarchy consistent with surrounding screens

**3. Typography, Color & Contrast**
- WCAG compliance verified (4.5:1 body, 3:1 large/UI)
- Token usage consistent
- No one-off color values

**4. Interaction States**
- Default, hover, focus, active, disabled, loading, error, success — all present

**5. Micro-interactions**
- Transitions 150–300ms
- Ease-out curves
- `prefers-reduced-motion` fallbacks in place

**6. Content & Copy**
- Terminology consistent with rest of product
- Grammar correct
- Copy length appropriate (no padding, no truncation without ellipsis)

**7. Forms, Icons, Images**
- Proper labeling (aria-label where needed)
- Icons consistent in style and weight
- Images: alt text, retina-ready, no layout shift

**8. Responsiveness**
- All intended breakpoints tested
- Touch targets ≥ 44×44px
- No layout shift on interaction

## Guardrails

- Do not guess at design system principles — read the tokens and components first
- Do not polish incomplete work — functionality first
- Do not create new components when existing ones serve the purpose
- A passing TypeScript/CSS check is not proof of design quality — verify visually
