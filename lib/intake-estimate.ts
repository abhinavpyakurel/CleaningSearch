export type HomeType = "apartment" | "house" | "condo" | "townhouse";

export type SquareFeetRange =
  | "under_800"
  | "800_1500"
  | "1500_2500"
  | "2500_plus";

export type ServiceType = "standard" | "deep" | "move_in_move_out";

export type VisitType = "first_clean" | "recurring_clean";

export type HomeCondition = "maintained" | "some_buildup" | "heavy_buildup";

export type ClutterLevel = "low" | "medium" | "high";

export type AreaCondition = "light" | "normal" | "heavy";

export type PetHairLevel = "none" | "light" | "heavy";

export type FloorType = "hardwood" | "tile" | "carpet" | "mixed" | "other";

export type LastCleaned =
  | "never"
  | "within_1_week"
  | "within_1_month"
  | "within_3_months"
  | "over_3_months";

export type ExtraTask =
  | "inside_fridge"
  | "inside_oven"
  | "interior_windows"
  | "baseboards"
  | "laundry"
  | "dishes"
  | "inside_cabinets";

export type IntakeInput = {
  visit_type: VisitType;
  service_type: ServiceType;
  home_type: HomeType;
  bedrooms: number;
  bathrooms: number;
  square_feet_range: SquareFeetRange;
  clean_bedrooms: boolean;
  clean_bathrooms: boolean;
  clean_kitchen: boolean;
  clean_common_area: boolean;
  clean_hallways: boolean;
  home_condition: HomeCondition;
  clutter_level: ClutterLevel;
  kitchen_condition: AreaCondition;
  bathroom_condition: AreaCondition;
  pet_hair_level: PetHairLevel;
  last_cleaned?: LastCleaned | null;
  floor_type: FloorType;
  extra_tasks: ExtraTask[];
};

export type IntakeBreakdownItem = {
  label: string;
  minutes: number;
};

export type IntakeQuote = {
  recommended_hours: number;
  minimum_hours: number;
  maximum_hours: number;
  breakdown: IntakeBreakdownItem[];
  total_minutes_before_multipliers: number;
  service_type_multiplier: number;
  visit_type_multiplier: number;
  buffer_minutes: number;
};

const BASE_VISIT_MINUTES = 30;
const BEDROOM_MINUTES = 25;
const BATHROOM_MINUTES = 35;
const KITCHEN_MINUTES = 45;
const COMMON_AREA_MINUTES = 40;
const BUFFER_PERCENT = 0.1;
const MIN_BUFFER_MINUTES = 15;

const HALLWAY_MINUTES: Record<SquareFeetRange, number> = {
  under_800: 15,
  "800_1500": 20,
  "1500_2500": 30,
  "2500_plus": 40,
};

const SQUARE_FEET_MODIFIERS: Record<SquareFeetRange, number> = {
  under_800: -10,
  "800_1500": 0,
  "1500_2500": 25,
  "2500_plus": 50,
};

const SERVICE_TYPE_MULTIPLIERS: Record<ServiceType, number> = {
  standard: 1.0,
  deep: 1.4,
  move_in_move_out: 1.6,
};

const VISIT_TYPE_MULTIPLIERS: Record<VisitType, number> = {
  first_clean: 1.12,
  recurring_clean: 0.95,
};

const HOME_CONDITION_MULTIPLIERS: Record<HomeCondition, number> = {
  maintained: 0.9,
  some_buildup: 1.0,
  heavy_buildup: 1.25,
};

const CLUTTER_MULTIPLIERS: Record<ClutterLevel, number> = {
  low: 0.95,
  medium: 1.0,
  high: 1.2,
};

const AREA_CONDITION_MULTIPLIERS: Record<AreaCondition, number> = {
  light: 0.85,
  normal: 1.0,
  heavy: 1.3,
};

const PET_HAIR_MINUTES: Record<PetHairLevel, number> = {
  none: 0,
  light: 15,
  heavy: 25,
};

const LAST_CLEANED_MINUTES: Record<LastCleaned, number> = {
  never: 20,
  within_1_week: 0,
  within_1_month: 5,
  within_3_months: 10,
  over_3_months: 15,
};

const FLOOR_TYPE_MINUTES: Record<FloorType, number> = {
  hardwood: 0,
  tile: 5,
  carpet: 10,
  mixed: 8,
  other: 5,
};

const EXTRA_TASK_MINUTES: Record<ExtraTask, number> = {
  inside_fridge: 25,
  inside_oven: 30,
  interior_windows: 30,
  baseboards: 45,
  laundry: 30,
  dishes: 20,
  inside_cabinets: 30,
};

const EXTRA_TASK_LABELS: Record<ExtraTask, string> = {
  inside_fridge: "Inside fridge",
  inside_oven: "Inside oven",
  interior_windows: "Interior windows",
  baseboards: "Baseboards",
  laundry: "Laundry",
  dishes: "Dishes",
  inside_cabinets: "Inside cabinets",
};

