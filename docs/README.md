# Submission — Index

Everything a reviewer needs lives in this folder. All links are relative
to this file.

## Reports

- [`bug-reports.md`](./bug-reports.md) — three defects with severity,
  priority, repro, expected vs actual, evidence, root-cause notes.
- [`manual-tests.md`](./manual-tests.md) — 38-case manual test catalogue
  + automated-test inventory (60 unique tests / 180 executions).
- [`lighthouse.html`](./lighthouse.html) — Lighthouse desktop report:
  Performance **100** · Accessibility **100** · Best Practices **100**
  · SEO **100** (open in a browser).
- [`accessibility.md`](./accessibility.md) — axe-core summary:
  **0 violations** across 42 passed WCAG A/AA rules. Raw data in
  [`accessibility.json`](./accessibility.json).

## Video walkthrough

- [`flow-video.webm`](./flow-video.webm) — single-run happy path with
  heavy waste + plasterboard collection. Watch this first if you want the
  30-second tour.

## Bug evidence

- [`bugs/BUG-1-skip-leak.png`](./bugs/BUG-1-skip-leak.png) — step 4 Review
  showing the impossible *Heavy: Yes + 2-yard* combination (plus BUG-3 in
  the price block).
- [`bugs/BUG-2-postcode-validation.png`](./bugs/BUG-2-postcode-validation.png) —
  `NOTAUK` accepted client-side, backend 422 surfaced as a destructive
  alert.
- [`bugs/BUG-3-vat-total.png`](./bugs/BUG-3-vat-total.png) — VAT line
  rendered but dropped from the total.

## Screenshots — desktop (1440×900)

| #  | Step / state                            | File |
|----|-----------------------------------------|------|
| 1  | Step 1 — postcode idle                  | [`01-step1-postcode-idle.png`](./screenshots/desktop/01-step1-postcode-idle.png) |
| 2  | Step 1 — address list (`SW1A 1AA`)      | [`02-step1-address-list.png`](./screenshots/desktop/02-step1-address-list.png) |
| 3  | Step 1 — empty state (`EC1A 1BB`)       | [`03-step1-empty-state.png`](./screenshots/desktop/03-step1-empty-state.png) |
| 4  | Step 1 — error state (`BS1 4DJ`)        | [`04-step1-error-state.png`](./screenshots/desktop/04-step1-error-state.png) |
| 4b | Step 1 — retry success                  | [`04b-step1-retry-success.png`](./screenshots/desktop/04b-step1-retry-success.png) |
| 5  | Step 2 — waste branching                | [`05-step2-waste-branching.png`](./screenshots/desktop/05-step2-waste-branching.png) |
| 6  | Step 3 — disabled skips                 | [`06-step3-disabled-skips.png`](./screenshots/desktop/06-step3-disabled-skips.png) |
| 7  | Step 4 — price breakdown                | [`07-step4-price-breakdown.png`](./screenshots/desktop/07-step4-price-breakdown.png) |
| 8  | Booking success                         | [`08-booking-success.png`](./screenshots/desktop/08-booking-success.png) |

## Screenshots — mobile (Pixel 7 profile)

| # | Step / state            | File |
|---|-------------------------|------|
| 1 | Step 1 — postcode idle  | [`01-step1-postcode-idle.png`](./screenshots/mobile/01-step1-postcode-idle.png) |
| 2 | Step 1 — address list   | [`02-step1-address-list.png`](./screenshots/mobile/02-step1-address-list.png) |
| 3 | Step 2 — waste          | [`03-step2-waste.png`](./screenshots/mobile/03-step2-waste.png) |
| 4 | Step 3 — skips          | [`04-step3-skips.png`](./screenshots/mobile/04-step3-skips.png) |
| 5 | Step 4 — review         | [`05-step4-review.png`](./screenshots/mobile/05-step4-review.png) |
| 6 | Step 1 — empty state    | [`06-step1-empty.png`](./screenshots/mobile/06-step1-empty.png) |

## Folders

- [`bugs/`](./bugs/) — per-bug screenshots referenced from
  `bug-reports.md`.
- [`screenshots/desktop/`](./screenshots/desktop/) and
  [`screenshots/mobile/`](./screenshots/mobile/) — full-flow captures.

## Back to the project

- [Root `README.md`](../README.md) — quick-start, project structure, API
  contract, fixtures, Docker/dev instructions.
- [`ui/`](../ui/) — Next.js 16 app + route handlers.
- [`automation/`](../automation/) — Playwright suite (60 unique tests
  across API / E2E / functional layers).
