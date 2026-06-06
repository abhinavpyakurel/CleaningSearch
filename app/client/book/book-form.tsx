"use client";

import { Minus, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";

import {
  createBookingAction,
  type BookActionState,
} from "@/app/client/book/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  computeBookingPricing,
  formatHourlyRate,
  formatUsd,
  PLATFORM_SERVICE_FEE_RATE,
} from "@/lib/booking-price";
import {
  AREA_CONDITIONS,
  CLUTTER_LEVELS,
  estimateIntake,
  EXTRA_TASKS,
  FLOOR_TYPES,
  getAreaConditionLabel,
  getClutterLevelLabel,
  getExtraTaskLabel,
  getFloorTypeLabel,
  getHomeConditionLabel,
  getHomeTypeLabel,
  getLastCleanedLabel,
  getPetHairLevelLabel,
  getServiceTypeLabel,
  getSquareFeetRangeLabel,
  getVisitTypeLabel,
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
import { cn } from "@/lib/utils";

const initialState: BookActionState = {};

const STEPS = [
  { id: 1, label: "Scope" },
  { id: 2, label: "Time & Price" },
  { id: 3, label: "Review" },
] as const;

function formatHours(hours: number): string {
  return Number.isInteger(hours) ? String(hours) : hours.toFixed(1);
}

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full sm:w-auto" disabled={pending || disabled}>
      {pending ? "Submitting…" : "Send request"}
    </Button>
  );
}

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <ol className="flex items-center gap-2">
      {STEPS.map((step, index) => (
        <li key={step.id} className="flex flex-1 items-center gap-2">
          <div
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-medium",
              currentStep >= step.id
                ? "bg-[#00695C] text-white"
                : "bg-muted text-muted-foreground"
            )}
          >
            {step.id}
          </div>
          <span
            className={cn(
              "hidden text-sm sm:inline",
              currentStep >= step.id
                ? "font-medium text-foreground"
                : "text-muted-foreground"
            )}
          >
            {step.label}
          </span>
          {index < STEPS.length - 1 ? (
            <div
              className={cn(
                "hidden h-px flex-1 sm:block",
                currentStep > step.id ? "bg-[#00695C]" : "bg-border"
              )}
            />
          ) : null}
        </li>
      ))}
    </ol>
  );
}

