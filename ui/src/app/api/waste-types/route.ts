import { NextResponse } from "next/server";
import { PLASTERBOARD_OPTIONS, type PlasterboardOptionId } from "@/lib/fixtures";

export const dynamic = "force-dynamic";

const VALID_PLASTERBOARD_IDS: ReadonlySet<PlasterboardOptionId> = new Set(
  PLASTERBOARD_OPTIONS.map((o) => o.id),
);

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
    heavyWaste?: unknown;
    plasterboard?: unknown;
    plasterboardOption?: unknown;
  };

  if (typeof b.heavyWaste !== "boolean") {
    return NextResponse.json(
      { error: "INVALID_HEAVY_WASTE", message: "heavyWaste must be boolean" },
      { status: 400 },
    );
  }
  if (typeof b.plasterboard !== "boolean") {
    return NextResponse.json(
      { error: "INVALID_PLASTERBOARD", message: "plasterboard must be boolean" },
      { status: 400 },
    );
  }

  if (b.plasterboard) {
    if (
      typeof b.plasterboardOption !== "string" ||
      !VALID_PLASTERBOARD_IDS.has(b.plasterboardOption as PlasterboardOptionId)
    ) {
      return NextResponse.json(
        {
          error: "MISSING_PLASTERBOARD_OPTION",
          message:
            "plasterboardOption is required when plasterboard=true and must be one of bagged|segregated|collection",
        },
        { status: 422 },
      );
    }
  } else if (b.plasterboardOption != null) {
    return NextResponse.json(
      {
        error: "UNEXPECTED_PLASTERBOARD_OPTION",
        message: "plasterboardOption must be null when plasterboard=false",
      },
      { status: 422 },
    );
  }

  return NextResponse.json({ ok: true });
}
