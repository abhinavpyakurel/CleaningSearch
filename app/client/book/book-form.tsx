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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  computeBookingPricing,
  formatHourlyRate,
  formatUsd,
  PLATFORM_SERVICE_FEE_RATE,
} from "@/lib/booking-price";
import {
  estimateIntake,
  EXTRA_TASKS,
  getExtraTaskLabel,
  getMessLevelLabel,
  getServiceTypeLabel,
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

const initialState: BookActionState = {};

const HOME_TYPE_LABELS: Record<HomeType, string> = {
  apartment: "Apartment",
  house: "House",
  condo: "Condo",
  townhouse: "Townhouse",
};

const SQUARE_FEET_LABELS: Record<SquareFeetRange, string> = {
  under_800: "Under 800 sq ft",
  "800_1500": "800–1,500 sq ft",
  "1500_2500": "1,500–2,500 sq ft",
  "2500_plus": "2,500+ sq ft",
};

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="w-full" disabled={pending || disabled}>
      {pending ? "Submitting…" : "Request booking"}
    </Button>
  );
}

type BookFormProps = {
  cleanerId: string;
  cleanerName: string;
  hourlyRate: number | null;
};

function formatHours(hours: number): string {
  return Number.isInteger(hours) ? String(hours) : hours.toFixed(1);
}

