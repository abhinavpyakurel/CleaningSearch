export type CleanType = "maintenance" | "deep" | "move-out";

export type IntakeInput = {
  bedrooms: number;
  bathrooms: number;
  cleanType: CleanType;
  hasPets: boolean;
};

export type IntakeEstimate = {
  estimated_hours: number;
  suggested_price_min: number;
  suggested_price_max: number;
  scope_summary: string;
};

const CLEANER_HOURLY_RATE = 30;
// TODO: Replace with the selected cleaner's hourly rate once cleaner selection is wired up.

const CLEAN_TYPE_LABELS: Record<CleanType, string> = {
  maintenance: "maintenance",
  deep: "deep",
  "move-out": "move-out",
};

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function estimateIntake(input: IntakeInput): IntakeEstimate {
  let baseHours = input.bedrooms * 0.75 + input.bathrooms * 0.75;

  if (input.cleanType === "deep") {
    baseHours *= 1.7;
  } else if (input.cleanType === "move-out") {
    baseHours *= 2.0;
  }

  if (input.hasPets) {
    baseHours += 0.5;
  }

  const estimated_hours = round2(baseHours);
  const suggested_price_min = round2(baseHours * 0.8 * CLEANER_HOURLY_RATE);
  const suggested_price_max = round2(baseHours * 1.2 * CLEANER_HOURLY_RATE);

  const petsLabel = input.hasPets ? "yes" : "no";
  const typeLabel = CLEAN_TYPE_LABELS[input.cleanType];
  const scope_summary = `Approx ${estimated_hours} hours for a ${input.bedrooms}-bed, ${input.bathrooms}-bath home, clean type: ${typeLabel}, pets: ${petsLabel}.`;

  return {
    estimated_hours,
    suggested_price_min,
    suggested_price_max,
    scope_summary,
  };
}
