---
name: scaffold-spec
description: >-
  Scaffold new Playwright test spec files following project conventions. Use when
  creating a new API spec, E2E spec, or functional spec file, or when the user
  asks to add tests for a new endpoint or user-facing flow.
---

# Scaffold Test Spec Files

Generate new Playwright spec files that follow the project's established conventions. This skill covers API tests, E2E tests, and functional UI tests.

## Why This Skill Exists

Every spec file in this project follows a strict structure: specific imports, tags, cleanup patterns, and naming conventions. When you scaffold by hand (or let the agent freestyle), you get inconsistency — wrong imports, missing cleanup, forgotten Zod validation, incorrect tags. Then someone has to fix it in review.

This skill exists so that **every new spec starts identical** regardless of who (or what) creates it. The templates below are not suggestions — they're the canonical starting point. Deviation means bugs that slip past CI.

The steps are ordered deliberately: determine type → read the rule → study a real example → generate → create supporting files → update the rule. Skipping "study an existing spec" (Step 3) is the #1 cause of specs that look right but violate project patterns in subtle ways.

## Step 1: Determine Spec Type

Ask the user (or infer from context) which type of spec to create:

| Type | Directory | Tag | Rule |
|------|-----------|-----|------|
| **API** | `automation/tests/api/` | `@App-API` | `api-tests.mdc` |
| **E2E** | `automation/tests/e2e/` | `@App-E2E` | `ui-tests.mdc` |
| **Functional** | `automation/tests/functional/` | `@App-regression` | `ui-tests.mdc` |

## Step 2: Read the Convention Rule

Read the matching `.cursor/rules/` file (`api-tests.mdc` or `ui-tests.mdc`) before generating any code. Follow it exactly.

## Step 3: Explore First

Before writing any test code, understand the current state of what you're testing:

- **API tests**: Make a real API request (GET the endpoint, POST with sample data) to see the actual response shape, status codes, and field names. Don't assume the API matches the docs — verify it.
- **E2E tests**: Navigate to the page in the browser. Look at the actual elements, test IDs, form fields, and component structure. Use `page.goto()` and inspect before writing locators.
- **Functional tests**: Open the wizard step you'll be testing. Check what fields exist, what validation messages appear, and what the default state looks like.

This step prevents writing tests against an imagined API or UI that doesn't match reality.

## Step 4: Study an Existing Spec

Read a comparable existing spec to match the established patterns:

| For this type... | Read this reference file... |
|------------------|-----------------------------|
| API (happy + validation) | `automation/tests/api/postcode-lookup.spec.ts` |
| API (business-rule errors + idempotency + cross-endpoint chain) | `automation/tests/api/booking-confirm.spec.ts` |
| API (GET with query params + coercion) | `automation/tests/api/skips.spec.ts` |
| E2E (happy path) | `automation/tests/e2e/general-waste.spec.ts` |
| E2E (branching) | `automation/tests/e2e/plasterboard.spec.ts` |
| Functional (data-driven loop + JSON) | `automation/tests/functional/postcode-validation.spec.ts` |
| Functional (error/retry UI) | `automation/tests/functional/retry-flow.spec.ts` |

## Step 5: Generate the Spec

### API Spec Template

```typescript
import { expect, test } from "../../fixtures/pom/test-options";
import { bookingConfig } from "../../config/booking";
import { faker } from "@faker-js/faker";
// Import Zod schemas from fixtures/api/schemas/booking/<resource>
// Import helpers from helpers/booking/<resource>
// Import invalid-type arrays from fixtures/api/invalid-types
// Import test data from test-data/booking/*.json

const ENDPOINT = bookingConfig.api.<ENDPOINT_KEY>;

// ═══════════════════════════════════════════════════════════════
// METHOD /path - Description
// ═══════════════════════════════════════════════════════════════

test.describe("METHOD /path - Description", () => {
  test(
    "Verify METHOD /path returns expected result",
    { tag: "@App-API" },
    async ({ apiRequest }) => {
      const { status, body } = await endpointHelper(apiRequest, inputs);
      expect(status).toBe(200);
      expect(ResponseSchema.parse(body)).toBeTruthy();
      // Assert business logic values only — Zod already proved the shape.
      expect(body.someField).toBe(expectedValue);
    },
  );
});
```

