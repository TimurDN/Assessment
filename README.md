# QA Assessment — Booking Flow

> Candidate: **Timur Naumov**
> Submission for the QA Engineer take-home assessment.

A realistic 4-step skip/waste booking wizard with branching logic, deterministic fixtures, rich UI states, full manual test coverage, Playwright E2E automation, and bug reports.

---

## Project structure

```
.
├── README.md           # you are here — quick start
├── manual-tests.md     # → docs/manual-tests.md  (root-level pointer per PDF spec)
├── bug-reports.md      # → docs/bug-reports.md   (root-level pointer per PDF spec)
├── ui/                 # Next.js 16 app + API routes (App Router, TS, Tailwind, shadcn/ui)
├── automation/         # Playwright suite (API + E2E + functional, 60 unique tests)
├── docs/               # EVERYTHING for reviewers — reports, video, screenshots, bug evidence
│   ├── README.md         # navigation hub (start here)
│   ├── bug-reports.md    # 3 defects (severity, priority, repro, evidence)
│   ├── manual-tests.md   # 38 manual cases + automated-test inventory
│   ├── lighthouse.html   # Lighthouse report — 100 / 100 / 100 / 100
│   ├── accessibility.md  # axe-core summary — 0 violations
│   ├── accessibility.json
│   ├── flow-video.webm
│   ├── bugs/
│   └── screenshots/{desktop,mobile}/
├── Dockerfile
└── docker-compose.yml
```

> **Reviewers:** jump straight to [`docs/README.md`](./docs/README.md) —
> every deliverable is linked from there.

---

## Quick start

### Prerequisites

- **Node 20.x** — see `.nvmrc`. With `nvm`: `nvm install && nvm use` in the repo root.
- **Docker Desktop** (optional) — only needed for the one-command path. Must be running before `docker compose up`.

### Option A — Run with Docker (single command)

```bash
docker compose up --build
```

Then open http://localhost:3000.

> **Note:** the Docker image runs in production mode, which disables the
> `POST /api/testkit/reset` helper. For running the Playwright suite use
> Option B below — the tests rely on the dev server.

### Option B — Run locally (dev + tests)

```bash
# Terminal 1 — UI + API on :3000
cd ui
npm install
npm run dev

# Terminal 2 — Playwright suite (auto-reuses the server above;
# if :3000 is free it will also auto-start one)
cd automation
npm install
npm run install-browsers   # first time only — pulls Chromium/WebKit
npm test                   # chromium-desktop, full suite
```

Useful variants once installed:

```bash
npm run test:api           # API layer only      (~43 tests)
npm run test:e2e           # full-wizard E2E     (~3 tests)
npm run test:regression    # functional suite    (~14 tests)
npm run test:ui            # Playwright UI mode
npm run test:all-browsers  # chromium + webkit + mobile-chrome (180 runs)
```

### Public demo

