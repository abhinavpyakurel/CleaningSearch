import {
  computeBookingPricing,
  computeBookingPricingCents,
} from "@/lib/booking-price";
import type { Json } from "@/lib/database.types";
import {
  ABSOLUTE_MINIMUM_HOURS,
  AREA_CONDITIONS,
  AREA_SIZES,
  BATHROOM_TYPES,
  estimateIntake,
  EXTRA_TASKS,
  getExtraTaskLabel,
  getServiceTypeLabel,
  homeConditionToMessLevel,
  SERVICE_TYPES,
  type AreaCondition,
  type AreaSize,
  type BathroomType,
  type ExtraTask,
  type IntakeInput,
  type IntakeQuote,
  type LivingAreaSize,
  type ServiceType,
} from "@/lib/intake-estimate";

export type CounterAdjustmentField =
  | "requested_hours"
  | "service_type"
  | "bedroom_size"
  | "bedroom_clutter"
  | "bathroom_type"
  | "bathroom_condition"
  | "kitchen_size"
  | "kitchen_condition"
  | "living_area_size"
  | "living_area_clutter"
  | "hallway_size"
  | "hallway_clutter"
  | "extra_tasks";

export type CounterAdjustment = {
  field: CounterAdjustmentField;
  before: Json;
  after: Json;
  description: string;
};

export type ScopeSnapshotPricing = {
  hourly_rate_snapshot: number | null;
  service_price_cents: number | null;
  platform_fee_cents: number | null;
  total_price_cents: number | null;
  base_price: number | null;
  platform_fee: number | null;
  total_price: number | null;
  client_requested_hours: number | null;
  recommended_hours: number | null;
  minimum_hours: number | null;
  maximum_hours: number | null;
};

export type ScopeSnapshot = {
  input: IntakeInput;
  ui_details: Json | null;
  quote: IntakeQuote;
  pricing: ScopeSnapshotPricing;
  captured_at: string;
};

export type CounterOfferResult = {
  counter_adjustments: CounterAdjustment[];
  counter_scope_snapshot: ScopeSnapshot;
  counter_hours: number;
  counter_total_price_cents: number;
};

export type CounterFieldOption = {
  value: string;
  label: string;
};

export type CounterEditableField = {
  field: CounterAdjustmentField;
  label: string;
  currentValue: string;
  options: CounterFieldOption[];
};

const CLUTTER_UI_VALUES = ["clear", "normal", "cluttered"] as const;
type ClutterUi = (typeof CLUTTER_UI_VALUES)[number];

const AREA_SIZE_LABELS: Record<AreaSize, string> = {
  small: "Small",
  normal: "Normal",
  large: "Large",
};

const LIVING_SIZE_LABELS: Record<LivingAreaSize, string> = {
  small: "Small",
  normal: "Normal",
  large: "Large",
  open_plan: "Open plan",
};

const BATHROOM_TYPE_LABELS: Record<BathroomType, string> = {
  half: "Half bath",
  full: "Full bath",
  master: "Master bath",
};

const CONDITION_LABELS: Record<AreaCondition, string> = {
  light: "Light",
  normal: "Normal",
  heavy: "Heavy",
};

const CLUTTER_UI_LABELS: Record<ClutterUi, string> = {
  clear: "Clear",
  normal: "Normal",
  cluttered: "Cluttered",
};

const SERVICE_TYPE_OPTIONS: CounterFieldOption[] = SERVICE_TYPES.map(
  (value) => ({
    value,
    label: getServiceTypeLabel(value),
  })
);

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === "object" && !Array.isArray(value);
}

function clutterUiToCondition(value: ClutterUi): AreaCondition {
  switch (value) {
    case "clear":
      return "light";
    case "cluttered":
      return "heavy";
    default:
      return "normal";
  }
}

function conditionToClutterUi(value: AreaCondition | undefined): ClutterUi {
  switch (value) {
    case "light":
      return "clear";
    case "heavy":
      return "cluttered";
    default:
      return "normal";
  }
}

function isClutterUi(value: string): value is ClutterUi {
  return (CLUTTER_UI_VALUES as readonly string[]).includes(value);
}

function isAreaSize(value: string): value is AreaSize {
  return (AREA_SIZES as readonly string[]).includes(value);
}