### E2E Spec Template

```typescript
import { expect, test } from "../../fixtures/pom/test-options";
import { faker } from "@faker-js/faker";
import bookingData from "../../test-data/booking/booking.json";

const MS = {
  page: 15_000,
  toast: 10_000,
  button: 20_000,
  grid: 15_000,
};

// ═══════════════════════════════════════════════════════════════
// E2E — <Feature>
// ═══════════════════════════════════════════════════════════════

test.describe("E2E — <Feature>", () => {
  test.setTimeout(300_000);

  test(
    "<Imperative description of the flow>",
    { tag: "@App-E2E" },
    async ({ page, bookingPage }) => {
      await test.step("GIVEN: User is on the booking homepage", async () => {
        await bookingPage.open();
        await bookingPage.verifyPageLoaded();
      });

      await test.step("WHEN: User enters postcode and selects an address", async () => {
        await bookingPage.enterPostcode(bookingData.postcodes.HAPPY);
        await bookingPage.verifyAddressListPopulated(bookingData.addressCounts.SW1A);
        await bookingPage.selectAddress(bookingData.addressIds.SW1A_DOWNING_10);
        await bookingPage.clickContinueFromStep1();
      });

      // ...more steps...

      await test.step("THEN: Booking success screen renders", async () => {
        await bookingPage.verifyBookingSuccess();
      });
    },
  );
});
```

### Functional Spec Template

```typescript
import { expect, test } from "../../fixtures/pom/test-options";
import bookingData from "../../test-data/booking/booking.json";
// Import the validation JSON for the endpoint/feature under test

// ═══════════════════════════════════════════════════════════════
// Booking Wizard — <Feature> Validation
// ═══════════════════════════════════════════════════════════════

test.describe("Booking Wizard — <Feature>", () => {
  test.beforeEach(async ({ bookingPage }) => {
    await test.step("GIVEN: User is on the booking homepage", async () => {
      await bookingPage.open();
      await bookingPage.verifyPageLoaded();
    });
  });

  test(
    "Verify <scenario description>",
    { tag: "@App-regression" },
    async ({ bookingPage }) => {
      // validation test body
    },
  );
});
```

## Step 6: Create Supporting Files (if needed)

For a new resource/endpoint, you may also need:

| File | When |
|------|------|
| `automation/fixtures/api/schemas/booking/<resource>.ts` | New API resource — Zod schemas for all responses |
| `automation/helpers/booking/<resource>.ts` | New API resource — helper functions (CRUD + cleanup) |
| `automation/config/booking.ts` | New API path constant |
| `automation/pages/<Resource>Page.ts` | New UI page — page object class (extends `BasePage`) |
| `automation/fixtures/pom/page-object-fixture.ts` | New page object — register fixture |
| `automation/test-data/booking/<resource>.json` | Shared test data (validation rules, options) |

## Step 7: Update the Rule File

After creating the spec, update the matching `.cursor/rules/` file (`api-tests.mdc` or `ui-tests.mdc`) with:
- New endpoint context section (if adding a new resource)
- Test inventory (describe blocks + test count)
- Helpers and schemas created
- Known bugs found

## Checklist

- [ ] Imports follow the project pattern exactly
- [ ] Tags match the spec type (`@App-API`, `@App-E2E`, `@App-regression`)
- [ ] Cleanup in `test.afterAll` — for API-visible state (retry counter, idempotency) only; no persistent resources exist
- [ ] Zod schema validation on every API response (`expect(Schema.parse(body)).toBeTruthy()`)
- [ ] Test names start with "Verify ..." (API) or describe the flow (E2E/functional)
- [ ] No `any` types — explicit generics on `apiRequest<T>()`
- [ ] `test.step` used for multi-phase tests with GIVEN/WHEN/THEN/AND

## Incorrect Usage — Don't Do This

### Wrong: Cleanup inside the test body