export function BookForm({
  cleanerId,
  cleanerName,
  hourlyRate,
}: BookFormProps) {
  const [state, formAction] = useFormState(createBookingAction, initialState);

  const [homeType, setHomeType] = useState<HomeType>("house");
  const [bedrooms, setBedrooms] = useState("2");
  const [bathrooms, setBathrooms] = useState("1");
  const [squareFeetRange, setSquareFeetRange] =
    useState<SquareFeetRange>("800_1500");
  const [serviceType, setServiceType] = useState<ServiceType>("standard");
  const [messLevel, setMessLevel] = useState<MessLevel>("normal");
  const [hasPets, setHasPets] = useState(false);
  const [suppliesNeeded, setSuppliesNeeded] = useState(false);
  const [extraTasks, setExtraTasks] = useState<ExtraTask[]>([]);
  const [specialRequests, setSpecialRequests] = useState("");
  const [requestedHours, setRequestedHours] = useState<number | null>(null);
  const [rangeAlert, setRangeAlert] = useState<string | null>(null);

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
      home_type: homeType,
      bedrooms: bedroomCount,
      bathrooms: bathroomCount,
      square_feet_range: squareFeetRange,
      service_type: serviceType,
      mess_level: messLevel,
      has_pets: hasPets,
      supplies_needed: suppliesNeeded,
      extra_tasks: extraTasks,
    };
  }, [
    homeType,
    bedrooms,
    bathrooms,
    squareFeetRange,
    serviceType,
    messLevel,
    hasPets,
    suppliesNeeded,
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

  const canSubmit =
    quote != null &&
    requestedHours != null &&
    requestedHours >= quote.minimum_hours &&
    requestedHours <= quote.maximum_hours &&
    hourlyRate != null &&
    hourlyRate > 0;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl">Book a cleaning</CardTitle>
        <CardDescription>
          Booking with {cleanerName}. Describe your home and we&apos;ll
          recommend how long the clean should take.
        </CardDescription>
      </CardHeader>
      <form action={formAction} noValidate={false}>
        <input type="hidden" name="cleaner_id" value={cleanerId} />
        <input type="hidden" name="home_type" value={homeType} />
        <input type="hidden" name="square_feet_range" value={squareFeetRange} />
        <input type="hidden" name="service_type" value={serviceType} />
        <input type="hidden" name="mess_level" value={messLevel} />
        <input type="hidden" name="has_pets" value={hasPets ? "true" : "false"} />
        <input
          type="hidden"
          name="supplies_needed"
          value={suppliesNeeded ? "true" : "false"}
        />
        {requestedHours != null ? (
          <input
            type="hidden"
            name="client_requested_hours"
            value={String(requestedHours)}
          />
        ) : null}

        <CardContent className="flex flex-col gap-6">
          {state.error ? (
            <p
              role="alert"
              className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {state.error}
            </p>
          ) : null}

          <div className="rounded-lg border bg-muted/40 px-4 py-3 text-sm">
            <p className="font-medium text-foreground">Cleaner</p>
            <p className="mt-1 text-muted-foreground">{cleanerName}</p>
            <p className="mt-2 font-medium text-foreground">Hourly rate</p>
            <p className="mt-1 text-muted-foreground">
              {formatHourlyRate(hourlyRate)}
            </p>
          </div>

          <section className="flex flex-col gap-4">
            <h3 className="text-sm font-semibold text-foreground">
              Cleaning scope
            </h3>

            <div className="flex flex-col gap-2">
              <Label htmlFor="home_type">Home type</Label>
              <select
                id="home_type"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                value={homeType}
                onChange={(event) =>
                  setHomeType(event.target.value as HomeType)
                }
              >
                {HOME_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {HOME_TYPE_LABELS[type]}
                  </option>
                ))}
              </select>
            </div>

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

            <div className="flex flex-col gap-2">
              <Label htmlFor="square_feet_range">Home size</Label>
              <select
                id="square_feet_range"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                value={squareFeetRange}
                onChange={(event) =>
                  setSquareFeetRange(event.target.value as SquareFeetRange)
                }
              >
                {SQUARE_FEET_RANGES.map((range) => (
                  <option key={range} value={range}>
                    {SQUARE_FEET_LABELS[range]}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="service_type">Service type</Label>
                <select
                  id="service_type"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  value={serviceType}
                  onChange={(event) =>
                    setServiceType(event.target.value as ServiceType)
                  }
                >
                  {SERVICE_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {getServiceTypeLabel(type)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="mess_level">Mess level</Label>
                <select
                  id="mess_level"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  value={messLevel}
                  onChange={(event) =>
                    setMessLevel(event.target.value as MessLevel)
                  }
                >
                  {MESS_LEVELS.map((level) => (
                    <option key={level} value={level}>
                      {getMessLevelLabel(level)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-4">
                <Label htmlFor="has_pets">Pets in the home</Label>
                <Switch
                  id="has_pets"
                  checked={hasPets}
                  onCheckedChange={setHasPets}
                />
              </div>
              <div className="flex items-center justify-between gap-4">
                <Label htmlFor="supplies_needed">Cleaner should bring supplies</Label>
                <Switch
                  id="supplies_needed"
                  checked={suppliesNeeded}
                  onCheckedChange={setSuppliesNeeded}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label>Extra tasks</Label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {EXTRA_TASKS.map((task) => (
                  <label
                    key={task}
                    className="flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      name="extra_tasks"
                      value={task}
                      checked={extraTasks.includes(task)}
                      onChange={() => toggleExtraTask(task)}
                      className="size-4 rounded border-input"
                    />
                    <span>{getExtraTaskLabel(task)}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="special_requests">Special requests (optional)</Label>
              <Textarea
                id="special_requests"
                name="special_requests"
                rows={3}
                placeholder="Access instructions, focus areas, allergies…"
                value={specialRequests}
                onChange={(event) => setSpecialRequests(event.target.value)}
              />
            </div>
          </section>

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
                    Subtotal before multipliers ({quote.total_minutes_before_multipliers}{" "}
                    min)
                  </span>
                </li>
                <li className="flex justify-between gap-4">
                  <span>Service type multiplier</span>
                  <span className="text-foreground">
                    ×{quote.service_type_multiplier}
                  </span>
                </li>
                <li className="flex justify-between gap-4">
                  <span>Mess level multiplier</span>
                  <span className="text-foreground">
                    ×{quote.mess_level_multiplier}
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
                  You selected less than the recommended time. The cleaner will
                  prioritize the most important tasks, but full completion may
                  not be guaranteed.
                </p>
              ) : null}
            </section>
          ) : null}

          <section className="flex flex-col gap-4">
            <h3 className="text-sm font-semibold text-foreground">
              When &amp; where
            </h3>

            <div className="flex flex-col gap-2">
              <Label htmlFor="service_address">Service address</Label>
              <Input
                id="service_address"
                name="service_address"
                type="text"
                autoComplete="street-address"
                required
                placeholder="123 Main St, Austin, TX"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="date">Date</Label>
                <Input id="date" name="date" type="date" required />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="time">Time</Label>
                <Input id="time" name="time" type="time" required />
              </div>
            </div>
          </section>

          {pricing ? (
            <div className="rounded-lg border border-[#00695C]/20 bg-[#00695C]/5 px-4 py-3 text-sm">
              <p className="font-semibold text-gray-900">Estimated total</p>
              <dl className="mt-2 space-y-1.5 text-muted-foreground">
                <div className="flex justify-between gap-4">
                  <dt>Cleaner labor</dt>
                  <dd className="text-foreground">
                    {formatUsd(pricing.base_price)}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt>Service fee ({serviceFeePercent}%)</dt>
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
        </CardContent>
        <CardFooter>
          <SubmitButton disabled={!canSubmit} />
        </CardFooter>
      </form>
    </Card>
  );
}
