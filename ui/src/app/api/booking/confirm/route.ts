import { NextResponse } from "next/server";
import {
  ADDRESS_BOOK,
  applySkipRules,
  generateBookingId,
  keyPostcode,
} from "@/lib/fixtures";

export const dynamic = "force-dynamic";

/**
 * In-memory idempotency / double-submit guard. Keyed on a stable signature
 * of the booking payload. Lives for the lifetime of the server process,
 * which is sufficient for the take-home demo.
 */
const recentBookings = new Map<string, { bookingId: string; at: number }>();
const IDEMPOTENCY_WINDOW_MS = 30_000;

function signature(payload: Record<string, unknown>): string {
  return JSON.stringify([
    payload.postcode,
    payload.addressId,
    payload.heavyWaste,
    payload.plasterboard,
    payload.plasterboardOption ?? null,
    payload.skipSize,
    payload.price,
  ]);
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "INVALID_JSON", message: "Request body must be valid JSON" },
      { status: 400 },
    );
  }

  const b = body as {
    postcode?: unknown;
    addressId?: unknown;
    heavyWaste?: unknown;
    plasterboard?: unknown;
    plasterboardOption?: unknown;
    skipSize?: unknown;
    price?: unknown;
  };

  if (typeof b.postcode !== "string") {
    return NextResponse.json(
      { error: "INVALID_POSTCODE", message: "postcode is required" },
      { status: 400 },
    );
  }
  const key = keyPostcode(b.postcode);
  if (!key) {
    return NextResponse.json(
      { error: "INVALID_POSTCODE", message: "postcode is not a valid UK postcode" },
      { status: 422 },
    );
  }

  if (typeof b.addressId !== "string" || b.addressId.trim() === "") {
    return NextResponse.json(
      { error: "INVALID_ADDRESS", message: "addressId is required" },
      { status: 400 },
    );
  }

  const addresses = ADDRESS_BOOK[key] ?? [];
  const addressExists =
    b.addressId.startsWith("manual:") ||
    addresses.some((a) => a.id === b.addressId);
  if (!addressExists) {
    return NextResponse.json(
      {
        error: "ADDRESS_NOT_FOUND",
        message: "addressId does not belong to the given postcode",
      },
      { status: 422 },
    );
  }

  if (typeof b.heavyWaste !== "boolean" || typeof b.plasterboard !== "boolean") {
    return NextResponse.json(
      { error: "INVALID_WASTE_FLAGS", message: "heavyWaste and plasterboard must be booleans" },
      { status: 400 },
    );
  }

  if (typeof b.skipSize !== "string") {
    return NextResponse.json(
      { error: "INVALID_SKIP", message: "skipSize is required" },
      { status: 400 },
    );
  }

  const skips = applySkipRules({
    heavyWaste: b.heavyWaste,
    plasterboard: b.plasterboard,
  });
  const selected = skips.find((s) => s.size === b.skipSize);
  if (!selected) {
    return NextResponse.json(
      { error: "SKIP_NOT_FOUND", message: "skipSize is not a valid size" },
      { status: 422 },
    );
  }
  if (selected.disabled) {
    return NextResponse.json(
      {
        error: "SKIP_DISABLED",
        message: `${selected.size} is not available for this selection`,
      },
      { status: 409 },
    );
  }

  if (typeof b.price !== "number" || b.price !== selected.price) {
    return NextResponse.json(
      {
        error: "PRICE_MISMATCH",
        message: `Expected price ${selected.price} for ${selected.size}, got ${String(b.price)}`,
      },
      { status: 409 },
    );
  }

  const sig = signature(b as Record<string, unknown>);
  const existing = recentBookings.get(sig);
  const now = Date.now();
  if (existing && now - existing.at < IDEMPOTENCY_WINDOW_MS) {
    return NextResponse.json({
      status: "success",
      bookingId: existing.bookingId,
      idempotent: true,
    });
  }

  const bookingId = generateBookingId();
  recentBookings.set(sig, { bookingId, at: now });
  return NextResponse.json({ status: "success", bookingId });
}
