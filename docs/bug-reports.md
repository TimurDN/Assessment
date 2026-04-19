# Bug Reports — Booking Flow

Three defects found while testing the booking wizard. Evidence lives in
[`./bugs/`](./bugs/).

| ID    | Severity | Priority | Category         | Branching? |
| ----- | -------- | -------- | ---------------- | ---------- |
| BUG-1 | High     | P1       | State transition | **Yes**    |
| BUG-2 | Medium   | P2       | Input validation | No         |
| BUG-3 | Critical | P1       | Billing / total  | No         |

All three are covered by [`./manual-tests.md`](./manual-tests.md)
(TC-032 / TC-015 / TC-033) and reachable from the automation suite.

---

## BUG-1 — Selected skip leaks across waste-type changes

**Severity:** High · **Priority:** P1 · **Category:** State transition

**Env:** `http://127.0.0.1:3000`, Chromium 140, commit `91ee2f3`.

**Repro**

1. `SW1A 1AA` → pick any address → Continue.
2. Heavy = No, Plasterboard = No → Continue.
3. Step 3: pick **2-yard** → Continue.
4. Step 4: Back → Back (now on step 2).
5. Flip **Heavy = Yes** → Continue → Continue.

**Expected:** changing waste flags clears the skip selection. 2-yard is
disabled on step 3 with no card pre-selected, `Continue` disabled.

**Actual:** `selectedSkipSize = "2-yard"` survives the `set-waste` dispatch.
Step 3 shows 2-yard disabled but `Continue` stays enabled, and the user
lands on step 4 with *Heavy waste: Yes* + *Skip size: 2-yard* — an
impossible combination step 3 just marked “Not rated for heavy waste”.

**Evidence:** [`./bugs/BUG-1-skip-leak.png`](./bugs/BUG-1-skip-leak.png) — step 4 Review
showing the impossible combo. (On step 3 the selection ring is suppressed
on disabled cards — `step-skip.tsx:134` — so the stale state is invisible;
`Continue` being enabled is the only on-step-3 tell.)

**Root cause:** `bookingReducer` `case "set-waste"` in
`ui/src/lib/booking-state.ts` no longer resets `skips` / `selectedSkipSize`.
Fix: re-add those two resets.

---

## BUG-2 — Postcode accepts invalid UK postcodes client-side

**Severity:** Medium · **Priority:** P2 · **Category:** Input validation

**Env:** Step 1 on `/`, any browser, commit `91ee2f3`.

**Repro**

1. Open `/`, type `NOTAUK` (or any 5+ char non-postcode like `XYZ99`).
2. Click **Find address**.

**Expected:** inline rejection *“That doesn’t look like a valid UK
postcode.”*, **no network request**.

**Actual:** client only checks `trimmed.length < 5`, so `NOTAUK` passes,
fires `POST /api/postcode/lookup`, and the backend 422 bubbles up as a
server-error alert.

**Evidence:** [`./bugs/BUG-2-postcode-validation.png`](./bugs/BUG-2-postcode-validation.png) — shows
the destructive **Alert card** (rendered only on `lookup.kind === "error"`,
i.e. after the round-trip) instead of the inline `<p>` validation message
used for empty input.

**Root cause:** `runLookup()` in
`ui/src/components/booking/step-postcode.tsx`. Fix: replace the length
check with `if (!normalizePostcode(trimmed))` (normaliser already exists
in `@/lib/fixtures`).

---

## BUG-3 — VAT shown on breakdown but excluded from total

**Severity:** Critical · **Priority:** P1 · **Category:** Billing

**Env:** Step 4 on `/`, any browser, commit `91ee2f3`.

**Repro**

1. Complete a happy path with a 6-yard skip (£200).
2. Inspect the **Price breakdown** on the Review step.

**Expected:** Subtotal £200 · VAT (20 %) £40 · **Total £240**.

**Actual:** Subtotal £200 · VAT (20 %) £40 · **Total £200** — VAT line is
rendered but silently dropped from the total. Under-charges by 20 % on
every booking.

**Evidence:** [`./bugs/BUG-3-vat-total.png`](./bugs/BUG-3-vat-total.png).

**Root cause:** `computePriceBreakdown` in `ui/src/lib/pricing.ts:52` —
`const total = subtotal;`. Fix: `const total = subtotal + vat;`.
