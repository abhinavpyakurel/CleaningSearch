import { NextResponse } from "next/server";

import {
  estimateIntake,
  EXTRA_TASKS,
  HOME_TYPES,
  MESS_LEVELS,
  SERVICE_TYPES,
  SQUARE_FEET_RANGES,
  type ExtraTask,
  type HomeType,
  type IntakeInput,
  type MessLevel,
  type ServiceType,
  type SquareFeetRange,
} from "@/lib/intake-estimate";

function parseNonNegativeNumber(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return null;
  }
  return value;
}

function isHomeType(value: unknown): value is HomeType {
  return typeof value === "string" && HOME_TYPES.includes(value as HomeType);
}

function isSquareFeetRange(value: unknown): value is SquareFeetRange {
  return (
    typeof value === "string" &&
    SQUARE_FEET_RANGES.includes(value as SquareFeetRange)
  );
}

function isServiceType(value: unknown): value is ServiceType {
  return (
    typeof value === "string" &&
    SERVICE_TYPES.includes(value as ServiceType)
  );
}

function isMessLevel(value: unknown): value is MessLevel {
  return typeof value === "string" && MESS_LEVELS.includes(value as MessLevel);
}

function parseExtraTasks(value: unknown): ExtraTask[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const tasks: ExtraTask[] = [];
  for (const entry of value) {
    if (typeof entry !== "string" || !EXTRA_TASKS.includes(entry as ExtraTask)) {
      return null;
    }
    if (!tasks.includes(entry as ExtraTask)) {
      tasks.push(entry as ExtraTask);
    }
  }

  return tasks;
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!isHomeType(body.home_type)) {
    return NextResponse.json({ error: "Invalid home_type" }, { status: 400 });
  }

  const bedrooms = parseNonNegativeNumber(body.bedrooms);
  const bathrooms = parseNonNegativeNumber(body.bathrooms);

  if (bedrooms === null || bathrooms === null) {
    return NextResponse.json(
      { error: "bedrooms and bathrooms must be non-negative numbers" },
      { status: 400 }
    );
  }

  if (!Number.isInteger(bedrooms)) {
    return NextResponse.json(
      { error: "bedrooms must be a whole number" },
      { status: 400 }
    );
  }

  if (!isSquareFeetRange(body.square_feet_range)) {
    return NextResponse.json(
      { error: "Invalid square_feet_range" },
      { status: 400 }
    );
  }

  if (!isServiceType(body.service_type)) {
    return NextResponse.json({ error: "Invalid service_type" }, { status: 400 });
  }

  if (!isMessLevel(body.mess_level)) {
    return NextResponse.json({ error: "Invalid mess_level" }, { status: 400 });
  }

  if (typeof body.has_pets !== "boolean") {
    return NextResponse.json(
      { error: "has_pets must be a boolean" },
      { status: 400 }
    );
  }

  if (typeof body.supplies_needed !== "boolean") {
    return NextResponse.json(
      { error: "supplies_needed must be a boolean" },
      { status: 400 }
    );
  }

  const extra_tasks = parseExtraTasks(body.extra_tasks);
  if (extra_tasks === null) {
    return NextResponse.json(
      { error: "extra_tasks must be an array of valid task ids" },
      { status: 400 }
    );
  }

  const input: IntakeInput = {
    home_type: body.home_type,
    bedrooms,
    bathrooms,
    square_feet_range: body.square_feet_range,
    service_type: body.service_type,
    mess_level: body.mess_level,
    has_pets: body.has_pets,
    supplies_needed: body.supplies_needed,
    extra_tasks,
  };

  return NextResponse.json(estimateIntake(input));
}
