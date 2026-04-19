# QA Assessment — Booking Flow

> Candidate: **Timur Naumov**
> Submission for the QA Engineer take-home assessment.

A realistic 4-step skip/waste booking wizard with branching logic, deterministic fixtures, rich UI states, full manual test coverage, Playwright E2E automation, and bug reports.

---

## Project structure

```
.
├── ui/                # Next.js 15 (App Router, TS, Tailwind, shadcn/ui) — the app + API routes
├── automation/        # Playwright + TypeScript E2E tests
├── manual-tests.md    # 35+ manual test cases (negative, edge, API failure, state transition)
├── bug-reports.md     # Bug reports with severity, priority, repro, expected vs actual
├── docs/              # Screenshots, flow video, Lighthouse + a11y reports
├── Dockerfile
├── docker-compose.yml
└── README.md          # You are here
```

---

## Quick start

### Run with Docker (single command)

```bash
docker compose up --build
```

Then open http://localhost:3000.

### Run locally (dev)

```bash
# UI (runs on :3000 with API routes)
cd ui
npm install
npm run dev

# Playwright E2E (in a second terminal)
cd automation
npm install
npx playwright install
npm test
```

Node version: see `.nvmrc` (Node 20). If you use `nvm`, run `nvm use` in the project root.

### Public demo

<!-- Filled in after Vercel deploy -->
Vercel URL: _TBD_

---

## API contract

| Method | Path                       | Purpose |
|--------|----------------------------|---------|
| POST   | `/api/postcode/lookup`     | UK postcode → addresses |
| POST   | `/api/waste-types`         | Persist waste-type selection |
| GET    | `/api/skips`               | List available skips (with disabled logic) |
| POST   | `/api/booking/confirm`     | Confirm booking, returns `bookingId` |

Exact request/response shapes match the assessment spec in `docs/assessment.pdf`.

### Deterministic fixtures

| Postcode    | Behavior |
|-------------|----------|
| `SW1A 1AA`  | 12+ addresses |
| `EC1A 1BB`  | 0 addresses (empty state) |
| `M1 1AE`    | Simulated latency |
| `BS1 4DJ`   | 500 error on first call, success on retry |
| `heavyWaste=true` | Disables ≥2 skip sizes |

---

## Mocking / test data strategy

All API endpoints are implemented as Next.js route handlers backed by in-memory fixtures defined in `ui/src/lib/fixtures.ts`. This guarantees deterministic responses across runs — no DB, no external calls. The same fixtures drive the Playwright suite via a `data-testid` and URL-based state contract, so tests never depend on network timing.

For negative paths, the handlers branch on postcode or a query flag to produce empty, slow, or 500 responses — exercising the retry and error UI without mocking at the Playwright layer.

---

## Manual testing

See [`manual-tests.md`](./manual-tests.md) — 35+ cases covering:
- 10+ negative paths
- 6+ edge cases
- 4+ API-failure scenarios
- 4+ state-transition scenarios

## Bug reports

See [`bug-reports.md`](./bug-reports.md) — ≥3 bugs including at least one branching / state-transition issue.

## Automation

See [`automation/`](./automation) — two end-to-end flows:
1. **General waste path** (SW1A 1AA → address → general → skip → confirm).
2. **Heavy waste path** (validates disabled-skip logic) or **Plasterboard branching path**.

Assertions at every step. Selectors use `data-testid`. Trace + video on retry.

## UI/UX evidence

See [`docs/`](./docs) — mobile + desktop screenshots, empty/error/retry states, disabled-skip visibility, price breakdown, 60–120s flow video, Lighthouse report, axe accessibility report.

---

## License

Proprietary — take-home assessment submission.