function SelectField({
  id,
  label,
  value,
  onChange,
  options,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <select
        id={id}
        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

type BookFormProps = {
  cleanerId: string;
  cleanerName: string;
  hourlyRate: number | null;
};

export function BookForm({
  cleanerId,
  cleanerName,
  hourlyRate,
}: BookFormProps) {
  const [state, formAction] = useFormState(createBookingAction, initialState);
  const [step, setStep] = useState(1);
  const [stepError, setStepError] = useState<string | null>(null);

  const [visitType, setVisitType] = useState<VisitType>("first_clean");
  const [serviceType, setServiceType] = useState<ServiceType>("standard");
  const [homeType, setHomeType] = useState<HomeType>("house");
  const [bedrooms, setBedrooms] = useState("2");
  const [bathrooms, setBathrooms] = useState("1");
  const [squareFeetRange, setSquareFeetRange] =
    useState<SquareFeetRange>("800_1500");
  const [cleanBedrooms, setCleanBedrooms] = useState(true);
  const [cleanBathrooms, setCleanBathrooms] = useState(true);
  const [cleanKitchen, setCleanKitchen] = useState(false);
  const [cleanCommonArea, setCleanCommonArea] = useState(false);
  const [cleanHallways, setCleanHallways] = useState(false);
  const [homeCondition, setHomeCondition] =
    useState<HomeCondition>("some_buildup");
  const [clutterLevel, setClutterLevel] = useState<ClutterLevel>("medium");
  const [kitchenCondition, setKitchenCondition] =
    useState<AreaCondition>("normal");
  const [bathroomCondition, setBathroomCondition] =
    useState<AreaCondition>("normal");
  const [petHairLevel, setPetHairLevel] = useState<PetHairLevel>("none");
  const [lastCleaned, setLastCleaned] = useState<LastCleaned | "">("");
  const [floorType, setFloorType] = useState<FloorType>("mixed");
  const [extraTasks, setExtraTasks] = useState<ExtraTask[]>([]);
  const [specialRequests, setSpecialRequests] = useState("");
  const [requestedHours, setRequestedHours] = useState<number | null>(null);
  const [rangeAlert, setRangeAlert] = useState<string | null>(null);
  const [serviceAddress, setServiceAddress] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  const intakeInput = useMemo((): IntakeInput | null => {
    const bedroomCount = Number(bedrooms);
    const bathroomCount = Number(bathrooms);

    if (
      !Number.isFinite(bedroomCount) ||
      bedroomCount < 0 ||
      !Number.isInteger(bedroomCount) ||
      !Number.isFinite(bathroomCount) ||
      bathroomCount < 0
    ) {
      return null;
    }

    return {
      visit_type: visitType,
      service_type: serviceType,
      home_type: homeType,
      bedrooms: bedroomCount,
      bathrooms: bathroomCount,
      square_feet_range: squareFeetRange,
      clean_bedrooms: cleanBedrooms,
      clean_bathrooms: cleanBathrooms,
      clean_kitchen: cleanKitchen,
      clean_common_area: cleanCommonArea,
      clean_hallways: cleanHallways,
      home_condition: homeCondition,
      clutter_level: clutterLevel,
      kitchen_condition: kitchenCondition,
      bathroom_condition: bathroomCondition,
      pet_hair_level: petHairLevel,
      last_cleaned: lastCleaned || null,
      floor_type: floorType,
      extra_tasks: extraTasks,
    };
  }, [
    visitType,
    serviceType,
    homeType,
    bedrooms,
    bathrooms,
    squareFeetRange,
    cleanBedrooms,
    cleanBathrooms,
    cleanKitchen,
    cleanCommonArea,
    cleanHallways,
    homeCondition,
    clutterLevel,
    kitchenCondition,
    bathroomCondition,
    petHairLevel,
    lastCleaned,
    floorType,
    extraTasks,
  ]);

  const quote = useMemo(() => {
    if (!intakeInput) {
      return null;
    }
    return estimateIntake(intakeInput);
  }, [intakeInput]);

  useEffect(() => {
    if (quote) {
      setRequestedHours(quote.recommended_hours);
      setRangeAlert(null);
    } else {
      setRequestedHours(null);
    }
  }, [quote]);

  const pricing = useMemo(() => {
    if (
      hourlyRate == null ||
      !Number.isFinite(hourlyRate) ||
      hourlyRate <= 0 ||
      requestedHours == null ||
      !Number.isFinite(requestedHours) ||
      requestedHours <= 0
    ) {
      return null;
    }
    return computeBookingPricing(hourlyRate, requestedHours);
  }, [hourlyRate, requestedHours]);

  const serviceFeePercent = Math.round(PLATFORM_SERVICE_FEE_RATE * 100);
  const belowRecommended =
    quote != null &&
    requestedHours != null &&
    requestedHours < quote.recommended_hours;

  function toggleExtraTask(task: ExtraTask) {
    setExtraTasks((current) =>
      current.includes(task)
        ? current.filter((item) => item !== task)
        : [...current, task]
    );
  }

  function adjustHours(delta: number) {
    if (!quote || requestedHours == null) {
      return;
    }

    const next = Math.round((requestedHours + delta) * 2) / 2;

    if (next < quote.minimum_hours) {
      setRangeAlert(
        `Minimum booking is ${formatHours(quote.minimum_hours)} hours. You cannot go below this.`
      );
      return;
    }

    if (next > quote.maximum_hours) {
      setRangeAlert(
        `Maximum booking is ${formatHours(quote.maximum_hours)} hours. You cannot go above this.`
      );
      return;
    }

    setRangeAlert(null);
    setRequestedHours(next);
  }

  function validateStep1(): string | null {
    if (!intakeInput) {
      return "Enter valid bedroom and bathroom counts.";
    }
    if (
      !cleanBedrooms &&
      !cleanBathrooms &&
      !cleanKitchen &&
      !cleanCommonArea &&
      !cleanHallways
    ) {
      return "Select at least one area to clean.";
    }
    if (cleanBedrooms && intakeInput.bedrooms < 1) {
      return "Enter at least 1 bedroom when bedrooms are included.";
    }
    if (cleanBathrooms && intakeInput.bathrooms < 1) {
      return "Enter at least 1 bathroom when bathrooms are included.";
    }
    return null;
  }

  function validateStep2(): string | null {
    const step1Error = validateStep1();
    if (step1Error) {
      return step1Error;
    }
    if (!quote || requestedHours == null) {
      return "Complete the cleaning scope to see a time estimate.";
    }
    if (hourlyRate == null || hourlyRate <= 0) {
      return "This cleaner has not set an hourly rate yet.";
    }
    if (requestedHours < quote.minimum_hours) {
      return `Requested hours must be at least ${formatHours(quote.minimum_hours)}.`;
    }
    if (requestedHours > quote.maximum_hours) {
      return `Requested hours cannot exceed ${formatHours(quote.maximum_hours)}.`;
    }
    return null;
  }

  function validateStep3(): string | null {
    const step2Error = validateStep2();
    if (step2Error) {
      return step2Error;
    }
    if (!serviceAddress.trim()) {
      return "Service address is required.";
    }
    if (!date || !time) {
      return "Date and time are required.";
    }
    return null;
  }

  function goNext() {
    setStepError(null);
    if (step === 1) {
      const error = validateStep1();
      if (error) {
        setStepError(error);
        return;
      }
      setStep(2);
      return;
    }
    if (step === 2) {
      const error = validateStep2();
      if (error) {
        setStepError(error);
        return;
      }
      setStep(3);
    }
  }

  function goBack() {
    setStepError(null);
    setStep((current) => Math.max(1, current - 1));
  }

  const selectedAreas = [
    cleanBedrooms ? "Bedrooms" : null,
    cleanBathrooms ? "Bathrooms" : null,
    cleanKitchen ? "Kitchen" : null,
    cleanCommonArea ? "Common areas" : null,
    cleanHallways ? "Hallways" : null,
  ].filter(Boolean) as string[];

  const canSubmit = validateStep3() === null;

  const selectClass =
    "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

  return (
    <Card className="w-full">
      <CardHeader className="gap-4">
        <StepIndicator currentStep={step} />
        <div>
          <CardTitle className="text-2xl">Book a cleaning</CardTitle>
          <CardDescription>
            Booking with {cleanerName}. Step {step} of 3 —{" "}
            {STEPS[step - 1]?.label}.
          </CardDescription>
        </div>
      </CardHeader>

      <form action={formAction} noValidate>
        <input type="hidden" name="cleaner_id" value={cleanerId} />
        <input type="hidden" name="visit_type" value={visitType} />
        <input type="hidden" name="home_type" value={homeType} />
        <input type="hidden" name="square_feet_range" value={squareFeetRange} />
        <input type="hidden" name="service_type" value={serviceType} />
        <input type="hidden" name="home_condition" value={homeCondition} />
        <input type="hidden" name="clutter_level" value={clutterLevel} />
        <input type="hidden" name="kitchen_condition" value={kitchenCondition} />
        <input
          type="hidden"
          name="bathroom_condition"
          value={bathroomCondition}
        />
        <input type="hidden" name="pet_hair_level" value={petHairLevel} />
        <input type="hidden" name="floor_type" value={floorType} />
        {lastCleaned ? (
          <input type="hidden" name="last_cleaned" value={lastCleaned} />
        ) : null}
        <input
          type="hidden"
          name="clean_bedrooms"
          value={cleanBedrooms ? "true" : "false"}
        />
        <input
          type="hidden"
          name="clean_bathrooms"
          value={cleanBathrooms ? "true" : "false"}
        />
        <input
          type="hidden"
          name="clean_kitchen"
          value={cleanKitchen ? "true" : "false"}
        />
        <input
          type="hidden"
          name="clean_common_area"
          value={cleanCommonArea ? "true" : "false"}
        />
        <input
          type="hidden"
          name="clean_hallways"
          value={cleanHallways ? "true" : "false"}
        />
        {requestedHours != null ? (
          <input
            type="hidden"
            name="client_requested_hours"
            value={String(requestedHours)}
          />
        ) : null}
        <input type="hidden" name="service_address" value={serviceAddress} />
        <input type="hidden" name="date" value={date} />
        <input type="hidden" name="time" value={time} />
        <input type="hidden" name="special_requests" value={specialRequests} />
        {extraTasks.map((task) => (
          <input key={task} type="hidden" name="extra_tasks" value={task} />
        ))}

        <CardContent className="flex flex-col gap-6">
          {state.error ? (
            <p
              role="alert"
              className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {state.error}
            </p>
          ) : null}

          {stepError ? (
            <p
              role="alert"
              className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {stepError}
            </p>
          ) : null}

          {step === 1 ? (
            <>
              <section className="flex flex-col gap-4">
                <h3 className="text-sm font-semibold text-foreground">
                  Visit & service
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <SelectField
                    id="visit_type"
                    label="Visit type"
                    value={visitType}
                    onChange={(value) => setVisitType(value as VisitType)}
                    options={VISIT_TYPES.map((type) => ({
                      value: type,
                      label: getVisitTypeLabel(type),
                    }))}
                  />
                  <SelectField
                    id="service_type"
                    label="Service type"
                    value={serviceType}
                    onChange={(value) => setServiceType(value as ServiceType)}
                    options={SERVICE_TYPES.map((type) => ({
                      value: type,
                      label: getServiceTypeLabel(type),
                    }))}
                  />
                </div>
              </section>

              <section className="flex flex-col gap-4">
                <h3 className="text-sm font-semibold text-foreground">
                  Home details
                </h3>
                <SelectField
                  id="home_type"
                  label="Home type"
                  value={homeType}
                  onChange={(value) => setHomeType(value as HomeType)}
                  options={HOME_TYPES.map((type) => ({
                    value: type,
                    label: getHomeTypeLabel(type),
                  }))}
                />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="bedrooms">Bedrooms</Label>
                    <Input
                      id="bedrooms"
                      name="bedrooms"
                      type="number"
                      min={0}
                      step={1}
                      required
                      value={bedrooms}
                      onChange={(event) => setBedrooms(event.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="bathrooms">Bathrooms</Label>
                    <Input
                      id="bathrooms"
                      name="bathrooms"
                      type="number"
                      min={0}
                      step={0.5}
                      required
                      value={bathrooms}
                      onChange={(event) => setBathrooms(event.target.value)}
                    />
                  </div>
                </div>
                <SelectField
                  id="square_feet_range"
                  label="Home size"
                  value={squareFeetRange}
                  onChange={(value) =>
                    setSquareFeetRange(value as SquareFeetRange)
                  }
                  options={SQUARE_FEET_RANGES.map((range) => ({
                    value: range,
                    label: getSquareFeetRangeLabel(range),
                  }))}
                />
              </section>

              <section className="flex flex-col gap-3">
                <h3 className="text-sm font-semibold text-foreground">
                  Areas to clean
                </h3>
                <p className="text-sm text-muted-foreground">
                  Only selected areas are included in the time estimate.
                </p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {[
                    {
                      id: "clean_bedrooms",
                      label: "Bedrooms",
                      checked: cleanBedrooms,
                      onChange: setCleanBedrooms,
                    },
                    {
                      id: "clean_bathrooms",
                      label: "Bathrooms",
                      checked: cleanBathrooms,
                      onChange: setCleanBathrooms,
                    },
                    {
                      id: "clean_kitchen",
                      label: "Kitchen",
                      checked: cleanKitchen,
                      onChange: setCleanKitchen,
                    },
                    {
                      id: "clean_common_area",
                      label: "Common areas",
                      checked: cleanCommonArea,
                      onChange: setCleanCommonArea,
                    },
                    {
                      id: "clean_hallways",
                      label: "Hallways",
                      checked: cleanHallways,
                      onChange: setCleanHallways,
                    },
                  ].map((area) => (
                    <label
                      key={area.id}
                      className="flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={area.checked}
                        onChange={(event) => area.onChange(event.target.checked)}
                        className="size-4 rounded border-input"
                      />
                      <span>{area.label}</span>
                    </label>
                  ))}
                </div>
              </section>

              <section className="flex flex-col gap-4">
                <h3 className="text-sm font-semibold text-foreground">
                  Condition
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <SelectField
                    id="home_condition"
                    label="Overall home condition"
                    value={homeCondition}
                    onChange={(value) =>
                      setHomeCondition(value as HomeCondition)
                    }
                    options={HOME_CONDITIONS.map((condition) => ({
                      value: condition,
                      label: getHomeConditionLabel(condition),
                    }))}
                  />
                  <SelectField
                    id="clutter_level"
                    label="Clutter level"
                    value={clutterLevel}
                    onChange={(value) => setClutterLevel(value as ClutterLevel)}
                    options={CLUTTER_LEVELS.map((level) => ({
                      value: level,
                      label: getClutterLevelLabel(level),
                    }))}
                  />
                  <SelectField
                    id="kitchen_condition"
                    label="Kitchen condition"
                    value={kitchenCondition}
                    onChange={(value) =>
                      setKitchenCondition(value as AreaCondition)
                    }
                    options={AREA_CONDITIONS.map((condition) => ({
                      value: condition,
                      label: getAreaConditionLabel(condition),
                    }))}
                  />
                  <SelectField
                    id="bathroom_condition"
                    label="Bathroom condition"
                    value={bathroomCondition}
                    onChange={(value) =>
                      setBathroomCondition(value as AreaCondition)
                    }
                    options={AREA_CONDITIONS.map((condition) => ({
                      value: condition,
                      label: getAreaConditionLabel(condition),
                    }))}
                  />
                  <SelectField
                    id="pet_hair_level"
                    label="Pet hair"
                    value={petHairLevel}
                    onChange={(value) =>
                      setPetHairLevel(value as PetHairLevel)
                    }
                    options={PET_HAIR_LEVELS.map((level) => ({
                      value: level,
                      label: getPetHairLevelLabel(level),
                    }))}
                  />
                  <SelectField
                    id="floor_type"
                    label="Floor type"
                    value={floorType}
                    onChange={(value) => setFloorType(value as FloorType)}
                    options={FLOOR_TYPES.map((type) => ({
                      value: type,
                      label: getFloorTypeLabel(type),
                    }))}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="last_cleaned">Last cleaned (optional)</Label>
                  <select
                    id="last_cleaned"
                    className={selectClass}
                    value={lastCleaned}
                    onChange={(event) =>
                      setLastCleaned(event.target.value as LastCleaned | "")
                    }
                  >
                    <option value="">Not specified</option>
                    {LAST_CLEANED_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {getLastCleanedLabel(option)}
                      </option>
                    ))}
                  </select>
                </div>
              </section>

              <section className="flex flex-col gap-4">
                <h3 className="text-sm font-semibold text-foreground">
                  Extra tasks
                </h3>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {EXTRA_TASKS.map((task) => (
                    <label
                      key={task}
                      className="flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={extraTasks.includes(task)}
                        onChange={() => toggleExtraTask(task)}
                        className="size-4 rounded border-input"
                      />
                      <span>{getExtraTaskLabel(task)}</span>
                    </label>
                  ))}
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="special_requests">
                    Special requests (optional)
                  </Label>
                  <Textarea
                    id="special_requests"
                    rows={3}
                    placeholder="Access instructions, allergies, focus areas…"
                    value={specialRequests}
                    onChange={(event) => setSpecialRequests(event.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Special requests are shared with the cleaner but do not
                    change the price estimate.
                  </p>
                </div>
              </section>
            </>
          ) : null}

          {step === 2 ? (
            <>
              <div className="rounded-lg border bg-muted/40 px-4 py-3 text-sm">
                <p className="font-medium text-foreground">Cleaner hourly rate</p>
                <p className="mt-1 text-muted-foreground">
                  {formatHourlyRate(hourlyRate)}
                </p>
              </div>

              {quote ? (
                <section className="rounded-lg border border-[#00695C]/20 bg-[#00695C]/5 px-4 py-3 text-sm">
                  <p className="font-semibold text-gray-900">
                    Recommended: {formatHours(quote.recommended_hours)} hours
                  </p>
                  <p className="mt-1 text-muted-foreground">
                    Allowed range: {formatHours(quote.minimum_hours)}–
                    {formatHours(quote.maximum_hours)} hours
                  </p>
                  <ul className="mt-3 space-y-1 text-muted-foreground">
                    {quote.breakdown.map((item) => (
                      <li
                        key={item.label}
                        className="flex justify-between gap-4"
                      >
                        <span>{item.label}</span>
                        <span className="text-foreground">
                          {item.minutes > 0 ? "+" : ""}
                          {item.minutes} min
                        </span>
                      </li>
                    ))}
                    <li className="flex justify-between gap-4 border-t border-[#00695C]/10 pt-1">
                      <span>
                        Service type ×{quote.service_type_multiplier}, visit type
                        ×{quote.visit_type_multiplier}
                      </span>
                    </li>
                    <li className="flex justify-between gap-4">
                      <span>Buffer</span>
                      <span className="text-foreground">
                        +{quote.buffer_minutes} min
                      </span>
                    </li>
                  </ul>
                </section>
              ) : null}

              {quote && requestedHours != null ? (
                <section className="flex flex-col gap-3">
                  <Label>Your requested hours</Label>
                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      aria-label="Decrease hours"
                      onClick={() => adjustHours(-0.5)}
                    >
                      <Minus className="size-4" />
                    </Button>
                    <div className="min-w-[5rem] text-center text-lg font-semibold">
                      {formatHours(requestedHours)} hrs
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      aria-label="Increase hours"
                      onClick={() => adjustHours(0.5)}
                    >
                      <Plus className="size-4" />
                    </Button>
                  </div>
                  {rangeAlert ? (
                    <p role="alert" className="text-sm text-destructive">
                      {rangeAlert}
                    </p>
                  ) : null}
                  {belowRecommended ? (
                    <p className="rounded-lg border border-amber-300/50 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                      You selected less than the recommended time. The cleaner
                      will prioritize the most important tasks, but full
                      completion may not be guaranteed.
                    </p>
                  ) : null}
                </section>
              ) : null}

              {pricing ? (
                <div className="rounded-lg border border-[#00695C]/20 bg-[#00695C]/5 px-4 py-3 text-sm">
                  <p className="font-semibold text-gray-900">Estimated total</p>
                  <dl className="mt-2 space-y-1.5 text-muted-foreground">
                    <div className="flex justify-between gap-4">
                      <dt>Service price</dt>
                      <dd className="text-foreground">
                        {formatUsd(pricing.base_price)}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt>Platform fee ({serviceFeePercent}%)</dt>
                      <dd className="text-foreground">
                        {formatUsd(pricing.platform_fee)}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4 border-t border-[#00695C]/10 pt-2 font-semibold text-gray-900">
                      <dt>Total</dt>
                      <dd>{formatUsd(pricing.total_price)}</dd>
                    </div>
                  </dl>
                </div>
              ) : hourlyRate != null ? (
                <p className="text-sm text-muted-foreground">
                  Complete the cleaning scope to see your total.
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  This cleaner has not set an hourly rate yet.
                </p>
              )}
            </>
          ) : null}

          {step === 3 ? (
            <>
              <div className="rounded-lg border bg-muted/40 px-4 py-3 text-sm">
                <p className="font-medium text-foreground">Cleaner</p>
                <p className="mt-1 text-muted-foreground">{cleanerName}</p>
              </div>

              <section className="flex flex-col gap-3 text-sm">
                <h3 className="font-semibold text-foreground">Scope summary</h3>
                <dl className="space-y-2 text-muted-foreground">
                  <div className="flex justify-between gap-4">
                    <dt>Visit</dt>
                    <dd className="text-foreground">
                      {getVisitTypeLabel(visitType)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt>Service</dt>
                    <dd className="text-foreground">
                      {getServiceTypeLabel(serviceType)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt>Home</dt>
                    <dd className="text-right text-foreground">
                      {getHomeTypeLabel(homeType)}, {bedrooms} bed /{" "}
                      {bathrooms} bath, {getSquareFeetRangeLabel(squareFeetRange)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt>Areas</dt>
                    <dd className="text-right text-foreground">
                      {selectedAreas.join(", ")}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt>Condition</dt>
                    <dd className="text-right text-foreground">
                      {getHomeConditionLabel(homeCondition)},{" "}
                      {getClutterLevelLabel(clutterLevel)} clutter
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt>Kitchen / bathroom</dt>
                    <dd className="text-right text-foreground">
                      {getAreaConditionLabel(kitchenCondition)} /{" "}
                      {getAreaConditionLabel(bathroomCondition)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt>Pet hair / floors</dt>
                    <dd className="text-right text-foreground">
                      {getPetHairLevelLabel(petHairLevel)},{" "}
                      {getFloorTypeLabel(floorType)}
                    </dd>
                  </div>
                  {lastCleaned ? (
                    <div className="flex justify-between gap-4">
                      <dt>Last cleaned</dt>
                      <dd className="text-foreground">
                        {getLastCleanedLabel(lastCleaned)}
                      </dd>
                    </div>
                  ) : null}
                  {extraTasks.length > 0 ? (
                    <div className="flex justify-between gap-4">
                      <dt>Extra tasks</dt>
                      <dd className="text-right text-foreground">
                        {extraTasks.map(getExtraTaskLabel).join(", ")}
                      </dd>
                    </div>
                  ) : null}
                </dl>
              </section>

              <section className="flex flex-col gap-3 text-sm">
                <h3 className="font-semibold text-foreground">Time & price</h3>
                <dl className="space-y-2 text-muted-foreground">
                  <div className="flex justify-between gap-4">
                    <dt>Recommended hours</dt>
                    <dd className="text-foreground">
                      {quote ? formatHours(quote.recommended_hours) : "—"} hrs
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt>Requested hours</dt>
                    <dd className="text-foreground">
                      {requestedHours != null
                        ? `${formatHours(requestedHours)} hrs`
                        : "—"}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt>Hourly rate</dt>
                    <dd className="text-foreground">
                      {formatHourlyRate(hourlyRate)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4 font-semibold text-gray-900">
                    <dt>Total</dt>
                    <dd>{pricing ? formatUsd(pricing.total_price) : "—"}</dd>
                  </div>
                </dl>
              </section>

              <p className="rounded-lg border border-[#00695C]/20 bg-[#00695C]/5 px-4 py-3 text-sm text-muted-foreground">
                Your request is based on the scope and condition details you
                submitted. The cleaner can accept, decline, or suggest an
                adjustment before the booking is confirmed.
              </p>

              <section className="flex flex-col gap-4">
                <h3 className="text-sm font-semibold text-foreground">
                  When &amp; where
                </h3>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="service_address">Service address</Label>
                  <Input
                    id="service_address"
                    type="text"
                    autoComplete="street-address"
                    required
                    placeholder="123 Main St, Austin, TX"
                    value={serviceAddress}
                    onChange={(event) => setServiceAddress(event.target.value)}
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      required
                      value={date}
                      onChange={(event) => setDate(event.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="time">Time</Label>
                    <Input
                      id="time"
                      type="time"
                      required
                      value={time}
                      onChange={(event) => setTime(event.target.value)}
                    />
                  </div>
                </div>
              </section>

              {specialRequests ? (
                <section className="text-sm">
                  <h3 className="font-semibold text-foreground">
                    Special requests
                  </h3>
                  <p className="mt-2 whitespace-pre-wrap text-muted-foreground">
                    {specialRequests}
                  </p>
                </section>
              ) : null}
            </>
          ) : null}
        </CardContent>

        <CardFooter className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
          {step > 1 ? (
            <Button type="button" variant="outline" onClick={goBack}>
              Back
            </Button>
          ) : (
            <span />
          )}
          {step < 3 ? (
            <Button type="button" onClick={goNext} className="sm:ml-auto">
              Continue
            </Button>
          ) : (
            <SubmitButton disabled={!canSubmit} />
          )}
        </CardFooter>
      </form>
    </Card>
  );
}
