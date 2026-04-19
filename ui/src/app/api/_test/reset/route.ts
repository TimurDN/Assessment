import { NextResponse } from "next/server";
import { resetRetryCounter } from "@/lib/fixtures";

export const dynamic = "force-dynamic";

/**
 * Test-only reset endpoint.
 *
 * Playwright calls this in `beforeEach` for specs that depend on the
 * BS1 4DJ "500 on first call, success on retry" fixture so each test
 * starts from a known state. Disabled in production.
 */
export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "FORBIDDEN", message: "Test reset is disabled in production" },
      { status: 403 },
    );
  }

  let body: { postcode?: unknown } = {};
  try {
    body = (await request.json()) as { postcode?: unknown };
  } catch {
    // Empty or non-JSON body is allowed — default to resetting the BS1 counter.
  }

  const postcode =
    typeof body.postcode === "string" && body.postcode.trim() !== ""
      ? body.postcode.trim().toUpperCase().replace(/\s+/g, "")
      : "BS14DJ";

  resetRetryCounter(postcode);
  return NextResponse.json({ ok: true, reset: postcode });
}
