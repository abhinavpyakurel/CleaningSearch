import { NextResponse } from "next/server";

import {
  estimateIntake,
  type CleanType,
  type IntakeInput,
} from "@/lib/intake-estimate";

const CLEAN_TYPES: CleanType[] = ["maintenance", "deep", "move-out"];

function isCleanType(value: unknown): value is CleanType {
  return typeof value === "string" && CLEAN_TYPES.includes(value as CleanType);
}

function parseNonNegativeNumber(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return null;
  }
  return value;
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const bedrooms = parseNonNegativeNumber(body.bedrooms);
  const bathrooms = parseNonNegativeNumber(body.bathrooms);

  if (bedrooms === null || bathrooms === null) {
    return NextResponse.json(
      { error: "bedrooms and bathrooms must be non-negative numbers" },
      { status: 400 }
    );
  }

  if (!isCleanType(body.cleanType)) {
    return NextResponse.json(
      { error: 'cleanType must be "maintenance", "deep", or "move-out"' },
      { status: 400 }
    );
  }

  if (typeof body.hasPets !== "boolean") {
    return NextResponse.json(
      { error: "hasPets must be a boolean" },
      { status: 400 }
    );
  }

  const input: IntakeInput = {
    bedrooms,
    bathrooms,
    cleanType: body.cleanType,
    hasPets: body.hasPets,
  };

  return NextResponse.json(estimateIntake(input));
}
