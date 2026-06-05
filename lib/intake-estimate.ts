export type HomeType = "apartment" | "house" | "condo" | "townhouse";

export type SquareFeetRange =
  | "under_800"
  | "800_1500"
  | "1500_2500"
  | "2500_plus";

export type ServiceType = "standard" | "deep" | "move_in_move_out";

export type MessLevel = "light" | "normal" | "heavy";

export type ExtraTask =
  | "inside_fridge"
  | "inside_oven"
  | "interior_windows"
  | "baseboards"
  | "laundry"
  | "dishes"
  | "inside_cabinets";

export type IntakeInput = {
  home_type: HomeType;
  bedrooms: number;
  bathrooms: number;
  square_feet_range: SquareFeetRange;
  service_type: ServiceType;
  mess_level: MessLevel;
  has_pets: boolean;
  supplies_needed: boolean;
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
  mess_level_multiplier: number;
};

const BASE_VISIT_MINUTES = 30;
const BEDROOM_MINUTES = 25;
const BATHROOM_MINUTES = 35;
const KITCHEN_COMMON_MINUTES = 75;

const SQUARE_FEET_MODIFIERS: Record<SquareFeetRange, number> = {
  under_800: -15,
  "800_1500": 0,
  "1500_2500": 30,
  "2500_plus": 60,
};

const SERVICE_TYPE_MULTIPLIERS: Record<ServiceType, number> = {
  standard: 1.0,
  deep: 1.4,
  move_in_move_out: 1.6,
};

const MESS_LEVEL_MULTIPLIERS: Record<MessLevel, number> = {
  light: 0.85,
  normal: 1.0,
  heavy: 1.3,
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

const MESS_LEVEL_LABELS: Record<MessLevel, string> = {
  light: "Light mess",
  normal: "Normal mess",
  heavy: "Heavy mess",
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

export const MESS_LEVELS: MessLevel[] = ["light", "normal", "heavy"];

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

export function estimateIntake(input: IntakeInput): IntakeQuote {
  const breakdown: IntakeBreakdownItem[] = [];

  breakdown.push({ label: "Base visit / setup", minutes: BASE_VISIT_MINUTES });

  const bedroomMinutes = input.bedrooms * BEDROOM_MINUTES;
  if (bedroomMinutes > 0) {
    breakdown.push({
      label: `${input.bedrooms} bedroom${input.bedrooms === 1 ? "" : "s"}`,
      minutes: bedroomMinutes,
    });
  }

  const bathroomMinutes = input.bathrooms * BATHROOM_MINUTES;
  if (bathroomMinutes > 0) {
    breakdown.push({
      label: `${input.bathrooms} bathroom${input.bathrooms === 1 ? "" : "s"}`,
      minutes: bathroomMinutes,
    });
  }

  breakdown.push({
    label: "Kitchen & common areas",
    minutes: KITCHEN_COMMON_MINUTES,
  });

  const sqftModifier = SQUARE_FEET_MODIFIERS[input.square_feet_range];
  if (sqftModifier !== 0) {
    breakdown.push({
      label: `Size (${SQUARE_FEET_LABELS[input.square_feet_range]})`,
      minutes: sqftModifier,
    });
  }

  if (input.has_pets) {
    breakdown.push({ label: "Pets", minutes: 20 });
  }

  if (input.supplies_needed) {
    breakdown.push({ label: "Supplies needed", minutes: 10 });
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
  const mess_level_multiplier = MESS_LEVEL_MULTIPLIERS[input.mess_level];

  const adjustedMinutes =
    total_minutes_before_multipliers *
    service_type_multiplier *
    mess_level_multiplier;

  const recommended_hours = roundToHalf(adjustedMinutes / 60);
  const minimum_hours = roundToHalf(
    Math.max(2, recommended_hours * 0.7)
  );
  const maximum_hours = roundToHalf(recommended_hours * 1.5);

  return {
    recommended_hours,
    minimum_hours,
    maximum_hours,
    breakdown,
    total_minutes_before_multipliers,
    service_type_multiplier,
    mess_level_multiplier,
  };
}

export function getServiceTypeLabel(serviceType: ServiceType): string {
  return SERVICE_TYPE_LABELS[serviceType];
}

export function getMessLevelLabel(messLevel: MessLevel): string {
  return MESS_LEVEL_LABELS[messLevel];
}

export function getExtraTaskLabel(task: ExtraTask): string {
  return EXTRA_TASK_LABELS[task];
}