function isLivingAreaSize(value: string): value is LivingAreaSize {
  return (
    value === "small" ||
    value === "normal" ||
    value === "large" ||
    value === "open_plan"
  );
}

function isAreaCondition(value: string): value is AreaCondition {
  return (AREA_CONDITIONS as readonly string[]).includes(value);
}

function isBathroomType(value: string): value is BathroomType {
  return (BATHROOM_TYPES as readonly string[]).includes(value);
}

function isServiceType(value: string): value is ServiceType {
  return (SERVICE_TYPES as readonly string[]).includes(value);
}

function isExtraTask(value: string): value is ExtraTask {
  return (EXTRA_TASKS as readonly string[]).includes(value);
}

function parseIntakeInput(value: unknown): IntakeInput | null {
  if (!isRecord(value)) {
    return null;
  }

  const bedrooms = Number(value.bedrooms);
  const bathrooms = Number(value.bathrooms);
  if (!Number.isFinite(bedrooms) || !Number.isFinite(bathrooms)) {
    return null;
  }

  const service_type = String(value.service_type ?? "");
  const visit_type = String(value.visit_type ?? "");
  const home_type = String(value.home_type ?? "");
  const square_feet_range = String(value.square_feet_range ?? "");
  const home_condition = String(value.home_condition ?? "");
  const kitchen_condition = String(value.kitchen_condition ?? "");
  const bathroom_condition = String(value.bathroom_condition ?? "");
  const pet_hair_level = String(value.pet_hair_level ?? "");
  const floor_type = String(value.floor_type ?? "");

  if (
    !isServiceType(service_type) ||
    visit_type !== "first_clean" && visit_type !== "recurring_clean" ||
    !["apartment", "house", "condo", "townhouse"].includes(home_type) ||
    !["under_800", "800_1500", "1500_2500", "2500_plus"].includes(
      square_feet_range
    ) ||
    !["maintained", "some_buildup", "heavy_buildup"].includes(home_condition) ||
    !isAreaCondition(kitchen_condition) ||
    !isAreaCondition(bathroom_condition) ||
    !["none", "light", "heavy"].includes(pet_hair_level) ||
    !["hardwood", "tile", "carpet", "mixed", "other"].includes(floor_type)
  ) {
    return null;
  }

  const extra_tasks: ExtraTask[] = [];
  if (Array.isArray(value.extra_tasks)) {
    for (const task of value.extra_tasks) {
      const taskValue = String(task);
      if (isExtraTask(taskValue) && !extra_tasks.includes(taskValue)) {
        extra_tasks.push(taskValue);
      }
    }
  }

  const input: IntakeInput = {
    visit_type: visit_type as IntakeInput["visit_type"],
    service_type,
    home_type: home_type as IntakeInput["home_type"],
    bedrooms,
    bathrooms,
    square_feet_range: square_feet_range as IntakeInput["square_feet_range"],
    clean_bedrooms: Boolean(value.clean_bedrooms),
    clean_bathrooms: Boolean(value.clean_bathrooms),
    clean_kitchen: Boolean(value.clean_kitchen),
    clean_common_area: Boolean(value.clean_common_area),
    clean_hallways: Boolean(value.clean_hallways),
    clean_floors: Boolean(value.clean_floors),
    home_condition: home_condition as IntakeInput["home_condition"],
    kitchen_condition,
    bathroom_condition,
    pet_hair_level: pet_hair_level as IntakeInput["pet_hair_level"],
    floor_type: floor_type as IntakeInput["floor_type"],
    extra_tasks,
  };

  if (value.bedroom_size != null) {
    const bedroomSize = String(value.bedroom_size);
    if (isAreaSize(bedroomSize)) {
      input.bedroom_size = bedroomSize;
    }
  }

  if (value.bedroom_condition != null) {
    const bedroomCondition = String(value.bedroom_condition);
    if (isAreaCondition(bedroomCondition)) {
      input.bedroom_condition = bedroomCondition;
    }
  }

  if (value.bathroom_type != null) {
    const bathroomType = String(value.bathroom_type);
    if (isBathroomType(bathroomType)) {
      input.bathroom_type = bathroomType;
    }
  }

  if (value.kitchen_size != null) {
    const kitchenSize = String(value.kitchen_size);
    if (isAreaSize(kitchenSize)) {
      input.kitchen_size = kitchenSize;
    }
  }

  if (value.living_area_size != null) {
    const livingAreaSize = String(value.living_area_size);
    if (isLivingAreaSize(livingAreaSize)) {
      input.living_area_size = livingAreaSize;
    }
  }

  if (value.hallway_size != null) {
    const hallwaySize = String(value.hallway_size);
    if (isAreaSize(hallwaySize)) {
      input.hallway_size = hallwaySize;
    }
  }

  if (value.hallway_condition != null) {
    const hallwayCondition = String(value.hallway_condition);
    if (isAreaCondition(hallwayCondition)) {
      input.hallway_condition = hallwayCondition;
    }
  }

  if (value.common_area_condition != null) {
    const commonAreaCondition = String(value.common_area_condition);
    if (isAreaCondition(commonAreaCondition)) {
      input.common_area_condition = commonAreaCondition;
    }
  }

  if (value.last_cleaned != null) {
    const lastCleaned = String(value.last_cleaned);
    if (
      [
        "never",
        "within_1_week",
        "within_1_month",
        "within_3_months",
        "over_3_months",
      ].includes(lastCleaned)
    ) {
      input.last_cleaned = lastCleaned as IntakeInput["last_cleaned"];
    }
  }

  return input;
}

