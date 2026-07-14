# Accessibility

VenueIQ targets WCAG 2.2 AA and a Lighthouse accessibility score of at least 95, with a project goal of 99+.

## Interaction

- A skip link moves directly to the main landmark.
- Navigation and form controls use semantic elements, visible labels, and a logical tab order.
- Touch targets are approximately 44 by 44 CSS pixels.
- Focus indicators remain visible against the dark interface.
- Scenario and preference controls expose text state and do not depend on color.
- Route and status changes use a polite, throttled live region rather than continuous announcements.

## Screen readers

The stadium SVG is supplemental. Every route is also an ordered list containing the same steps, distance context, facilities, alerts, and accessibility notes. Decorative radar and grid graphics are hidden. Loading, fallback, and error states have explicit text, and icons have either accessible labels or are marked decorative.

## Visual presentation

Text and controls target AA contrast. Cyan, lime, amber, and red are paired with labels and icons. The user can enable higher contrast and larger text. Layouts reflow from mobile through large operations displays without requiring two-dimensional scrolling for core tasks.

## Language and direction

English, Spanish, French, Portuguese, Arabic, and Hindi are available. Generated result regions set their matching `lang`; Arabic also switches to `dir="rtl"`. Navigation and control structure remain predictable. Language names are presented in their own script where helpful.

## Motion

Animations are restrained. `prefers-reduced-motion` disables non-essential transitions and stadium pulse effects. No content flashes or moves automatically in a way that blocks interaction.

## Automated testing

- React Testing Library checks labels, keyboard behavior, live-state copy, and rendered route/checklist structure.
- Playwright covers keyboard-only and mobile role flows.
- `@axe-core/playwright` scans landing, fan, operations, and volunteer pages and fails on serious or critical violations.

Run:

```bash
npm run test
npm run test:a11y
```

## Manual checklist

- Navigate every page with Tab, Shift+Tab, Enter, Space, and Escape where applicable.
- Confirm the skip link, focus order, visible focus, and focus after route updates.
- Use VoiceOver or NVDA to complete each primary role flow.
- Zoom to 200% and test at 320 CSS pixels wide.
- Enable the operating system's reduced-motion and increased-contrast settings.
- Verify Arabic response direction and mixed-direction numbers.
- Check that map information remains complete when images/SVG are unavailable.
- Inspect every warning and critical state without color perception.
