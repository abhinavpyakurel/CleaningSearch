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

export type AreaSize = "small" | "normal" | "large";

export type LivingAreaSize = AreaSize | "open_plan";

export type BathroomType = "half" | "full" | "master";

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
  clean_floors: boolean;
  home_condition: HomeCondition;
  /** @deprecated Booking form no longer collects global clutter; use common_area_condition. */
  clutter_level?: ClutterLevel;
  kitchen_condition: AreaCondition;
  bathroom_condition: AreaCondition;
  common_area_condition?: AreaCondition;
  bedroom_size?: AreaSize;
  bedroom_condition?: AreaCondition;
  bathroom_type?: BathroomType;
  kitchen_size?: AreaSize;
  living_area_size?: LivingAreaSize;
  hallway_size?: AreaSize;
  hallway_condition?: AreaCondition;
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
const BEDROOM_BASE_MINUTES = 30;
const BATHROOM_BASE_MINUTES = 40;
const KITCHEN_BASE_MINUTES = 55;
const LIVING_BASE_MINUTES = 30;
const HALLWAY_BASE_MINUTES = 15;
const BUFFER_PERCENT = 0.15;
const MIN_BUFFER_MINUTES = 15;
/** Lowest hours a client may request on any booking. */
export const ABSOLUTE_MINIMUM_HOURS = 1.5;

const AREA_SIZE_MULTIPLIERS: Record<AreaSize, number> = {
  small: 0.8,
  normal: 1.0,
  large: 1.3,
};

const LIVING_SIZE_MULTIPLIERS: Record<LivingAreaSize, number> = {
  small: 0.8,
  normal: 1.0,
  large: 1.4,
  open_plan: 1.4,
};

const BATHROOM_TYPE_MULTIPLIERS: Record<BathroomType, number> = {
  half: 0.65,
  full: 1.0,
  master: 1.35,
};

const BATHROOM_CONDITION_MULTIPLIERS: Record<AreaCondition, number> = {
  light: 0.85,
  normal: 1.0,
  heavy: 1.4,
};

const KITCHEN_SIZE_MULTIPLIERS: Record<AreaSize, number> = {
  small: 0.85,
  normal: 1.0,
  large: 1.3,
};

const KITCHEN_CONDITION_MULTIPLIERS: Record<AreaCondition, number> = {
  light: 0.85,
  normal: 1.0,
  heavy: 1.45,
};

const BEDROOM_CLUTTER_MULTIPLIERS: Record<AreaCondition, number> = {
  light: 0.9,
  normal: 1.0,
  heavy: 1.35,
};

const LIVING_CLUTTER_MULTIPLIERS: Record<AreaCondition, number> = {
  light: 0.9,
  normal: 1.0,
  heavy: 1.3,
};