const SQUARE_FEET_LABELS: Record<SquareFeetRange, string> = {
  under_800: "Under 800 sq ft",
  "800_1500": "800–1,500 sq ft",
  "1500_2500": "1,500–2,500 sq ft",
  "2500_plus": "2,500+ sq ft",
};

const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  standard: "Standard clean",
  deep: "Deep clean",
  move_in_move_out: "Move-in / move-out",
};

const VISIT_TYPE_LABELS: Record<VisitType, string> = {
  first_clean: "First clean",
  recurring_clean: "Recurring clean",
};

const HOME_CONDITION_LABELS: Record<HomeCondition, string> = {
  maintained: "Well maintained",
  some_buildup: "Some buildup",
  heavy_buildup: "Heavy buildup",
};

const CLUTTER_LEVEL_LABELS: Record<ClutterLevel, string> = {
  low: "Low clutter",
  medium: "Medium clutter",
  high: "High clutter",
};

const AREA_CONDITION_LABELS: Record<AreaCondition, string> = {
  light: "Light",
  normal: "Normal",
  heavy: "Heavy",
};

const PET_HAIR_LABELS: Record<PetHairLevel, string> = {
  none: "No pet hair",
  light: "Light pet hair",
  heavy: "Heavy pet hair",
};

const FLOOR_TYPE_LABELS: Record<FloorType, string> = {
  hardwood: "Hardwood",
  tile: "Tile",
  carpet: "Carpet",
  mixed: "Mixed",
  other: "Other",
};

const LAST_CLEANED_LABELS: Record<LastCleaned, string> = {
  never: "Never / not sure",
  within_1_week: "Within 1 week",
  within_1_month: "Within 1 month",
  within_3_months: "Within 3 months",
  over_3_months: "Over 3 months ago",
};

const HOME_TYPE_LABELS: Record<HomeType, string> = {
  apartment: "Apartment",
  house: "House",
  condo: "Condo",
  townhouse: "Townhouse",
};

export const HOME_TYPES: HomeType[] = [
  "apartment",
  "house",
  "condo",
  "townhouse",
];

export const SQUARE_FEET_RANGES: SquareFeetRange[] = [
  "under_800",
  "800_1500",
  "1500_2500",
  "2500_plus",
];

export const SERVICE_TYPES: ServiceType[] = [
  "standard",
  "deep",
  "move_in_move_out",
];

export const VISIT_TYPES: VisitType[] = ["first_clean", "recurring_clean"];

export const HOME_CONDITIONS: HomeCondition[] = [
  "maintained",
  "some_buildup",
  "heavy_buildup",
];

export const CLUTTER_LEVELS: ClutterLevel[] = ["low", "medium", "high"];

export const AREA_CONDITIONS: AreaCondition[] = ["light", "normal", "heavy"];

export const PET_HAIR_LEVELS: PetHairLevel[] = ["none", "light", "heavy"];

export const FLOOR_TYPES: FloorType[] = [
  "hardwood",
  "tile",
  "carpet",
  "mixed",
  "other",
];

export const LAST_CLEANED_OPTIONS: LastCleaned[] = [
  "never",
  "within_1_week",
  "within_1_month",
  "within_3_months",
  "over_3_months",
];

export const EXTRA_TASKS: ExtraTask[] = [
  "inside_fridge",
  "inside_oven",
  "interior_windows",
  "baseboards",
  "laundry",
  "dishes",
  "inside_cabinets",
];

function roundToHalf(value: number): number {
  return Math.round(value * 2) / 2;
}

function applyMultiplier(baseMinutes: number, multiplier: number): number {
  return Math.round(baseMinutes * multiplier);
}

