import { NextResponse } from "next/server";
import {
  ADDRESS_BOOK,
  LATENCY_MS_FOR,
  normalizePostcode,
  keyPostcode,
  shouldFailFirstCall,
} from "@/lib/fixtures";

export const dynamic = "force-dynamic";

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

  const raw = (body as { postcode?: unknown })?.postcode;
  if (typeof raw !== "string" || raw.trim() === "") {
    return NextResponse.json(
      { error: "MISSING_POSTCODE", message: "postcode is required" },
      { status: 400 },
    );
  }

  const normalized = normalizePostcode(raw);
  const key = keyPostcode(raw);
  if (!normalized || !key) {
    return NextResponse.json(
      {
        error: "INVALID_POSTCODE",
        message: "postcode is not a valid UK postcode",
      },
      { status: 422 },
    );
  }

  const latency = LATENCY_MS_FOR(key);
  if (latency > 0) {
    await new Promise((resolve) => setTimeout(resolve, latency));
  }

  if (shouldFailFirstCall(key)) {
    return NextResponse.json(
      {
        error: "UPSTREAM_ERROR",
        message: "Address provider is temporarily unavailable. Please retry.",
      },
      { status: 500 },
    );
  }

  const addresses = ADDRESS_BOOK[key] ?? [];
  return NextResponse.json({
    postcode: normalized,
    addresses,
  });
}