```typescript
// BAD — if the test fails before this line, the server state is never reset
test("BS1 retry flow", async ({ apiRequest }) => {
  // ... assertions ...
  await resetRetryCounter(apiRequest, "BS1 4DJ"); // orphaned on failure
});
```

```typescript
// CORRECT — beforeEach always runs, guaranteeing clean state
test.beforeEach(async ({ apiRequest }) => {
  await resetRetryCounter(apiRequest, bookingData.postcodes.RETRY);
});
```

### Wrong: try/catch silencing failures

```typescript
// BAD — if status is 500, this test passes silently
test("Create booking", async ({ apiRequest }) => {
  try {
    const { status, body } = await confirmBooking(apiRequest, payload);
    expect(status).toBe(200);
  } catch {
    console.log("Request failed");
  }
});
```

```typescript
// CORRECT — let it throw, Playwright reports the actual error
test("Create booking", async ({ apiRequest }) => {
  const { status, body } = await confirmBooking(apiRequest, payload);
  expect(status).toBe(200);
  expect(BookingConfirmResponseSchema.parse(body)).toBeTruthy();
});
```

### Wrong: Missing Zod validation

```typescript
// BAD — status 200 with garbage body passes
test("Get skips", async ({ apiRequest }) => {
  const { status } = await getSkips(apiRequest, { postcode: "SW1A 1AA" });
  expect(status).toBe(200);
});
```

```typescript
// CORRECT — Zod proves the response shape is what we expect
test("Get skips", async ({ apiRequest }) => {
  const { status, body } = await getSkips(apiRequest, { postcode: "SW1A 1AA" });
  expect(status).toBe(200);
  expect(SkipsResponseSchema.parse(body)).toBeTruthy();
  expect(body.skips).toHaveLength(8);
});
```

### Wrong: UI cleanup instead of API cleanup

```typescript
// BAD — fragile, slow, breaks if UI changes
test.afterAll(async ({ page, bookingPage }) => {
  await bookingPage.open();
  await page.getByRole("button", { name: "Start a new booking" }).click();
  // ...
});
```

```typescript
// CORRECT — reset server-side state via the API, not the UI
test.beforeEach(async ({ apiRequest }) => {
  await resetRetryCounter(apiRequest, bookingData.postcodes.RETRY);
});
```

### Wrong: Redundant field assertions after Zod parse

```typescript
// BAD — Zod already proved all of this
test("Verify lookup returns SW1A addresses", async ({ apiRequest }) => {
  const { status, body } = await lookupPostcode(apiRequest, "SW1A 1AA");
  expect(status).toBe(200);
  expect(PostcodeLookupResponseSchema.parse(body)).toBeTruthy();
  expect(body.postcode).toBeTruthy();             // redundant
  expect(body.addresses).toBeDefined();            // redundant
  expect(typeof body.postcode).toBe("string");     // redundant
  expect(Array.isArray(body.addresses)).toBe(true); // redundant
});
```

```typescript
// CORRECT — Zod validates shape, then assert only business logic values
test("Verify lookup returns SW1A addresses", async ({ apiRequest }) => {
  const { status, body } = await lookupPostcode(apiRequest, "SW1A 1AA");
  expect(status).toBe(200);
  expect(PostcodeLookupResponseSchema.parse(body)).toBeTruthy();
  expect(body.postcode).toBe("SW1A 1AA");
  expect(body.addresses).toHaveLength(13);
});
```

### Wrong: Conditional logic in tests

```typescript
// BAD — non-deterministic, hides branches that never execute
test("Verify lookup", async ({ apiRequest }) => {
  const { status, body } = await lookupPostcode(apiRequest, "SW1A 1AA");
  if (status === 200) {
    expect(body.addresses).toHaveLength(13);
  } else {
    expect(status).toBe(422);
  }
});
```