Docker is the authoritative run path for this submission. No hosted URL
is provided — cloning and running `docker compose up --build` matches
the reviewer's machine byte-for-byte (same Node version, same fixtures,
same build output), which is what the PDF's "Dockerfile with a single run
command" option exists for.

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `Cannot connect to the Docker daemon at unix:///…/docker.sock` | Start Docker Desktop and retry `docker compose up --build`. |
| `Can't resolve 'tailwindcss'` / Turbopack picks the wrong root | Two possible causes. **(a)** A stray `package-lock.json` at the repo root — delete it (only `ui/` and `automation/` should have lockfiles). **(b)** Stale Turbopack cache from a previous session that memorised the wrong root: `rm -rf ui/.next && npm run dev` from inside `ui/`. `ui/next.config.ts` already pins `turbopack.root` so fresh clones won't hit this. |
| `Bind for 0.0.0.0:3000 failed: port is already allocated` (Docker) | You have a dev server on :3000 from Option B. Stop it first — `lsof -ti :3000 \| xargs kill` — then retry `docker compose up`. The dev server and the Docker container can't coexist on the same port. |
| `Error: listen EADDRINUSE: address already in use :::3000` (dev server) | Another process owns port 3000. `lsof -ti :3000 \| xargs kill`, or stop any running container with `docker compose down`. |
| `Cannot connect to the Docker daemon at unix:///…/docker.sock` | Start Docker Desktop and retry `docker compose up --build`. |
| `Missing script: test` when running the suite | Run from inside `automation/`, not the repo root. The script lives in `automation/package.json`. |
| `browserType.launch: Executable doesn't exist at …` | Run `npm run install-browsers` inside `automation/`. |
| Tests against the Docker container return 403 on `/api/testkit/reset` | Expected — reset is disabled in production. Run the suite against the dev server (Option B). |
| `Blocked cross-origin request to Next.js dev resource /_next/webpack-hmr from "127.0.0.1"` | Harmless HMR warning when a test or browser hits the dev server via `127.0.0.1` while it started on `localhost`. Either use `localhost` everywhere, or add `allowedDevOrigins: ["127.0.0.1"]` to `ui/next.config.ts` (dev-only). |
| `uv_interface_addresses returned Unknown system error 1` (macOS) | Transient OS networking issue. Reboot, or run the dev server with `HOSTNAME=127.0.0.1 npm run dev`. |

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

See [`docs/manual-tests.md`](./docs/manual-tests.md) — **38 test cases** (PDF asks for ≥ 35):

| Category         | PDF min | This plan |
| ---------------- | ------- | --------- |
| Happy path       | —       | 4         |
| Negative         | 10      | 12        |
| Edge             | 6       | 7         |
| API failure      | 4       | 5         |
| State transition | 4       | 5         |
| Accessibility    | —       | 3         |
| Responsiveness   | —       | 2         |

31 cases have automation coverage cited inline; 7 are manual-only (a11y, responsive, Unicode curl, VAT visual).

## Bug reports

See [`docs/bug-reports.md`](./docs/bug-reports.md) — 3 bugs including a state-transition defect.

## Automation

See [`automation/`](./automation) — **60 unique tests** across three layers,
run against 3 projects (Chromium desktop, WebKit desktop, Mobile Chrome)
for **180 test executions per full suite**:

| Layer      | Specs | Tests | Tag                | What it exercises                                            |
| ---------- | ----- | ----- | ------------------ | ------------------------------------------------------------ |
| API        | 4     | 43    | `@App-API`         | Direct HTTP against `/api/*`; Zod-validated responses        |
| E2E        | 3     | 3     | `@App-E2E`         | Full wizard in a browser: general / heavy / plasterboard     |
| Functional | 3     | 14    | `@App-regression`  | Scoped UI behaviour: retry, postcode validation, state moves |

Full breakdown per spec file and coverage mapping in
[`docs/manual-tests.md` → *Automated test inventory*](./docs/manual-tests.md#automated-test-inventory).

Selectors use `data-testid`. Trace + video on retry. Run a subset with
`npx playwright test --grep @App-API` (or `-E2E`, `-regression`).

## UI/UX evidence

See [`docs/`](./docs) — mobile + desktop screenshots, empty / error /
retry states, disabled-skip visibility, price breakdown, flow video,
and per-bug screenshots. Navigation index in
[`docs/README.md`](./docs/README.md).

**Lighthouse** ([`docs/lighthouse.html`](./docs/lighthouse.html)) —
Performance **100** · Accessibility **100** · Best Practices **100** ·
SEO **100** (desktop preset, Docker production build).

**axe-core** ([`docs/accessibility.md`](./docs/accessibility.md)) —
**0 violations** across 42 passed WCAG A/AA rules. Raw JSON in
[`docs/accessibility.json`](./docs/accessibility.json).

Deeper accessibility coverage (keyboard-only flow, screen-reader
announcements, focus-ring visibility) lives in the manual test plan as
TC-034 – TC-036, where it's marked *Manual — not captured* because it
needs assistive-tech hardware the automation suite can't drive.

---

## License

Proprietary — take-home assessment submission.
