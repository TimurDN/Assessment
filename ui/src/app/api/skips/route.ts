import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { applySkipRules, keyPostcode } from "@/lib/fixtures";

export const dynamic = "force-dynamic";

function parseBool(value: string | null): boolean {
  return value === "true" || value === "1";
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const postcode = params.get("postcode");
  const heavyWaste = parseBool(params.get("heavyWaste"));
  const plasterboard = parseBool(params.get("plasterboard"));

  if (!postcode) {
    return NextResponse.json(
      { error: "MISSING_POSTCODE", message: "postcode query param is required" },
      { status: 400 },
    );
  }

  const key = keyPostcode(postcode);
  if (!key) {
    return NextResponse.json(
      { error: "INVALID_POSTCODE", message: "postcode is not a valid UK postcode" },
      { status: 422 },
    );
  }

  const skips = applySkipRules({ heavyWaste, plasterboard });
  return NextResponse.json({ skips });
}
