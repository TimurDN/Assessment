# Accessibility Report

Automated accessibility scan of the booking wizard.

- **Scanner:** `@axe-core/cli` (axe-core 4.11.3, Chrome Headless)
- **Target:** `http://localhost:3000` — Docker production build
  (`docker compose up --build`)
- **Standard:** WCAG 2.1 A + AA

## Result

| Bucket        | Count | Meaning                                                   |
| ------------- | ----- | --------------------------------------------------------- |
| Violations    | **0** | No WCAG A/AA failures detected.                           |
| Passes        | 42    | Rules that matched and passed.                            |
| Incomplete    | 1     | Rule where the tool cannot decide automatically (see below). |
| Inapplicable  | 47    | Rules whose preconditions were not met on this page.      |

Raw JSON output: [`accessibility.json`](./accessibility.json).

## About the one "incomplete" rule

`color-contrast` (19 nodes) is flagged **incomplete**, not violated. axe
cannot measure contrast deterministically when a text node sits on top of
a non-solid background (gradients, blurred blobs, translucent cards).
The wizard's aurora/glass design uses all three, so axe abstains rather
than failing.

These nodes were **visually verified** against the design tokens in
`ui/src/app/globals.css`:

- The `foreground` / `muted-foreground` tokens exceed the 4.5:1
  WCAG AA threshold against both the base background and the
  translucent card surface.
- The earlier draft used `text-muted-foreground/80` in the footer; that
  alpha reduction was a real AA miss caught by this same scan and was
  fixed in `ui/src/app/page.tsx:75` (commit `fcee0d7`).

## Manual accessibility checks

Automated tooling covers roughly 20–50% of accessibility concerns.
The following cases in [`manual-tests.md`](./manual-tests.md) cover
what the tool cannot:

- **TC-034** — Keyboard-only navigation through the full 4-step wizard.
- **TC-035** — Screen-reader announcements for validation errors.
- **TC-036** — Focus ring visibility on all interactive elements.

These require assistive-tech hardware and are marked *Manual — not
captured* in the evidence column of the plan.

## How to reproduce

```bash
docker compose up -d --build
npx --yes @axe-core/cli http://localhost:3000 --exit --save docs/accessibility.json
```

Exit code `0` ⇒ zero violations.