export function estimateIntake(input: IntakeInput): IntakeQuote {
  const breakdown: IntakeBreakdownItem[] = [];

  breakdown.push({ label: "Base visit / setup", minutes: BASE_VISIT_MINUTES });

  if (input.clean_bedrooms && input.bedrooms > 0) {
    const base = input.bedrooms * BEDROOM_MINUTES;
    const minutes = applyMultiplier(
      base,
      HOME_CONDITION_MULTIPLIERS[input.home_condition]
    );
    breakdown.push({
      label: `${input.bedrooms} bedroom${input.bedrooms === 1 ? "" : "s"}`,
      minutes,
    });
  }

  if (input.clean_bathrooms && input.bathrooms > 0) {
    const base = input.bathrooms * BATHROOM_MINUTES;
    const minutes = applyMultiplier(
      base,
      AREA_CONDITION_MULTIPLIERS[input.bathroom_condition]
    );
    breakdown.push({
      label: `${input.bathrooms} bathroom${input.bathrooms === 1 ? "" : "s"}`,
      minutes,
    });
  }

  if (input.clean_kitchen) {
    const minutes = applyMultiplier(
      KITCHEN_MINUTES,
      AREA_CONDITION_MULTIPLIERS[input.kitchen_condition]
    );
    breakdown.push({ label: "Kitchen", minutes });
  }

  if (input.clean_common_area) {
    const minutes = applyMultiplier(
      COMMON_AREA_MINUTES,
      CLUTTER_MULTIPLIERS[input.clutter_level] *
        HOME_CONDITION_MULTIPLIERS[input.home_condition]
    );
    breakdown.push({ label: "Common areas", minutes });
  }

  if (input.clean_hallways) {
    breakdown.push({
      label: "Hallways",
      minutes: HALLWAY_MINUTES[input.square_feet_range],
    });
  }

  const sqftModifier = SQUARE_FEET_MODIFIERS[input.square_feet_range];
  if (sqftModifier !== 0) {
    breakdown.push({
      label: `Size (${SQUARE_FEET_LABELS[input.square_feet_range]})`,
      minutes: sqftModifier,
    });
  }

  const petMinutes = PET_HAIR_MINUTES[input.pet_hair_level];
  if (petMinutes > 0) {
    breakdown.push({ label: "Pet hair", minutes: petMinutes });
  }

  const floorMinutes = FLOOR_TYPE_MINUTES[input.floor_type];
  if (floorMinutes > 0) {
    breakdown.push({
      label: `Floors (${FLOOR_TYPE_LABELS[input.floor_type]})`,
      minutes: floorMinutes,
    });
  }

  if (input.last_cleaned) {
    const lastCleanedMinutes = LAST_CLEANED_MINUTES[input.last_cleaned];
    if (lastCleanedMinutes > 0) {
      breakdown.push({
        label: `Last cleaned (${LAST_CLEANED_LABELS[input.last_cleaned]})`,
        minutes: lastCleanedMinutes,
      });
    }
  }

  for (const task of input.extra_tasks) {
    breakdown.push({
      label: EXTRA_TASK_LABELS[task],
      minutes: EXTRA_TASK_MINUTES[task],
    });
  }

  const total_minutes_before_multipliers = breakdown.reduce(
    (sum, item) => sum + item.minutes,
    0
  );

  const service_type_multiplier =
    SERVICE_TYPE_MULTIPLIERS[input.service_type];
  const visit_type_multiplier = VISIT_TYPE_MULTIPLIERS[input.visit_type];

  const afterMultipliers =
    total_minutes_before_multipliers *
    service_type_multiplier *
    visit_type_multiplier;

  const buffer_minutes = Math.max(
    MIN_BUFFER_MINUTES,
    Math.round(afterMultipliers * BUFFER_PERCENT)
  );

  const totalMinutes = afterMultipliers + buffer_minutes;
  const recommended_hours = roundToHalf(totalMinutes / 60);
  const minimum_hours = roundToHalf(Math.max(2, recommended_hours * 0.7));
  const maximum_hours = roundToHalf(recommended_hours * 1.5);

  return {
    recommended_hours,
    minimum_hours,
    maximum_hours,
    breakdown,
    total_minutes_before_multipliers,
    service_type_multiplier,
    visit_type_multiplier,
    buffer_minutes,
  };
}

export function getServiceTypeLabel(serviceType: ServiceType): string {
  return SERVICE_TYPE_LABELS[serviceType];
}

export function getVisitTypeLabel(visitType: VisitType): string {
  return VISIT_TYPE_LABELS[visitType];
}

export function getHomeConditionLabel(condition: HomeCondition): string {
  return HOME_CONDITION_LABELS[condition];
}

export function getClutterLevelLabel(level: ClutterLevel): string {
  return CLUTTER_LEVEL_LABELS[level];
}

export function getAreaConditionLabel(condition: AreaCondition): string {
  return AREA_CONDITION_LABELS[condition];
}

export function getPetHairLevelLabel(level: PetHairLevel): string {
  return PET_HAIR_LABELS[level];
}

export function getFloorTypeLabel(floorType: FloorType): string {
  return FLOOR_TYPE_LABELS[floorType];
}

export function getLastCleanedLabel(value: LastCleaned): string {
  return LAST_CLEANED_LABELS[value];
}

export function getHomeTypeLabel(homeType: HomeType): string {
  return HOME_TYPE_LABELS[homeType];
}

export function getSquareFeetRangeLabel(range: SquareFeetRange): string {
  return SQUARE_FEET_LABELS[range];
}

export function getExtraTaskLabel(task: ExtraTask): string {
  return EXTRA_TASK_LABELS[task];
}

/** Legacy mapping for bookings.mess_level column. */
export function homeConditionToMessLevel(
  condition: HomeCondition
): "light" | "normal" | "heavy" {
  switch (condition) {
    case "maintained":
      return "light";
    case "some_buildup":
      return "normal";
    case "heavy_buildup":
      return "heavy";
  }
}