export function parseScopeSnapshot(
  scopeSnapshot: Json | null
): ScopeSnapshot | null {
  if (!isRecord(scopeSnapshot)) {
    return null;
  }

  const input = parseIntakeInput(scopeSnapshot.input);
  const quoteRaw = scopeSnapshot.quote;
  if (!input || !isRecord(quoteRaw)) {
    return null;
  }

  const recommended_hours = Number(quoteRaw.recommended_hours);
  const minimum_hours = Number(quoteRaw.minimum_hours);
  const maximum_hours = Number(quoteRaw.maximum_hours);
  if (
    !Number.isFinite(recommended_hours) ||
    !Number.isFinite(minimum_hours) ||
    !Number.isFinite(maximum_hours)
  ) {
    return null;
  }

  const pricingRaw = isRecord(scopeSnapshot.pricing)
    ? scopeSnapshot.pricing
    : {};

  const pricing: ScopeSnapshotPricing = {
    hourly_rate_snapshot:
      pricingRaw.hourly_rate_snapshot != null
        ? Number(pricingRaw.hourly_rate_snapshot)
        : null,
    service_price_cents:
      pricingRaw.service_price_cents != null
        ? Number(pricingRaw.service_price_cents)
        : null,
    platform_fee_cents:
      pricingRaw.platform_fee_cents != null
        ? Number(pricingRaw.platform_fee_cents)
        : null,
    total_price_cents:
      pricingRaw.total_price_cents != null
        ? Number(pricingRaw.total_price_cents)
        : null,
    base_price:
      pricingRaw.base_price != null ? Number(pricingRaw.base_price) : null,
    platform_fee:
      pricingRaw.platform_fee != null ? Number(pricingRaw.platform_fee) : null,
    total_price:
      pricingRaw.total_price != null ? Number(pricingRaw.total_price) : null,
    client_requested_hours:
      pricingRaw.client_requested_hours != null
        ? Number(pricingRaw.client_requested_hours)
        : null,
    recommended_hours,
    minimum_hours,
    maximum_hours,
  };

  return {
    input,
    ui_details: (scopeSnapshot.ui_details as Json | null) ?? null,
    quote: {
      recommended_hours,
      minimum_hours,
      maximum_hours,
      breakdown: Array.isArray(quoteRaw.breakdown)
        ? quoteRaw.breakdown.flatMap((item) => {
            if (!isRecord(item)) {
              return [];
            }
            const minutes = Number(item.minutes);
            const label = String(item.label ?? "");
            if (!label || !Number.isFinite(minutes)) {
              return [];
            }
            return [{ label, minutes }];
          })
        : [],
      total_minutes_before_multipliers: Number(
        quoteRaw.total_minutes_before_multipliers ?? 0
      ),
      service_type_multiplier: Number(quoteRaw.service_type_multiplier ?? 1),
      visit_type_multiplier: Number(quoteRaw.visit_type_multiplier ?? 1),
      buffer_minutes: Number(quoteRaw.buffer_minutes ?? 0),
    },
    pricing,
    captured_at: String(scopeSnapshot.captured_at ?? new Date().toISOString()),
  };
}

