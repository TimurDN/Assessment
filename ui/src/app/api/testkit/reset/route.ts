import { NextResponse } from "next/server";
import { keyPostcode, resetRetryCounter } from "@/lib/fixtures";
import {
  clearRecentBookings,
  clearRecentBookingsWhere,
} from "@/lib/bookings-store";

export const dynamic = "force-dynamic";

/**
 * Test-only reset endpoint.
 *
 * Clears *all* in-memory test fixtures so each spec starts from a
 * known state:
 *   - BS1 4DJ retry counter (or a specific postcode via `body.postcode`)
 *   - the booking-confirm idempotency cache (so re-running a happy-path
 *     test within 30s doesn't spuriously return `idempotent: true`)
 *
 * Disabled in production.
 */
export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "FORBIDDEN", message: "Test reset is disabled in production" },
      { status: 403 },
    );
  }

  let body: { postcode?: unknown; scope?: unknown } = {};
  try {
    body = (await request.json()) as { postcode?: unknown; scope?: unknown };
  } catch {
    // Empty or non-JSON body is allowed — default to resetting the BS1 counter.
  }

  const rawPostcode =
    typeof body.postcode === "string" && body.postcode.trim() !== ""
      ? body.postcode.trim()
      : "BS1 4DJ";
  const normalized = keyPostcode(rawPostcode) ?? "BS14DJ";

  resetRetryCounter(normalized);

  // Parallel workers share one in-memory booking cache, so clearing
  // the entire map from every `beforeEach` can race with another
  // worker's fresh write. Scope the clear to this test's postcode
  // unless the caller explicitly asks for a blanket reset.
  let bookingsScope: "scoped" | "all" = "scoped";
  if (body.scope === "all") {
    clearRecentBookings();
    bookingsScope = "all";
  } else {
    clearRecentBookingsWhere((sig) => {
      try {
        const parsed = JSON.parse(sig) as unknown[];
        const entryPostcode = parsed[0];
        return (
          typeof entryPostcode === "string" &&
          keyPostcode(entryPostcode) === normalized
        );
      } catch {
        return false;
      }
    });
  }

  return NextResponse.json({
    ok: true,
    reset: { retryCounter: normalized, bookings: bookingsScope },
  });
}
