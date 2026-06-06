import { NextResponse } from "next/server";

import {
  AREA_CONDITIONS,
  CLUTTER_LEVELS,
  estimateIntake,
  EXTRA_TASKS,
  FLOOR_TYPES,
  HOME_CONDITIONS,
  HOME_TYPES,
  LAST_CLEANED_OPTIONS,
  PET_HAIR_LEVELS,
  SERVICE_TYPES,
  SQUARE_FEET_RANGES,
  VISIT_TYPES,
  type AreaCondition,
  type ClutterLevel,
  type ExtraTask,
  type FloorType,
  type HomeCondition,
  type HomeType,
  type IntakeInput,
  type LastCleaned,
  type PetHairLevel,
  type ServiceType,
  type SquareFeetRange,
  type VisitType,
} from "@/lib/intake-estimate";

function parseNonNegativeNumber(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return null;
  }
  return value;
}

function parseBoolean(value: unknown): boolean | null {
  if (typeof value !== "boolean") {
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

function isVisitType(value: unknown): value is VisitType {
  return typeof value === "string" && VISIT_TYPES.includes(value as VisitType);
}

function isHomeCondition(value: unknown): value is HomeCondition {
  return (
    typeof value === "string" &&
    HOME_CONDITIONS.includes(value as HomeCondition)
  );
}

function isClutterLevel(value: unknown): value is ClutterLevel {
  return (
    typeof value === "string" && CLUTTER_LEVELS.includes(value as ClutterLevel)
  );
}

function isAreaCondition(value: unknown): value is AreaCondition {
  return (
    typeof value === "string" &&
    AREA_CONDITIONS.includes(value as AreaCondition)
  );
}

function isPetHairLevel(value: unknown): value is PetHairLevel {
  return (
    typeof value === "string" &&
    PET_HAIR_LEVELS.includes(value as PetHairLevel)
  );
}

function isFloorType(value: unknown): value is FloorType {
  return typeof value === "string" && FLOOR_TYPES.includes(value as FloorType);
}

function isLastCleaned(value: unknown): value is LastCleaned {
  return (
    typeof value === "string" &&
    LAST_CLEANED_OPTIONS.includes(value as LastCleaned)
  );
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

  if (!isVisitType(body.visit_type)) {
    return NextResponse.json({ error: "Invalid visit_type" }, { status: 400 });
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

  const clean_bedrooms = parseBoolean(body.clean_bedrooms);
  const clean_bathrooms = parseBoolean(body.clean_bathrooms);
  const clean_kitchen = parseBoolean(body.clean_kitchen);
  const clean_common_area = parseBoolean(body.clean_common_area);
  const clean_hallways = parseBoolean(body.clean_hallways);

  if (
    clean_bedrooms === null ||
    clean_bathrooms === null ||
    clean_kitchen === null ||
    clean_common_area === null ||
    clean_hallways === null
  ) {
    return NextResponse.json(
      { error: "Area selection fields must be booleans" },
      { status: 400 }
    );
  }

  if (
    !clean_bedrooms &&
    !clean_bathrooms &&
    !clean_kitchen &&
    !clean_common_area &&
    !clean_hallways
  ) {
    return NextResponse.json(
      { error: "At least one area must be selected" },
      { status: 400 }
    );
  }

  if (!isHomeCondition(body.home_condition)) {
    return NextResponse.json(
      { error: "Invalid home_condition" },
      { status: 400 }
    );
  }

  if (!isClutterLevel(body.clutter_level)) {
    return NextResponse.json({ error: "Invalid clutter_level" }, { status: 400 });
  }

  if (!isAreaCondition(body.kitchen_condition)) {
    return NextResponse.json(
      { error: "Invalid kitchen_condition" },
      { status: 400 }
    );
  }

  if (!isAreaCondition(body.bathroom_condition)) {
    return NextResponse.json(
      { error: "Invalid bathroom_condition" },
      { status: 400 }
    );
  }

  if (!isPetHairLevel(body.pet_hair_level)) {
    return NextResponse.json(
      { error: "Invalid pet_hair_level" },
      { status: 400 }
    );
  }

  if (!isFloorType(body.floor_type)) {
    return NextResponse.json({ error: "Invalid floor_type" }, { status: 400 });
  }

  let last_cleaned: LastCleaned | null = null;
  if (body.last_cleaned != null && body.last_cleaned !== "") {
    if (!isLastCleaned(body.last_cleaned)) {
      return NextResponse.json(
        { error: "Invalid last_cleaned" },
        { status: 400 }
      );
    }
    last_cleaned = body.last_cleaned;
  }

  const extra_tasks = parseExtraTasks(body.extra_tasks);
  if (extra_tasks === null) {
    return NextResponse.json(
      { error: "extra_tasks must be an array of valid task ids" },
      { status: 400 }
    );
  }

  const input: IntakeInput = {
    visit_type: body.visit_type,
    service_type: body.service_type,
    home_type: body.home_type,
    bedrooms,
    bathrooms,
    square_feet_range: body.square_feet_range,
    clean_bedrooms,
    clean_bathrooms,
    clean_kitchen,
    clean_common_area,
    clean_hallways,
    home_condition: body.home_condition,
    clutter_level: body.clutter_level,
    kitchen_condition: body.kitchen_condition,
    bathroom_condition: body.bathroom_condition,
    pet_hair_level: body.pet_hair_level,
    last_cleaned,
    floor_type: body.floor_type,
    extra_tasks,
  };

  return NextResponse.json(estimateIntake(input));
}
