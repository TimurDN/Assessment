/**
 * In-memory idempotency store for `POST /api/booking/confirm`.
 *
 * Lives in its own module so both the confirm route (writer) and the
 * testkit reset route (clear-on-demand) can share a single Map
 * instance. Scoped to the server process — no persistence, which is
 * the correct semantics for the deterministic-fixture demo.
 */

export const IDEMPOTENCY_WINDOW_MS = 30_000;

const recentBookings = new Map<string, { bookingId: string; at: number }>();

export function getRecentBooking(signature: string):
  | { bookingId: string; at: number }
  | undefined {
  return recentBookings.get(signature);
}

export function recordBooking(signature: string, bookingId: string): void {
  recentBookings.set(signature, { bookingId, at: Date.now() });
}

export function clearRecentBookings(): void {
  recentBookings.clear();
}

/**
 * Remove only entries whose signature matches a predicate.
 *
 * Used by the testkit reset so a spec cleaning its own postcode
 * cannot wipe a sibling worker's fresh write mid-test.
 */
export function clearRecentBookingsWhere(
  predicate: (signature: string) => boolean,
): void {
  for (const sig of Array.from(recentBookings.keys())) {
    if (predicate(sig)) recentBookings.delete(sig);
  }
}