const HALLWAY_CLUTTER_MULTIPLIERS: Record<AreaCondition, number> = {
  light: 0.9,
  normal: 1.0,
  heavy: 1.2,
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

export const AREA_SIZES: AreaSize[] = ["small", "normal", "large"];

export const LIVING_AREA_SIZES: LivingAreaSize[] = [
  "small",
  "normal",
  "large",
  "open_plan",
];

export const BATHROOM_TYPES: BathroomType[] = ["half", "full", "master"];

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

function roundAreaMinutes(value: number): number {
  return Math.round(value);
}

const AREA_SIZE_LABELS: Record<AreaSize, string> = {
  small: "small",
  normal: "normal",
  large: "large",
};

const LIVING_SIZE_LABELS: Record<LivingAreaSize, string> = {
  small: "small",
  normal: "normal",
  large: "large",
  open_plan: "open plan",
};

const BATHROOM_TYPE_LABELS: Record<BathroomType, string> = {
  half: "half bath",
  full: "full bath",
  master: "master bath",
};

const CLUTTER_TIER_LABELS: Record<AreaCondition, string> = {
  light: "clear",
  normal: "normal",
  heavy: "cluttered",
};

function resolveBedroomCondition(input: IntakeInput): AreaCondition {
  if (input.bedroom_condition) {
    return input.bedroom_condition;
  }
  switch (input.home_condition) {
    case "maintained":
      return "light";
    case "heavy_buildup":
      return "heavy";
    default:
      return "normal";
  }
}

function resolveLivingCondition(input: IntakeInput): AreaCondition {
  if (input.common_area_condition) {
    return input.common_area_condition;
  }
  if (input.clutter_level) {
    switch (input.clutter_level) {
      case "low":
        return "light";
      case "high":
        return "heavy";
      default:
        return "normal";
    }
  }
  switch (input.home_condition) {
    case "maintained":
      return "light";
    case "heavy_buildup":
      return "heavy";
    default:
      return "normal";
  }
}

export function estimateIntake(input: IntakeInput): IntakeQuote {
  const breakdown: IntakeBreakdownItem[] = [];

  breakdown.push({ label: "Base visit / setup", minutes: BASE_VISIT_MINUTES });

  if (input.clean_bedrooms && input.bedrooms > 0) {
    const size = input.bedroom_size ?? "normal";
    const clutter = resolveBedroomCondition(input);
    const base = input.bedrooms * BEDROOM_BASE_MINUTES;
    const minutes = roundAreaMinutes(
      base * AREA_SIZE_MULTIPLIERS[size] * BEDROOM_CLUTTER_MULTIPLIERS[clutter]
    );
    breakdown.push({
      label: `Bedrooms (${input.bedrooms} × ${BEDROOM_BASE_MINUTES} min, ${AREA_SIZE_LABELS[size]}, ${CLUTTER_TIER_LABELS[clutter]})`,
      minutes,
    });
  }

  if (input.clean_bathrooms && input.bathrooms > 0) {
    const type = input.bathroom_type ?? "full";
    const condition = input.bathroom_condition;
    const base = input.bathrooms * BATHROOM_BASE_MINUTES;
    const minutes = roundAreaMinutes(
      base *
        BATHROOM_TYPE_MULTIPLIERS[type] *
        BATHROOM_CONDITION_MULTIPLIERS[condition]
    );
    breakdown.push({
      label: `Bathrooms (${input.bathrooms} × ${BATHROOM_BASE_MINUTES} min, ${BATHROOM_TYPE_LABELS[type]}, ${AREA_CONDITION_LABELS[condition]} condition)`,
      minutes,
    });
  }

  if (input.clean_kitchen) {
    const size = input.kitchen_size ?? "normal";
    const condition = input.kitchen_condition;
    const minutes = roundAreaMinutes(
      KITCHEN_BASE_MINUTES *
        KITCHEN_SIZE_MULTIPLIERS[size] *
        KITCHEN_CONDITION_MULTIPLIERS[condition]
    );
    breakdown.push({
      label: `Kitchen (${KITCHEN_BASE_MINUTES} min, ${AREA_SIZE_LABELS[size]}, ${AREA_CONDITION_LABELS[condition]} condition)`,
      minutes,
    });
  }

  if (input.clean_common_area) {
    const size = input.living_area_size ?? "normal";
    const clutter = resolveLivingCondition(input);
    const minutes = roundAreaMinutes(
      LIVING_BASE_MINUTES *
        LIVING_SIZE_MULTIPLIERS[size] *
        LIVING_CLUTTER_MULTIPLIERS[clutter]
    );
    breakdown.push({
      label: `Living areas (${LIVING_BASE_MINUTES} min, ${LIVING_SIZE_LABELS[size]}, ${CLUTTER_TIER_LABELS[clutter]})`,
      minutes,
    });
  }

  if (input.clean_hallways) {
    const size = input.hallway_size ?? "normal";
    const clutter = input.hallway_condition ?? "normal";
    const minutes = roundAreaMinutes(
      HALLWAY_BASE_MINUTES *
        AREA_SIZE_MULTIPLIERS[size] *
        HALLWAY_CLUTTER_MULTIPLIERS[clutter]
    );
    breakdown.push({
      label: `Hallways (${HALLWAY_BASE_MINUTES} min, ${AREA_SIZE_LABELS[size]}, ${CLUTTER_TIER_LABELS[clutter]})`,
      minutes,
    });
  }

  const petMinutes = PET_HAIR_MINUTES[input.pet_hair_level];
  if (petMinutes > 0) {
    breakdown.push({ label: "Pet hair", minutes: petMinutes });
  }

  if (input.clean_floors) {
    const floorMinutes = FLOOR_TYPE_MINUTES[input.floor_type];
    if (floorMinutes > 0) {
      breakdown.push({
        label: `Floors (${FLOOR_TYPE_LABELS[input.floor_type]})`,
        minutes: floorMinutes,
      });
    }
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
  const recommended_hours = roundToHalf(
    Math.max(ABSOLUTE_MINIMUM_HOURS, totalMinutes / 60)
  );
  const minimum_hours = roundToHalf(
    Math.max(ABSOLUTE_MINIMUM_HOURS, recommended_hours * 0.7)
  );
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

/** UI-facing square footage pill labels (maps to SquareFeetRange). */
export type UiSquareFeetRange = "under_500" | "500_1k" | "1k_2k" | "2k_plus";

export const UI_SQUARE_FEET_RANGES: UiSquareFeetRange[] = [
  "under_500",
  "500_1k",
  "1k_2k",
  "2k_plus",
];

const UI_SQUARE_FEET_LABELS: Record<UiSquareFeetRange, string> = {
  under_500: "Under 500 sq ft",
  "500_1k": "500–1,000 sq ft",
  "1k_2k": "1,000–2,000 sq ft",
  "2k_plus": "2,000+ sq ft",
};

const UI_TO_SQUARE_FEET: Record<UiSquareFeetRange, SquareFeetRange> = {
  under_500: "under_800",
  "500_1k": "800_1500",
  "1k_2k": "1500_2500",
  "2k_plus": "2500_plus",
};

export function uiSquareFeetToRange(ui: UiSquareFeetRange): SquareFeetRange {
  return UI_TO_SQUARE_FEET[ui];
}

export function getUiSquareFeetLabel(ui: UiSquareFeetRange): string {
  return UI_SQUARE_FEET_LABELS[ui];
}

/** UI-facing last-cleaned pill labels (maps to LastCleaned). */
export type UiLastCleaned =
  | "this_week"
  | "this_month"
  | "two_to_six_months"
  | "six_months_plus";

export const UI_LAST_CLEANED_OPTIONS: UiLastCleaned[] = [
  "this_week",
  "this_month",
  "two_to_six_months",
  "six_months_plus",
];

const UI_LAST_CLEANED_LABELS: Record<UiLastCleaned, string> = {
  this_week: "This week",
  this_month: "This month",
  two_to_six_months: "2–6 months",
  six_months_plus: "6+ months",
};

const UI_TO_LAST_CLEANED: Record<UiLastCleaned, LastCleaned> = {
  this_week: "within_1_week",
  this_month: "within_1_month",
  two_to_six_months: "within_3_months",
  six_months_plus: "over_3_months",
};

export function uiLastCleanedToValue(ui: UiLastCleaned): LastCleaned {
  return UI_TO_LAST_CLEANED[ui];
}

export function getUiLastCleanedLabel(ui: UiLastCleaned): string {
  return UI_LAST_CLEANED_LABELS[ui];
}

/** Short clutter labels for booking form pills. */
export function getClutterLevelShortLabel(level: ClutterLevel): string {
  switch (level) {
    case "low":
      return "Tidy";
    case "medium":
      return "Normal";
    case "high":
      return "Lots";
  }
}

export function areaConditionToHomeCondition(
  condition: AreaCondition
): HomeCondition {
  switch (condition) {
    case "light":
      return "maintained";
    case "normal":
      return "some_buildup";
    case "heavy":
      return "heavy_buildup";
  }
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
