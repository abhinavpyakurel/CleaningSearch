"use client";

import { Minus, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";

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
  areaConditionToHomeCondition,
  estimateIntake,
  EXTRA_TASKS,
  getAreaConditionLabel,
  getExtraTaskLabel,
  getHomeTypeLabel,
  getPetHairLevelLabel,
  getServiceTypeLabel,
  getUiLastCleanedLabel,
  getUiSquareFeetLabel,
  getVisitTypeLabel,
  PET_HAIR_LEVELS,
  SERVICE_TYPES,
  uiLastCleanedToValue,
  uiSquareFeetToRange,
  UI_LAST_CLEANED_OPTIONS,
  VISIT_TYPES,
  type AreaCondition,
  type ExtraTask,
  type HomeCondition,
  type HomeType,
  type IntakeInput,
  type LastCleaned,
  type PetHairLevel,
  type ServiceType,
  type SquareFeetRange,
  type UiLastCleaned,
  type UiSquareFeetRange,
  type VisitType,
} from "@/lib/intake-estimate";
import {
  BOOKING_PHOTO_ACCEPT,
  MAX_BOOKING_PHOTOS,
  uploadBookingPhotosForBooking,
  validateBookingPhotoFile,
} from "@/lib/booking-photos";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const initialState: BookActionState = {};

const STEPS = [
  { id: 1, label: "Scope" },
  { id: 2, label: "Time & Price" },
  { id: 3, label: "Review" },
] as const;

const BOOKING_HOME_TYPES: HomeType[] = ["apartment", "house", "townhouse"];

type AreaSize = "small" | "normal" | "large";
type LivingAreaSize = AreaSize | "open_plan";
type BathroomType = "half" | "full" | "master";

const AREA_SIZE_OPTIONS: { value: AreaSize; label: string }[] = [
  { value: "small", label: "Small" },
  { value: "normal", label: "Normal" },
  { value: "large", label: "Large" },
];

const LIVING_SIZE_OPTIONS: { value: LivingAreaSize; label: string }[] = [
  { value: "small", label: "Small" },
  { value: "normal", label: "Normal" },
  { value: "large", label: "Large" },
  { value: "open_plan", label: "Open plan" },
];

const BATHROOM_TYPE_OPTIONS: { value: BathroomType; label: string }[] = [
  { value: "half", label: "Half bath" },
  { value: "full", label: "Full bath" },
  { value: "master", label: "Master bath" },
];

const AREA_OPTIONS = [
  { key: "bedrooms" as const, label: "Bedrooms" },
  { key: "bathrooms" as const, label: "Bathrooms" },
  { key: "kitchen" as const, label: "Kitchen" },
  { key: "living" as const, label: "Living areas" },
  { key: "hallways" as const, label: "Hallways" },
];

function formatHours(hours: number): string {
  return Number.isInteger(hours) ? String(hours) : hours.toFixed(1);
}

function formatAreaSize(size: AreaSize | LivingAreaSize): string {
  return LIVING_SIZE_OPTIONS.find((o) => o.value === size)?.label ?? size;
}

function formatBathroomType(type: BathroomType): string {
  return BATHROOM_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? type;
}

function SubmitButton({
  disabled,
  pending,
}: {
  disabled: boolean;
  pending: boolean;
}) {
  return (
    <Button type="submit" className="w-full sm:w-auto" disabled={pending || disabled}>
      {pending ? "Submitting…" : "Send request"}
    </Button>
  );
}

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <nav aria-label="Booking progress" className="text-sm">
      <ol className="flex flex-wrap items-center gap-1.5 text-muted-foreground">
        {STEPS.map((step, index) => (
          <li key={step.id} className="flex items-center gap-1.5">
            <span
              className={cn(
                "font-medium",
                currentStep === step.id
                  ? "text-[#00695C]"
                  : currentStep > step.id
                    ? "text-foreground"
                    : "text-muted-foreground"
              )}
            >
              {step.id} {step.label}
            </span>
            {index < STEPS.length - 1 ? (
              <span aria-hidden className="text-muted-foreground/60">
                →
              </span>
            ) : null}
          </li>
        ))}
      </ol>
    </nav>
  );
}

function SectionHeading({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {description ? (
        <p className="text-sm text-muted-foreground">{description}</p>
      ) : null}
    </div>
  );
}

