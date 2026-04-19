# Automation — Playwright E2E suite

Playwright + TypeScript suite validating the booking-flow app.

## Run

```bash
# From this directory
npm install
npm run install-browsers    # chromium + webkit + deps
npm test                    # chromium-desktop (default)
npm run test:all-browsers   # chromium + webkit + mobile-chrome
npm run test:ui             # Playwright UI mode
npm run test:headed         # headed browsers
npm run test:debug          # step-through debug
npm run report              # open last HTML report
```

The config auto-starts the Next.js dev server on `http://localhost:3000` via `webServer` unless `CI=1` is set (CI expects the app to already be running).

## Strategy

- **Selectors:** `data-testid` attributes only (`testIdAttribute: "data-testid"` in config).
- **Determinism:** app uses in-memory fixtures keyed by postcode — tests never hit a real network.
- **Isolation:** each test starts at `/` with a clean state (no shared fixtures beyond config).
- **Evidence:** trace on first retry, video on failure, screenshots on failure.
- **Projects:** `chromium-desktop`, `webkit-desktop`, `mobile-chrome` (Pixel 7).

## Planned coverage

1. `booking-general-waste.spec.ts` — SW1A 1AA → address pick → general waste → skip → confirm.
2. `booking-heavy-waste.spec.ts` — validates heavy-waste disables ≥ 2 skip sizes.
3. _Optional_ `booking-plasterboard.spec.ts` — exercises the 3-option plasterboard branch.

Each spec asserts at **every** step: URL, step indicator, API payload, visible state.