```typescript
// CORRECT — separate tests for separate behaviors
test("Verify lookup returns 200 for valid postcode", async ({ apiRequest }) => {
  const { status, body } = await lookupPostcode(apiRequest, "SW1A 1AA");
  expect(status).toBe(200);
  expect(body.addresses).toHaveLength(13);
});

test("Verify lookup returns 422 for malformed postcode", async ({ apiRequest }) => {
  const { status } = await lookupPostcode(apiRequest, "NOTAPOSTCODE");
  expect(status).toBe(422);
});
```

### Wrong: 405 loop outside the test block

```typescript
// BAD — creates a separate test per method, pollutes test count
for (const method of ["PUT", "PATCH", "DELETE"] as const) {
  test(`Verify ${method} returns 405`, async ({ apiRequest }) => {
    // ...
  });
}
```

```typescript
// CORRECT — one test, loop inside
test("Verify unsupported methods return 405", { tag: "@App-API" }, async ({ apiRequest }) => {
  for (const method of [...unsupportedMethods, "GET"] as const) {
    await test.step(`${method} ${ENDPOINT} → 405`, async () => {
      const { status } = await apiRequest({
        method: method as "GET" | "PUT" | "PATCH" | "DELETE",
        url: ENDPOINT,
        baseUrl: bookingConfig.apiUrl,
      });
      expect(status).toBe(405);
    });
  }
});
```

### Wrong: Bypassing `apiRequest` for the INVALID_JSON test

```typescript
// BAD — dropping to raw `request.post` + `response.json()` skips the
// project's single source of truth for request/response plumbing.
const response = await request.post(url, {
  data: Buffer.from("{not-json"),
  headers: { "Content-Type": "application/json" },
});
expect(response.status()).toBe(400);
expect((await response.json()).error).toBe("INVALID_JSON");
```

```typescript
// CORRECT — use `apiRequest({ rawBody })` so the spec stays idiomatic.
// `rawBody` accepts a Buffer and bypasses JSON serialization; string
// `body` would be silently JSON-encoded into valid JSON by Playwright.
const { status, body } = await apiRequest<APIError>({
  method: "POST",
  url: ENDPOINT,
  baseUrl: bookingConfig.apiUrl,
  rawBody: Buffer.from("{not-json"),
});
expect(status).toBe(400);
expect(APIErrorSchema.parse(body)).toBeTruthy();
expect(body.error).toBe("INVALID_JSON");
```

## Edge Cases & Gotchas

Things that will bite you if you don't account for them upfront:

### BS1 4DJ retry counter leaks across tests

The retry counter lives in module-scope state on the server. If a test triggers the first-call-500 and doesn't reset the counter afterward, the next test that looks up BS1 4DJ will succeed on what it expected to be a fresh first call. **Always** reset in `beforeEach`.

### Idempotency collisions across tests

The confirm endpoint caches recent bookings on a 30-second window keyed on a stable signature of the payload. If two tests submit the exact same payload within 30 seconds, the second will come back `idempotent: true` — which may or may not be what the test wants. Use different `addressId` values (or different skip sizes, prices) across tests to avoid surprise collisions.

### Playwright silently JSON-encodes string `data`

Passing `{ data: "not-json" }` to `request.post()` produces a valid-JSON string on the wire (e.g. `"not-json"` as a JSON string literal). The server then parses it successfully and looks up `.postcode` on a string primitive, which returns `undefined`, triggering MISSING_POSTCODE instead of INVALID_JSON. Use `Buffer.from(...)` for raw-bytes requests.

### UI bug fallout in E2E assertions

When the app has a known bug (see the "Known Bugs" list in `api-tests.mdc`), pass the **currently observed** value into `verifyPriceTotal()` rather than the mathematically-correct one. Bug-discovery specs live elsewhere and can assert the correct formula to fail the build.

### E2E timeouts

E2E flows need `test.setTimeout(300_000)` at the describe level. Without it, a slow postcode lookup (M1 1AE has ~1.2s simulated latency) plus a skip-list fetch plus confirm can burn through the default 30s.

### Functional tests: `beforeEach` must navigate

Every functional test expects `bookingPage.open()` + `verifyPageLoaded()` in `beforeEach`. If you skip it, the second test inherits state from the previous one (selected address, entered postcode) and behaves unpredictably.