export function parseCounterAdjustments(
  value: Json | null
): CounterAdjustment[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const adjustments: CounterAdjustment[] = [];
  for (const item of value) {
    if (!isRecord(item)) {
      continue;
    }
    const field = String(item.field ?? "");
    const description = String(item.description ?? "").trim();
    if (
      !description ||
      ![
        "requested_hours",
        "service_type",
        "bedroom_size",
        "bedroom_clutter",
        "bathroom_type",
        "bathroom_condition",
        "kitchen_size",
        "kitchen_condition",
        "living_area_size",
        "living_area_clutter",
        "hallway_size",
        "hallway_clutter",
        "extra_tasks",
      ].includes(field)
    ) {
      continue;
    }

    adjustments.push({
      field: field as CounterAdjustmentField,
      before: (item.before as Json) ?? null,
      after: (item.after as Json) ?? null,
      description,
    });
  }

  return adjustments;
}

function formatHours(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function describeValue(
  field: CounterAdjustmentField,
  value: unknown
): string {
  const stringValue = String(value ?? "");

  switch (field) {
    case "requested_hours":
      return `${formatHours(Number(value))} hours`;
    case "service_type":
      return isServiceType(stringValue)
        ? getServiceTypeLabel(stringValue).toLowerCase()
        : stringValue;
    case "bedroom_size":
    case "kitchen_size":
    case "hallway_size":
      return isAreaSize(stringValue)
        ? AREA_SIZE_LABELS[stringValue].toLowerCase()
        : stringValue;
    case "living_area_size":
      return isLivingAreaSize(stringValue)
        ? LIVING_SIZE_LABELS[stringValue].toLowerCase()
        : stringValue;
    case "bathroom_type":
      return isBathroomType(stringValue)
        ? BATHROOM_TYPE_LABELS[stringValue].toLowerCase()
        : stringValue;
    case "bathroom_condition":
    case "kitchen_condition":
      return isAreaCondition(stringValue)
        ? CONDITION_LABELS[stringValue].toLowerCase()
        : stringValue;
    case "bedroom_clutter":
    case "living_area_clutter":
    case "hallway_clutter":
      return isClutterUi(stringValue)
        ? CLUTTER_UI_LABELS[stringValue].toLowerCase()
        : stringValue;
    case "extra_tasks":
      if (!Array.isArray(value)) {
        return "none";
      }
      return value
        .map((task) => {
          const taskValue = String(task);
          return isExtraTask(taskValue)
            ? getExtraTaskLabel(taskValue)
            : taskValue;
        })
        .join(", ") || "none";
    default:
      return stringValue;
  }
}

export function describeCounterAdjustment(
  field: CounterAdjustmentField,
  before: unknown,
  after: unknown
): string {
  switch (field) {
    case "requested_hours":
      return `Cleaner suggested more time for the selected scope (${describeValue(field, before)} → ${describeValue(field, after)}).`;
    case "service_type":
      return `Cleaner says this request fits a ${describeValue(field, after)} instead of a ${describeValue(field, before)}.`;
    case "bedroom_size":
      return `Cleaner marked the bedroom size as ${describeValue(field, after)}.`;
    case "bedroom_clutter":
      return `Cleaner marked the bedroom clutter as ${describeValue(field, after)}.`;
    case "bathroom_type":
      return `Cleaner marked the bathroom type as ${describeValue(field, after)}.`;
    case "bathroom_condition":
      return `Cleaner marked the bathroom condition as ${describeValue(field, after)}.`;
    case "kitchen_size":
      return `Cleaner marked the kitchen size as ${describeValue(field, after)}.`;
    case "kitchen_condition":
      return `Cleaner marked the kitchen condition as ${describeValue(field, after)}.`;
    case "living_area_size":
      return `Cleaner marked the living area size as ${describeValue(field, after)}.`;
    case "living_area_clutter":
      return `Cleaner marked the living area clutter as ${describeValue(field, after)}.`;
    case "hallway_size":
      return `Cleaner marked the hallway size as ${describeValue(field, after)}.`;
    case "hallway_clutter":
      return `Cleaner marked the hallway clutter as ${describeValue(field, after)}.`;
    case "extra_tasks": {
      const beforeTasks = Array.isArray(before)
        ? before.map(String)
        : [];
      const afterTasks = Array.isArray(after) ? after.map(String) : [];
      const added = afterTasks.filter((task) => !beforeTasks.includes(task));
      const removed = beforeTasks.filter((task) => !afterTasks.includes(task));

      if (added.length === 1 && removed.length === 0) {
        const task = added[0];
        return `Cleaner added ${isExtraTask(task) ? getExtraTaskLabel(task).toLowerCase() : task} to the scope.`;
      }
      if (removed.length === 1 && added.length === 0) {
        const task = removed[0];
        return `Cleaner removed ${isExtraTask(task) ? getExtraTaskLabel(task).toLowerCase() : task} from the scope.`;
      }
      return "Cleaner updated the extra tasks in the scope.";
    }
    default:
      return "Cleaner updated the booking scope.";
  }
}

function getInputValueForField(
  input: IntakeInput,
  field: CounterAdjustmentField,
  clientRequestedHours: number
): Json {
  switch (field) {
    case "requested_hours":
      return clientRequestedHours;
    case "service_type":
      return input.service_type;
    case "bedroom_size":
      return input.bedroom_size ?? "normal";
    case "bedroom_clutter":
      return conditionToClutterUi(
        input.bedroom_condition ??
          (input.home_condition === "maintained"
            ? "light"
            : input.home_condition === "heavy_buildup"
              ? "heavy"
              : "normal")
      );
    case "bathroom_type":
      return input.bathroom_type ?? "full";
    case "bathroom_condition":
      return input.bathroom_condition;
    case "kitchen_size":
      return input.kitchen_size ?? "normal";
    case "kitchen_condition":
      return input.kitchen_condition;
    case "living_area_size":
      return input.living_area_size ?? "normal";
    case "living_area_clutter":
      return conditionToClutterUi(
        input.common_area_condition ??
          (input.home_condition === "maintained"
            ? "light"
            : input.home_condition === "heavy_buildup"
              ? "heavy"
              : "normal")
      );
    case "hallway_size":
      return input.hallway_size ?? "normal";
    case "hallway_clutter":
      return conditionToClutterUi(input.hallway_condition ?? "normal");
    case "extra_tasks":
      return input.extra_tasks;
    default:
      return null;
  }
}

function applyFieldToInput(
  input: IntakeInput,
  field: CounterAdjustmentField,
  value: string
): IntakeInput {
  const next = { ...input, extra_tasks: [...input.extra_tasks] };

  switch (field) {
    case "service_type":
      if (isServiceType(value)) {
        next.service_type = value;
      }
      break;
    case "bedroom_size":
      if (isAreaSize(value)) {
        next.bedroom_size = value;
      }
      break;
    case "bedroom_clutter":
      if (isClutterUi(value)) {
        next.bedroom_condition = clutterUiToCondition(value);
      }
      break;
    case "bathroom_type":
      if (isBathroomType(value)) {
        next.bathroom_type = value;
      }
      break;
    case "bathroom_condition":
      if (isAreaCondition(value)) {
        next.bathroom_condition = value;
      }
      break;
    case "kitchen_size":
      if (isAreaSize(value)) {
        next.kitchen_size = value;
      }
      break;
    case "kitchen_condition":
      if (isAreaCondition(value)) {
        next.kitchen_condition = value;
      }
      break;
    case "living_area_size":
      if (isLivingAreaSize(value)) {
        next.living_area_size = value;
      }
      break;
    case "living_area_clutter":
      if (isClutterUi(value)) {
        next.common_area_condition = clutterUiToCondition(value);
      }
      break;
    case "hallway_size":
      if (isAreaSize(value)) {
        next.hallway_size = value;
      }
      break;
    case "hallway_clutter":
      if (isClutterUi(value)) {
        next.hallway_condition = clutterUiToCondition(value);
      }
      break;
    default:
      break;
  }

  return next;
}

function isFieldAllowed(input: IntakeInput, field: CounterAdjustmentField): boolean {
  switch (field) {
    case "requested_hours":
    case "service_type":
    case "extra_tasks":
      return true;
    case "bedroom_size":
    case "bedroom_clutter":
      return input.clean_bedrooms && input.bedrooms > 0;
    case "bathroom_type":
    case "bathroom_condition":
      return input.clean_bathrooms && input.bathrooms > 0;
    case "kitchen_size":
    case "kitchen_condition":
      return input.clean_kitchen;
    case "living_area_size":
    case "living_area_clutter":
      return input.clean_common_area;
    case "hallway_size":
    case "hallway_clutter":
      return input.clean_hallways;
    default:
      return false;
  }
}

export function getCounterEditableFields(
  scope: ScopeSnapshot,
  clientRequestedHours: number
): CounterEditableField[] {
  const { input } = scope;
  const fields: CounterEditableField[] = [
    {
      field: "requested_hours",
      label: "Requested hours",
      currentValue: String(clientRequestedHours),
      options: [],
    },
    {
      field: "service_type",
      label: "Service type",
      currentValue: input.service_type,
      options: SERVICE_TYPE_OPTIONS,
    },
  ];

  if (input.clean_bedrooms && input.bedrooms > 0) {
    fields.push(
      {
        field: "bedroom_size",
        label: "Bedroom size",
        currentValue: input.bedroom_size ?? "normal",
        options: AREA_SIZES.map((value) => ({
          value,
          label: AREA_SIZE_LABELS[value],
        })),
      },
      {
        field: "bedroom_clutter",
        label: "Bedroom clutter",
        currentValue: getInputValueForField(
          input,
          "bedroom_clutter",
          clientRequestedHours
        ) as string,
        options: CLUTTER_UI_VALUES.map((value) => ({
          value,
          label: CLUTTER_UI_LABELS[value],
        })),
      }
    );
  }

  if (input.clean_bathrooms && input.bathrooms > 0) {
    fields.push(
      {
        field: "bathroom_type",
        label: "Bathroom type",
        currentValue: input.bathroom_type ?? "full",
        options: BATHROOM_TYPES.map((value) => ({
          value,
          label: BATHROOM_TYPE_LABELS[value],
        })),
      },
      {
        field: "bathroom_condition",
        label: "Bathroom condition",
        currentValue: input.bathroom_condition,
        options: AREA_CONDITIONS.map((value) => ({
          value,
          label: CONDITION_LABELS[value],
        })),
      }
    );
  }

  if (input.clean_kitchen) {
    fields.push(
      {
        field: "kitchen_size",
        label: "Kitchen size",
        currentValue: input.kitchen_size ?? "normal",
        options: AREA_SIZES.map((value) => ({
          value,
          label: AREA_SIZE_LABELS[value],
        })),
      },
      {
        field: "kitchen_condition",
        label: "Kitchen condition",
        currentValue: input.kitchen_condition,
        options: AREA_CONDITIONS.map((value) => ({
          value,
          label: CONDITION_LABELS[value],
        })),
      }
    );
  }

  if (input.clean_common_area) {
    fields.push(
      {
        field: "living_area_size",
        label: "Living area size",
        currentValue: input.living_area_size ?? "normal",
        options: (["small", "normal", "large", "open_plan"] as LivingAreaSize[]).map(
          (value) => ({
            value,
            label: LIVING_SIZE_LABELS[value],
          })
        ),
      },
      {
        field: "living_area_clutter",
        label: "Living area clutter",
        currentValue: getInputValueForField(
          input,
          "living_area_clutter",
          clientRequestedHours
        ) as string,
        options: CLUTTER_UI_VALUES.map((value) => ({
          value,
          label: CLUTTER_UI_LABELS[value],
        })),
      }
    );
  }

  if (input.clean_hallways) {
    fields.push(
      {
        field: "hallway_size",
        label: "Hallway size",
        currentValue: input.hallway_size ?? "normal",
        options: AREA_SIZES.map((value) => ({
          value,
          label: AREA_SIZE_LABELS[value],
        })),
      },
      {
        field: "hallway_clutter",
        label: "Hallway clutter",
        currentValue: getInputValueForField(
          input,
          "hallway_clutter",
          clientRequestedHours
        ) as string,
        options: CLUTTER_UI_VALUES.map((value) => ({
          value,
          label: CLUTTER_UI_LABELS[value],
        })),
      }
    );
  }

  return fields;
}

export function getSelectedAreaLabels(input: IntakeInput): string[] {
  const labels: string[] = [];
  if (input.clean_bedrooms && input.bedrooms > 0) {
    labels.push(`Bedrooms (${input.bedrooms})`);
  }
  if (input.clean_bathrooms && input.bathrooms > 0) {
    labels.push(`Bathrooms (${input.bathrooms})`);
  }
  if (input.clean_kitchen) {
    labels.push("Kitchen");
  }
  if (input.clean_common_area) {
    labels.push("Living / common area");
  }
  if (input.clean_hallways) {
    labels.push("Hallways");
  }
  if (input.clean_floors) {
    labels.push("Floors");
  }
  if (input.extra_tasks.length > 0) {
    labels.push(
      `Extra tasks: ${input.extra_tasks.map((task) => getExtraTaskLabel(task)).join(", ")}`
    );
  }
  return labels;
}

export type CounterOfferSubmission = {
  requested_hours?: number;
  service_type?: string;
  bedroom_size?: string;
  bedroom_clutter?: string;
  bathroom_type?: string;
  bathroom_condition?: string;
  kitchen_size?: string;
  kitchen_condition?: string;
  living_area_size?: string;
  living_area_clutter?: string;
  hallway_size?: string;
  hallway_clutter?: string;
  extra_tasks?: ExtraTask[];
};

export function buildCounterOffer(
  scope: ScopeSnapshot,
  clientRequestedHours: number,
  hourlyRateSnapshot: number,
  submission: CounterOfferSubmission
): { data: CounterOfferResult } | { error: string } {
  if (!Number.isFinite(hourlyRateSnapshot) || hourlyRateSnapshot <= 0) {
    return { error: "Hourly rate is missing for this booking." };
  }

  const originalInput = scope.input;
  let nextInput: IntakeInput = {
    ...originalInput,
    extra_tasks: [...originalInput.extra_tasks],
  };
  const adjustments: CounterAdjustment[] = [];
  let nextRequestedHours = clientRequestedHours;

  const entries: Array<[CounterAdjustmentField, string | undefined]> = [
    ["service_type", submission.service_type],
    ["bedroom_size", submission.bedroom_size],
    ["bedroom_clutter", submission.bedroom_clutter],
    ["bathroom_type", submission.bathroom_type],
    ["bathroom_condition", submission.bathroom_condition],
    ["kitchen_size", submission.kitchen_size],
    ["kitchen_condition", submission.kitchen_condition],
    ["living_area_size", submission.living_area_size],
    ["living_area_clutter", submission.living_area_clutter],
    ["hallway_size", submission.hallway_size],
    ["hallway_clutter", submission.hallway_clutter],
  ];

  for (const [field, rawValue] of entries) {
    if (rawValue == null || rawValue === "") {
      continue;
    }
    if (!isFieldAllowed(originalInput, field)) {
      return { error: "One or more adjustments are not allowed for this scope." };
    }

    const before = getInputValueForField(
      originalInput,
      field,
      clientRequestedHours
    );
    if (String(before) === rawValue) {
      continue;
    }

    nextInput = applyFieldToInput(nextInput, field, rawValue);
    adjustments.push({
      field,
      before,
      after: rawValue,
      description: describeCounterAdjustment(field, before, rawValue),
    });
  }

  if (submission.extra_tasks != null) {
    if (!isFieldAllowed(originalInput, "extra_tasks")) {
      return { error: "Extra task adjustments are not allowed for this scope." };
    }

    const beforeTasks = [...originalInput.extra_tasks].sort();
    const afterTasks = [...submission.extra_tasks].sort();
    const sameLength = beforeTasks.length === afterTasks.length;
    const sameValues =
      sameLength && beforeTasks.every((task, index) => task === afterTasks[index]);

    if (!sameValues) {
      for (const task of afterTasks) {
        if (!isExtraTask(task)) {
          return { error: "One or more extra tasks are invalid." };
        }
      }

      adjustments.push({
        field: "extra_tasks",
        before: beforeTasks,
        after: afterTasks,
        description: describeCounterAdjustment(
          "extra_tasks",
          beforeTasks,
          afterTasks
        ),
      });
      nextInput.extra_tasks = [...submission.extra_tasks];
    }
  }

  if (submission.requested_hours != null) {
    const beforeHours = clientRequestedHours;
    const afterHours = submission.requested_hours;
    if (!Number.isFinite(afterHours) || afterHours < ABSOLUTE_MINIMUM_HOURS) {
      return { error: "Requested hours must be at least 1.5." };
    }
    if (afterHours !== beforeHours) {
      adjustments.push({
        field: "requested_hours",
        before: beforeHours,
        after: afterHours,
        description: describeCounterAdjustment(
          "requested_hours",
          beforeHours,
          afterHours
        ),
      });
      nextRequestedHours = afterHours;
    }
  }

  if (adjustments.length === 0) {
    return { error: "Change at least one measurable adjustment before submitting." };
  }

  const quote = estimateIntake(nextInput);
  if (
    nextRequestedHours < quote.minimum_hours ||
    nextRequestedHours > quote.maximum_hours
  ) {
    return {
      error: `Requested hours must be between ${quote.minimum_hours} and ${quote.maximum_hours} for the adjusted scope.`,
    };
  }

  const pricing = computeBookingPricing(hourlyRateSnapshot, nextRequestedHours);
  const pricingCents = computeBookingPricingCents(
    hourlyRateSnapshot,
    nextRequestedHours
  );

  const counter_scope_snapshot: ScopeSnapshot = {
    input: nextInput,
    ui_details: scope.ui_details,
    quote,
    pricing: {
      hourly_rate_snapshot: hourlyRateSnapshot,
      service_price_cents: pricingCents.service_price_cents,
      platform_fee_cents: pricingCents.platform_fee_cents,
      total_price_cents: pricingCents.total_price_cents,
      base_price: pricing.base_price,
      platform_fee: pricing.platform_fee,
      total_price: pricing.total_price,
      client_requested_hours: nextRequestedHours,
      recommended_hours: quote.recommended_hours,
      minimum_hours: quote.minimum_hours,
      maximum_hours: quote.maximum_hours,
    },
    captured_at: new Date().toISOString(),
  };

  return {
    data: {
      counter_adjustments: adjustments,
      counter_scope_snapshot,
      counter_hours: nextRequestedHours,
      counter_total_price_cents: pricingCents.total_price_cents,
    },
  };
}

export function scopeSnapshotToJson(snapshot: ScopeSnapshot): Json {
  return snapshot as unknown as Json;
}

export function counterAdjustmentsToJson(
  adjustments: CounterAdjustment[]
): Json {
  return adjustments as unknown as Json;
}

export function getBookingUpdateFromCounterScope(
  counterScope: ScopeSnapshot
): Record<string, unknown> {
  const { input, quote, pricing } = counterScope;

  return {
    scope_snapshot: scopeSnapshotToJson(counterScope),
    visit_type: input.visit_type,
    home_type: input.home_type,
    bedrooms: input.bedrooms,
    bathrooms: input.bathrooms,
    square_feet_range: input.square_feet_range,
    service_type: input.service_type,
    clean_bedrooms: input.clean_bedrooms,
    clean_bathrooms: input.clean_bathrooms,
    clean_kitchen: input.clean_kitchen,
    clean_common_area: input.clean_common_area,
    clean_hallways: input.clean_hallways,
    clean_floors: input.clean_floors,
    home_condition: input.home_condition,
    kitchen_condition: input.kitchen_condition,
    bathroom_condition: input.bathroom_condition,
    pet_hair_level: input.pet_hair_level,
    last_cleaned: input.last_cleaned ?? null,
    floor_type: input.floor_type,
    mess_level: homeConditionToMessLevel(input.home_condition),
    has_pets: input.pet_hair_level !== "none",
    extra_tasks: input.extra_tasks,
    recommended_hours: quote.recommended_hours,
    minimum_hours: quote.minimum_hours,
    maximum_hours: quote.maximum_hours,
    client_requested_hours: pricing.client_requested_hours,
    duration_hours: pricing.client_requested_hours,
    hourly_rate_snapshot: pricing.hourly_rate_snapshot,
    service_price_cents: pricing.service_price_cents,
    cleaner_payout_cents: pricing.service_price_cents,
    platform_fee_cents: pricing.platform_fee_cents,
    total_price_cents: pricing.total_price_cents,
    base_price: pricing.base_price,
    platform_fee: pricing.platform_fee,
    total_price: pricing.total_price,
    status: "accepted_pending_payment",
    payment_status: "unpaid",
  };
}