function PillGroup<T extends string>({
  label,
  value,
  options,
  onChange,
  columns = 2,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  columns?: 2 | 3 | 4 | 5;
}) {
  const gridClass =
    columns === 5
      ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5"
      : columns === 4
        ? "grid-cols-2 sm:grid-cols-4"
        : columns === 3
          ? "grid-cols-1 sm:grid-cols-3"
          : "grid-cols-1 sm:grid-cols-2";

  return (
    <fieldset className="flex flex-col gap-2.5">
      <legend className="text-sm font-medium text-foreground">{label}</legend>
      <div className={cn("grid gap-2", gridClass)}>
        {options.map((option) => {
          const selected = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(option.value)}
              className={cn(
                "rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors",
                selected
                  ? "border-[#00695C] bg-[#00695C]/10 text-[#00695C] ring-1 ring-[#00695C]/30"
                  : "border-border bg-background text-foreground hover:border-[#00695C]/40 hover:bg-muted/50"
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function ToggleCard({
  label,
  selected,
  onToggle,
}: {
  label: string;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onToggle}
      className={cn(
        "rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors",
        selected
          ? "border-[#00695C] bg-[#00695C]/10 text-[#00695C] ring-1 ring-[#00695C]/30"
          : "border-border bg-background text-foreground hover:border-[#00695C]/40 hover:bg-muted/50"
      )}
    >
      {label}
    </button>
  );
}

function CountStepper({
  label,
  value,
  min,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label={`Decrease ${label.toLowerCase()}`}
          disabled={value <= min}
          onClick={() => onChange(Math.max(min, value - 1))}
        >
          <Minus className="size-4" />
        </Button>
        <span className="min-w-[2.5rem] text-center text-lg font-semibold">
          {value}
        </span>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label={`Increase ${label.toLowerCase()}`}
          onClick={() => onChange(value + 1)}
        >
          <Plus className="size-4" />
        </Button>
      </div>
    </div>
  );
}

function AreaDetailPanel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border/80 bg-muted/30 p-4">
      <p className="mb-3 text-sm font-semibold text-foreground">{title}</p>
      <div className="flex flex-col gap-4">{children}</div>
    </div>
  );
}

type SelectedPhoto = {
  id: string;
  file: File;
  previewUrl: string;
};

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
  const router = useRouter();
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdBookingId, setCreatedBookingId] = useState<string | null>(null);
  const [selectedPhotos, setSelectedPhotos] = useState<SelectedPhoto[]>([]);
  const [photoPickerError, setPhotoPickerError] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [stepError, setStepError] = useState<string | null>(null);

  const [visitType, setVisitType] = useState<VisitType>("first_clean");
  const [serviceType, setServiceType] = useState<ServiceType>("standard");
  const [homeType, setHomeType] = useState<HomeType>("house");
  const uiSquareFeet: UiSquareFeetRange = "500_1k";
  const [petHairLevel, setPetHairLevel] = useState<PetHairLevel>("none");
  const [uiLastCleaned, setUiLastCleaned] =
    useState<UiLastCleaned>("this_month");

  const [cleanBedrooms, setCleanBedrooms] = useState(false);
  const [cleanBathrooms, setCleanBathrooms] = useState(false);
  const [cleanKitchen, setCleanKitchen] = useState(false);
  const [cleanCommonArea, setCleanCommonArea] = useState(false);
  const [cleanHallways, setCleanHallways] = useState(false);

  const [bedroomCount, setBedroomCount] = useState(2);
  const [bathroomCount, setBathroomCount] = useState(1);
  const [bedroomSize, setBedroomSize] = useState<AreaSize>("normal");
  const [bedroomCondition, setBedroomCondition] =
    useState<AreaCondition>("normal");
  const [bathroomType, setBathroomType] = useState<BathroomType>("full");
  const [bathroomCondition, setBathroomCondition] =
    useState<AreaCondition>("normal");
  const [kitchenSize, setKitchenSize] = useState<AreaSize>("normal");
  const [kitchenCondition, setKitchenCondition] =
    useState<AreaCondition>("normal");
  const [livingAreaSize, setLivingAreaSize] =
    useState<LivingAreaSize>("normal");
  const [livingAreaCondition, setLivingAreaCondition] =
    useState<AreaCondition>("normal");
  const [hallwaySize, setHallwaySize] = useState<AreaSize>("normal");

  const [extraTasks, setExtraTasks] = useState<ExtraTask[]>([]);
  const [suppliesNeeded, setSuppliesNeeded] = useState(false);
  const [specialRequests, setSpecialRequests] = useState("");
  const [requestedHours, setRequestedHours] = useState<number | null>(null);
  const [rangeAlert, setRangeAlert] = useState<string | null>(null);
  const [serviceAddress, setServiceAddress] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  const squareFeetRange: SquareFeetRange = uiSquareFeetToRange(uiSquareFeet);
  const lastCleaned: LastCleaned = uiLastCleanedToValue(uiLastCleaned);

  const homeCondition: HomeCondition = useMemo(() => {
    if (cleanBedrooms) {
      return areaConditionToHomeCondition(bedroomCondition);
    }
    if (cleanCommonArea) {
      return areaConditionToHomeCondition(livingAreaCondition);
    }
    return "some_buildup";
  }, [cleanBedrooms, bedroomCondition, cleanCommonArea, livingAreaCondition]);

  const scopeUiExtras = useMemo(
    () => ({
      bedroom_size: cleanBedrooms ? bedroomSize : null,
      bedroom_condition: cleanBedrooms ? bedroomCondition : null,
      bathroom_type: cleanBathrooms ? bathroomType : null,
      bathroom_condition: cleanBathrooms ? bathroomCondition : null,
      kitchen_size: cleanKitchen ? kitchenSize : null,
      kitchen_condition: cleanKitchen ? kitchenCondition : null,
      living_area_size: cleanCommonArea ? livingAreaSize : null,
      living_area_condition: cleanCommonArea ? livingAreaCondition : null,
      hallway_size: cleanHallways ? hallwaySize : null,
    }),
    [
      cleanBedrooms,
      bedroomSize,
      bedroomCondition,
      cleanBathrooms,
      bathroomType,
      bathroomCondition,
      cleanKitchen,
      kitchenSize,
      kitchenCondition,
      cleanCommonArea,
      livingAreaSize,
      livingAreaCondition,
      cleanHallways,
      hallwaySize,
    ]
  );

  const intakeInput = useMemo((): IntakeInput | null => {
    const bedrooms = cleanBedrooms ? bedroomCount : 0;
    const bathrooms = cleanBathrooms ? bathroomCount : 0;

    if (
      (cleanBedrooms && (bedrooms < 1 || !Number.isInteger(bedrooms))) ||
      (cleanBathrooms && (bathrooms < 1 || !Number.isFinite(bathrooms)))
    ) {
      return null;
    }

    return {
      visit_type: visitType,
      service_type: serviceType,
      home_type: homeType,
      bedrooms,
      bathrooms,
      square_feet_range: squareFeetRange,
      clean_bedrooms: cleanBedrooms,
      clean_bathrooms: cleanBathrooms,
      clean_kitchen: cleanKitchen,
      clean_common_area: cleanCommonArea,
      clean_hallways: cleanHallways,
      clean_floors: false,
      home_condition: homeCondition,
      bedroom_size: cleanBedrooms ? bedroomSize : undefined,
      bedroom_condition: cleanBedrooms ? bedroomCondition : undefined,
      bathroom_type: cleanBathrooms ? bathroomType : undefined,
      kitchen_size: cleanKitchen ? kitchenSize : undefined,
      living_area_size: cleanCommonArea ? livingAreaSize : undefined,
      hallway_size: cleanHallways ? hallwaySize : undefined,
      kitchen_condition: kitchenCondition,
      bathroom_condition: bathroomCondition,
      common_area_condition: livingAreaCondition,
      pet_hair_level: petHairLevel,
      last_cleaned: lastCleaned,
      floor_type: "mixed",
      extra_tasks: extraTasks,
    };
  }, [
    visitType,
    serviceType,
    homeType,
    cleanBedrooms,
    bedroomCount,
    cleanBathrooms,
    bathroomCount,
    squareFeetRange,
    cleanKitchen,
    cleanCommonArea,
    cleanHallways,
    homeCondition,
    bedroomSize,
    bedroomCondition,
    bathroomType,
    kitchenSize,
    livingAreaSize,
    hallwaySize,
    kitchenCondition,
    bathroomCondition,
    livingAreaCondition,
    petHairLevel,
    lastCleaned,
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

  useEffect(() => {
    return () => {
      selectedPhotos.forEach((photo) => URL.revokeObjectURL(photo.previewUrl));
    };
  }, [selectedPhotos]);

  function handlePhotoSelection(event: React.ChangeEvent<HTMLInputElement>) {
    setPhotoPickerError(null);
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";

    if (files.length === 0) {
      return;
    }

    const availableSlots = MAX_BOOKING_PHOTOS - selectedPhotos.length;
    if (availableSlots <= 0) {
      setPhotoPickerError(`You can add up to ${MAX_BOOKING_PHOTOS} photos.`);
      return;
    }

    const nextPhotos: SelectedPhoto[] = [];
    for (const file of files.slice(0, availableSlots)) {
      const validationError = validateBookingPhotoFile(file);
      if (validationError) {
        setPhotoPickerError(validationError);
        continue;
      }

      nextPhotos.push({
        id: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file),
      });
    }

    if (nextPhotos.length === 0) {
      return;
    }

    if (files.length > availableSlots) {
      setPhotoPickerError(`You can add up to ${MAX_BOOKING_PHOTOS} photos.`);
    }

    setSelectedPhotos((current) => [...current, ...nextPhotos]);
  }

  function removePhoto(photoId: string) {
    setSelectedPhotos((current) => {
      const photo = current.find((item) => item.id === photoId);
      if (photo) {
        URL.revokeObjectURL(photo.previewUrl);
      }
      return current.filter((item) => item.id !== photoId);
    });
    setPhotoPickerError(null);
  }

  async function handleFormSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (step !== 3 || !canSubmit || isSubmitting || createdBookingId) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    const formData = new FormData(event.currentTarget);
    const result = await createBookingAction(initialState, formData);

    if (result.error) {
      setSubmitError(result.error);
      setIsSubmitting(false);
      return;
    }

    if (!result.bookingId) {
      setSubmitError("Booking was created but no booking ID was returned.");
      setIsSubmitting(false);
      return;
    }

    if (selectedPhotos.length === 0) {
      router.push(`/client/book/confirm?booking_id=${result.bookingId}`);
      return;
    }

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setSubmitError(
        "Your booking was created, but your session expired before photos could upload. Please sign in and check your bookings."
      );
      setCreatedBookingId(result.bookingId);
      setIsSubmitting(false);
      return;
    }

    const uploadResult = await uploadBookingPhotosForBooking(
      supabase,
      result.bookingId,
      user.id,
      selectedPhotos.map((photo) => photo.file)
    );

    if (uploadResult.error) {
      setSubmitError(
        `Your booking was created, but photo upload failed: ${uploadResult.error}`
      );
      setCreatedBookingId(result.bookingId);
      setIsSubmitting(false);
      return;
    }

    router.push(`/client/book/confirm?booking_id=${result.bookingId}`);
  }

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

  function toggleArea(
    key: (typeof AREA_OPTIONS)[number]["key"],
    next: boolean
  ) {
    switch (key) {
      case "bedrooms":
        setCleanBedrooms(next);
        if (next && bedroomCount < 1) {
          setBedroomCount(1);
        }
        break;
      case "bathrooms":
        setCleanBathrooms(next);
        if (next && bathroomCount < 1) {
          setBathroomCount(1);
        }
        break;
      case "kitchen":
        setCleanKitchen(next);
        break;
      case "living":
        setCleanCommonArea(next);
        break;
      case "hallways":
        setCleanHallways(next);
        break;
    }
  }

  function isAreaSelected(key: (typeof AREA_OPTIONS)[number]["key"]): boolean {
    switch (key) {
      case "bedrooms":
        return cleanBedrooms;
      case "bathrooms":
        return cleanBathrooms;
      case "kitchen":
        return cleanKitchen;
      case "living":
        return cleanCommonArea;
      case "hallways":
        return cleanHallways;
    }
  }

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
    if (
      !cleanBedrooms &&
      !cleanBathrooms &&
      !cleanKitchen &&
      !cleanCommonArea &&
      !cleanHallways
    ) {
      return "Select at least one area to clean.";
    }
    if (cleanBedrooms && bedroomCount < 1) {
      return "Select at least 1 bedroom to clean.";
    }
    if (cleanBathrooms && bathroomCount < 1) {
      return "Select at least 1 bathroom to clean.";
    }
    if (!intakeInput) {
      return "Complete the cleaning scope details.";
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
    cleanCommonArea ? "Living areas" : null,
    cleanHallways ? "Hallways" : null,
  ].filter(Boolean) as string[];

  const canSubmit = validateStep3() === null;
  const bedroomsHidden = cleanBedrooms ? String(bedroomCount) : "0";
  const bathroomsHidden = cleanBathrooms ? String(bathroomCount) : "0";

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

      <form
        noValidate
        onSubmit={handleFormSubmit}
      >
        <input type="hidden" name="cleaner_id" value={cleanerId} />
        <input type="hidden" name="bedrooms" value={bedroomsHidden} />
        <input type="hidden" name="bathrooms" value={bathroomsHidden} />
        <input type="hidden" name="visit_type" value={visitType} />
        <input type="hidden" name="home_type" value={homeType} />
        <input type="hidden" name="square_feet_range" value={squareFeetRange} />
        <input type="hidden" name="service_type" value={serviceType} />
        <input type="hidden" name="home_condition" value={homeCondition} />
        <input type="hidden" name="bedroom_size" value={bedroomSize} />
        <input type="hidden" name="bedroom_condition" value={bedroomCondition} />
        <input type="hidden" name="bathroom_type" value={bathroomType} />
        <input type="hidden" name="kitchen_size" value={kitchenSize} />
        <input type="hidden" name="living_area_size" value={livingAreaSize} />
        <input type="hidden" name="hallway_size" value={hallwaySize} />
        <input
          type="hidden"
          name="common_area_condition"
          value={livingAreaCondition}
        />
        <input type="hidden" name="kitchen_condition" value={kitchenCondition} />
        <input
          type="hidden"
          name="bathroom_condition"
          value={bathroomCondition}
        />
        <input type="hidden" name="pet_hair_level" value={petHairLevel} />
        <input type="hidden" name="floor_type" value="mixed" />
        <input type="hidden" name="last_cleaned" value={lastCleaned} />
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
        <input type="hidden" name="clean_floors" value="false" />
        <input
          type="hidden"
          name="supplies_needed"
          value={suppliesNeeded ? "true" : "false"}
        />
        <input
          type="hidden"
          name="scope_ui_extras"
          value={JSON.stringify(scopeUiExtras)}
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

        <CardContent className="flex flex-col gap-8">
          {submitError ? (
            <p
              role="alert"
              className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {submitError}
              {createdBookingId ? (
                <>
                  {" "}
                  <a
                    href={`/client/book/confirm?booking_id=${createdBookingId}`}
                    className="font-medium underline underline-offset-2"
                  >
                    Continue without photos
                  </a>
                </>
              ) : null}
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
              <section className="flex flex-col gap-6">
                <PillGroup
                  label="Visit type"
                  value={visitType}
                  onChange={setVisitType}
                  columns={2}
                  options={VISIT_TYPES.map((type) => ({
                    value: type,
                    label: getVisitTypeLabel(type),
                  }))}
                />
                <PillGroup
                  label="Service type"
                  value={serviceType}
                  onChange={setServiceType}
                  columns={3}
                  options={SERVICE_TYPES.map((type) => ({
                    value: type,
                    label: getServiceTypeLabel(type),
                  }))}
                />
                <PillGroup
                  label="Home type"
                  value={homeType}
                  onChange={setHomeType}
                  columns={3}
                  options={BOOKING_HOME_TYPES.map((type) => ({
                    value: type,
                    label: getHomeTypeLabel(type),
                  }))}
                />
              </section>

              <section className="flex flex-col gap-3">
                <SectionHeading
                  title="Areas to clean"
                  description="Select at least one. Only chosen areas are included in the time estimate."
                />
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {AREA_OPTIONS.map((area) => (
                    <ToggleCard
                      key={area.key}
                      label={area.label}
                      selected={isAreaSelected(area.key)}
                      onToggle={() =>
                        toggleArea(area.key, !isAreaSelected(area.key))
                      }
                    />
                  ))}
                </div>
              </section>

              {(cleanBedrooms ||
                cleanBathrooms ||
                cleanKitchen ||
                cleanCommonArea ||
                cleanHallways) && (
                <section className="flex flex-col gap-3">
                  <SectionHeading title="Area details" />
                  <div className="flex flex-col gap-3">
                    {cleanBedrooms ? (
                      <AreaDetailPanel title="Bedrooms">
                        <CountStepper
                          label="Bedrooms to clean"
                          value={bedroomCount}
                          min={1}
                          onChange={setBedroomCount}
                        />
                        <PillGroup
                          label="Bedroom size"
                          value={bedroomSize}
                          onChange={setBedroomSize}
                          columns={3}
                          options={AREA_SIZE_OPTIONS}
                        />
                        <PillGroup
                          label="Bedroom condition"
                          value={bedroomCondition}
                          onChange={setBedroomCondition}
                          columns={3}
                          options={AREA_CONDITIONS.map((c) => ({
                            value: c,
                            label: getAreaConditionLabel(c),
                          }))}
                        />
                      </AreaDetailPanel>
                    ) : null}

                    {cleanBathrooms ? (
                      <AreaDetailPanel title="Bathrooms">
                        <CountStepper
                          label="Bathrooms to clean"
                          value={bathroomCount}
                          min={1}
                          onChange={setBathroomCount}
                        />
                        <PillGroup
                          label="Bathroom type"
                          value={bathroomType}
                          onChange={setBathroomType}
                          columns={3}
                          options={BATHROOM_TYPE_OPTIONS}
                        />
                        <PillGroup
                          label="Bathroom condition"
                          value={bathroomCondition}
                          onChange={setBathroomCondition}
                          columns={3}
                          options={AREA_CONDITIONS.map((c) => ({
                            value: c,
                            label: getAreaConditionLabel(c),
                          }))}
                        />
                      </AreaDetailPanel>
                    ) : null}

                    {cleanKitchen ? (
                      <AreaDetailPanel title="Kitchen">
                        <PillGroup
                          label="Kitchen size"
                          value={kitchenSize}
                          onChange={setKitchenSize}
                          columns={3}
                          options={AREA_SIZE_OPTIONS}
                        />
                        <PillGroup
                          label="Kitchen condition"
                          value={kitchenCondition}
                          onChange={setKitchenCondition}
                          columns={3}
                          options={AREA_CONDITIONS.map((c) => ({
                            value: c,
                            label: getAreaConditionLabel(c),
                          }))}
                        />
                      </AreaDetailPanel>
                    ) : null}

                    {cleanCommonArea ? (
                      <AreaDetailPanel title="Living areas">
                        <PillGroup
                          label="Living / common area size"
                          value={livingAreaSize}
                          onChange={setLivingAreaSize}
                          columns={2}
                          options={LIVING_SIZE_OPTIONS}
                        />
                        <PillGroup
                          label="Living / common area condition"
                          value={livingAreaCondition}
                          onChange={setLivingAreaCondition}
                          columns={3}
                          options={AREA_CONDITIONS.map((c) => ({
                            value: c,
                            label: getAreaConditionLabel(c),
                          }))}
                        />
                      </AreaDetailPanel>
                    ) : null}

                    {cleanHallways ? (
                      <AreaDetailPanel title="Hallways">
                        <PillGroup
                          label="Hallway size"
                          value={hallwaySize}
                          onChange={setHallwaySize}
                          columns={3}
                          options={AREA_SIZE_OPTIONS}
                        />
                      </AreaDetailPanel>
                    ) : null}
                  </div>
                </section>
              )}

              <section className="flex flex-col gap-6">
                <SectionHeading title="General condition" />
                <PillGroup
                  label="Pet hair"
                  value={petHairLevel}
                  onChange={setPetHairLevel}
                  columns={3}
                  options={PET_HAIR_LEVELS.map((level) => ({
                    value: level,
                    label: getPetHairLevelLabel(level),
                  }))}
                />
                <PillGroup
                  label="Last cleaned"
                  value={uiLastCleaned}
                  onChange={setUiLastCleaned}
                  columns={2}
                  options={UI_LAST_CLEANED_OPTIONS.map((option) => ({
                    value: option,
                    label: getUiLastCleanedLabel(option),
                  }))}
                />
              </section>

              <section className="flex flex-col gap-3">
                <SectionHeading title="Add-on tasks" />
                <div className="flex flex-wrap gap-2">
                  {EXTRA_TASKS.map((task) => {
                    const selected = extraTasks.includes(task);
                    return (
                      <button
                        key={task}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => toggleExtraTask(task)}
                        className={cn(
                          "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                          selected
                            ? "border-[#00695C] bg-[#00695C]/10 text-[#00695C]"
                            : "border-border bg-background hover:border-[#00695C]/40 hover:bg-muted/50"
                        )}
                      >
                        {getExtraTaskLabel(task)}
                      </button>
                    );
                  })}
                </div>
              </section>

              <section className="flex flex-col gap-3">
                <SectionHeading title="Supplies" />
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3">
                  <input
                    type="checkbox"
                    checked={suppliesNeeded}
                    onChange={(event) => setSuppliesNeeded(event.target.checked)}
                    className="mt-0.5 size-4 rounded border-input"
                  />
                  <span className="flex flex-col gap-1">
                    <span className="text-sm font-medium text-foreground">
                      Bring cleaning supplies
                    </span>
                    <span className="text-sm text-muted-foreground">
                      No change to the time or price estimate. Your cleaner will
                      know to bring supplies if selected.
                    </span>
                  </span>
                </label>
              </section>

              <section className="flex flex-col gap-2">
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
                  Shared with the cleaner. Does not change the price estimate.
                </p>
              </section>
            </>
          ) : null}

          {step === 2 ? (
            <>
              <div className="rounded-xl border bg-muted/40 px-4 py-3 text-sm">
                <p className="font-medium text-foreground">Cleaner hourly rate</p>
                <p className="mt-1 text-muted-foreground">
                  {formatHourlyRate(hourlyRate)}
                </p>
              </div>

              {quote ? (
                <section className="rounded-xl border border-[#00695C]/20 bg-[#00695C]/5 px-4 py-4 text-sm">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                    <p className="font-semibold text-foreground">
                      Recommended: {formatHours(quote.recommended_hours)} hours
                    </p>
                    <p className="text-muted-foreground">
                      Allowed: {formatHours(quote.minimum_hours)}–
                      {formatHours(quote.maximum_hours)} hours
                    </p>
                  </div>
                  <ul className="mt-4 space-y-1.5 text-muted-foreground">
                    {quote.breakdown.map((item) => (
                      <li
                        key={item.label}
                        className="flex justify-between gap-4"
                      >
                        <span>{item.label}</span>
                        <span className="shrink-0 text-foreground">
                          {item.minutes > 0 ? "+" : ""}
                          {item.minutes} min
                        </span>
                      </li>
                    ))}
                    <li className="flex justify-between gap-4 border-t border-[#00695C]/10 pt-2 text-xs">
                      <span>
                        Service ×{quote.service_type_multiplier}, visit ×
                        {quote.visit_type_multiplier}
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
                  <div className="flex items-center gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      aria-label="Decrease hours"
                      onClick={() => adjustHours(-0.5)}
                    >
                      <Minus className="size-4" />
                    </Button>
                    <div className="min-w-[6rem] text-center">
                      <span className="text-2xl font-semibold">
                        {formatHours(requestedHours)}
                      </span>
                      <span className="ml-1 text-sm text-muted-foreground">
                        hrs
                      </span>
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
                <div className="rounded-xl border border-[#00695C]/20 bg-[#00695C]/5 px-4 py-4 text-sm">
                  <p className="font-semibold text-foreground">Price breakdown</p>
                  <dl className="mt-3 space-y-2 text-muted-foreground">
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
                    <div className="flex justify-between gap-4 border-t border-[#00695C]/10 pt-2 text-base font-semibold text-foreground">
                      <dt>Estimated total</dt>
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
              <div className="rounded-xl border bg-muted/40 px-4 py-3 text-sm">
                <p className="font-medium text-foreground">Cleaner</p>
                <p className="mt-1 text-muted-foreground">{cleanerName}</p>
              </div>

              <section className="flex flex-col gap-3 text-sm">
                <h3 className="font-semibold text-foreground">Scope summary</h3>
                <dl className="space-y-2 rounded-xl border px-4 py-3 text-muted-foreground">
                  <div className="flex justify-between gap-4">
                    <dt>Visit</dt>
                    <dd className="text-right text-foreground">
                      {getVisitTypeLabel(visitType)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt>Service</dt>
                    <dd className="text-right text-foreground">
                      {getServiceTypeLabel(serviceType)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt>Home</dt>
                    <dd className="text-right text-foreground">
                      {getHomeTypeLabel(homeType)},{" "}
                      {getUiSquareFeetLabel(uiSquareFeet)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt>Areas</dt>
                    <dd className="text-right text-foreground">
                      {selectedAreas.join(", ")}
                    </dd>
                  </div>
                  {cleanBedrooms ? (
                    <div className="flex justify-between gap-4">
                      <dt>Bedrooms</dt>
                      <dd className="text-right text-foreground">
                        {bedroomCount} · {formatAreaSize(bedroomSize)} ·{" "}
                        {getAreaConditionLabel(bedroomCondition)}
                      </dd>
                    </div>
                  ) : null}
                  {cleanBathrooms ? (
                    <div className="flex justify-between gap-4">
                      <dt>Bathrooms</dt>
                      <dd className="text-right text-foreground">
                        {bathroomCount} · {formatBathroomType(bathroomType)} ·{" "}
                        {getAreaConditionLabel(bathroomCondition)}
                      </dd>
                    </div>
                  ) : null}
                  {cleanKitchen ? (
                    <div className="flex justify-between gap-4">
                      <dt>Kitchen</dt>
                      <dd className="text-right text-foreground">
                        {formatAreaSize(kitchenSize)} ·{" "}
                        {getAreaConditionLabel(kitchenCondition)}
                      </dd>
                    </div>
                  ) : null}
                  {cleanCommonArea ? (
                    <div className="flex justify-between gap-4">
                      <dt>Living areas</dt>
                      <dd className="text-right text-foreground">
                        {formatAreaSize(livingAreaSize)} ·{" "}
                        {getAreaConditionLabel(livingAreaCondition)}
                      </dd>
                    </div>
                  ) : null}
                  {cleanHallways ? (
                    <div className="flex justify-between gap-4">
                      <dt>Hallways</dt>
                      <dd className="text-right text-foreground">
                        {formatAreaSize(hallwaySize)}
                      </dd>
                    </div>
                  ) : null}
                  <div className="flex justify-between gap-4 border-t pt-2">
                    <dt>General</dt>
                    <dd className="text-right text-foreground">
                      {getPetHairLevelLabel(petHairLevel)} ·{" "}
                      {getUiLastCleanedLabel(uiLastCleaned)}
                    </dd>
                  </div>
                  {extraTasks.length > 0 ? (
                    <div className="flex justify-between gap-4">
                      <dt>Add-ons</dt>
                      <dd className="text-right text-foreground">
                        {extraTasks.map(getExtraTaskLabel).join(", ")}
                      </dd>
                    </div>
                  ) : null}
                  {suppliesNeeded ? (
                    <div className="flex justify-between gap-4">
                      <dt>Supplies</dt>
                      <dd className="text-foreground">Cleaner brings supplies</dd>
                    </div>
                  ) : null}
                </dl>
              </section>

              <section className="flex flex-col gap-3 text-sm">
                <h3 className="font-semibold text-foreground">Time & price</h3>
                <dl className="space-y-2 rounded-xl border px-4 py-3 text-muted-foreground">
                  <div className="flex justify-between gap-4">
                    <dt>Recommended hours</dt>
                    <dd className="text-foreground">
                      {quote ? formatHours(quote.recommended_hours) : "—"} hrs
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt>Requested hours</dt>
                    <dd className="text-foreground bg-gray-300 rounded p-0.5">
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
                  <div className="flex justify-between gap-4">
                    <dt>Service Fee (15% of hourly total)</dt>
                    <dd className="text-foreground">
                      {formatUsd(pricing?.platform_fee ?? 0)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4 border-t pt-2 font-semibold text-foreground">
                    <dt>Estimated total</dt>
                    <dd>{pricing ? formatUsd(pricing.total_price) : "—"}</dd>
                  </div>
                </dl>
              </section>

              <p className="rounded-xl border border-[#00695C]/20 bg-[#00695C]/5 px-4 py-3 text-sm text-muted-foreground">
                Your request is based on the scope and condition details you
                submitted. The cleaner can accept, decline, or suggest an
                adjustment before the booking is confirmed.
              </p>

              <section className="flex flex-col gap-3">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-2">
                  <Label htmlFor="booking_photos" className="text-base font-semibold bg-gray-200 rounded p-0.5 hover:bg-gray-100 transition-colors cursor-pointer">
                    Add photos to help the cleaner understand the job 
                  </Label>
                  <span className="text-xs text-muted-foreground">
                    (Highly recommended - This helps cleaner respond fast and
                    accurate)
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Optional. Up to {MAX_BOOKING_PHOTOS} photos, 5MB each. JPEG,
                  PNG, or WebP.
                </p>
                <div className="flex flex-col gap-3">
                  {selectedPhotos.length > 0 ? (
                    <ul className="flex flex-wrap gap-3">
                      {selectedPhotos.map((photo) => (
                        <li key={photo.id} className="relative">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={photo.previewUrl}
                            alt="Selected booking photo preview"
                            className="size-24 rounded-lg border border-border object-cover"
                          />
                          <Button
                            type="button"
                            variant="secondary"
                            size="icon"
                            className="absolute -right-2 -top-2 size-7 rounded-full shadow-sm"
                            aria-label="Remove photo"
                            onClick={() => removePhoto(photo.id)}
                          >
                            <X className="size-3.5" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  {selectedPhotos.length < MAX_BOOKING_PHOTOS ? (
                    <div>
                      <input
                        ref={photoInputRef}
                        id="booking_photos"
                        type="file"
                        accept={BOOKING_PHOTO_ACCEPT}
                        capture="environment"
                        className="sr-only"
                        onChange={handlePhotoSelection}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => photoInputRef.current?.click()}
                      >
                        {selectedPhotos.length === 0
                          ? "Add photo"
                          : "Add another photo"}
                      </Button>
                    </div>
                  ) : null}
                  {photoPickerError ? (
                    <p role="alert" className="text-sm text-destructive">
                      {photoPickerError}
                    </p>
                  ) : null}
                </div>
              </section>

              <section className="flex flex-col gap-4">
                <SectionHeading title="When & where" />
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
                  <p className="mt-2 whitespace-pre-wrap rounded-xl border px-4 py-3 text-muted-foreground">
                    {specialRequests}
                  </p>
                </section>
              ) : null}
            </>
          ) : null}
        </CardContent>

        <CardFooter className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between mt-5">
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
            <SubmitButton
              disabled={!canSubmit || Boolean(createdBookingId)}
              pending={isSubmitting}
            />
          )}
        </CardFooter>
      </form>
    </Card>
  );
}
