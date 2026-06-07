"use server";

import { redirect } from "next/navigation";

import {
  computeBookingPricing,
  computeBookingPricingCents,
} from "@/lib/booking-price";
import { sendNewBookingEmailToCleaner } from "@/lib/email/notifications";
import {
  AREA_CONDITIONS,
  AREA_SIZES,
  BATHROOM_TYPES,
  estimateIntake,
  EXTRA_TASKS,
  FLOOR_TYPES,
  homeConditionToMessLevel,
  HOME_CONDITIONS,
  HOME_TYPES,
  LAST_CLEANED_OPTIONS,
  LIVING_AREA_SIZES,
  PET_HAIR_LEVELS,
  SERVICE_TYPES,
  SQUARE_FEET_RANGES,
  VISIT_TYPES,
  type AreaCondition,
  type AreaSize,
  type BathroomType,
  type ExtraTask,
  type FloorType,
  type HomeCondition,
  type HomeType,
  type IntakeInput,
  type LastCleaned,
  type LivingAreaSize,
  type PetHairLevel,
  type ServiceType,
  type SquareFeetRange,
  type VisitType,
} from "@/lib/intake-estimate";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/database.types";

export type BookActionState = {
  error?: string;
  bookingId?: string;
};

function parseBooleanField(value: FormDataEntryValue | null): boolean {
  return String(value ?? "").toLowerCase() === "true";
}

function isHomeType(value: string): value is HomeType {
  return (HOME_TYPES as readonly string[]).includes(value);
}

function isSquareFeetRange(value: string): value is SquareFeetRange {
  return (SQUARE_FEET_RANGES as readonly string[]).includes(value);
}

function isServiceType(value: string): value is ServiceType {
  return (SERVICE_TYPES as readonly string[]).includes(value);
}

function isVisitType(value: string): value is VisitType {
  return (VISIT_TYPES as readonly string[]).includes(value);
}

function isHomeCondition(value: string): value is HomeCondition {
  return (HOME_CONDITIONS as readonly string[]).includes(value);
}

function isAreaCondition(value: string): value is AreaCondition {
  return (AREA_CONDITIONS as readonly string[]).includes(value);
}

function isAreaSize(value: string): value is AreaSize {
  return (AREA_SIZES as readonly string[]).includes(value);
}

function isLivingAreaSize(value: string): value is LivingAreaSize {
  return (LIVING_AREA_SIZES as readonly string[]).includes(value);
}

function isBathroomType(value: string): value is BathroomType {
  return (BATHROOM_TYPES as readonly string[]).includes(value);
}

function isPetHairLevel(value: string): value is PetHairLevel {
  return (PET_HAIR_LEVELS as readonly string[]).includes(value);
}

function isFloorType(value: string): value is FloorType {
  return (FLOOR_TYPES as readonly string[]).includes(value);
}

function isLastCleaned(value: string): value is LastCleaned {
  return (LAST_CLEANED_OPTIONS as readonly string[]).includes(value);
}

function isExtraTask(value: string): value is ExtraTask {
  return (EXTRA_TASKS as readonly string[]).includes(value);
}

function parseIntakeFromFormData(
  formData: FormData
): IntakeInput | { error: string } {
  const visitType = String(formData.get("visit_type") ?? "").trim();
  const homeType = String(formData.get("home_type") ?? "").trim();
  const bedroomsRaw = String(formData.get("bedrooms") ?? "").trim();
  const bathroomsRaw = String(formData.get("bathrooms") ?? "").trim();
  const squareFeetRange = String(formData.get("square_feet_range") ?? "").trim();
  const serviceType = String(formData.get("service_type") ?? "").trim();
  const homeCondition = String(formData.get("home_condition") ?? "").trim();
  const commonAreaCondition = String(
    formData.get("common_area_condition") ?? "normal"
  ).trim();
  const bedroomSize = String(formData.get("bedroom_size") ?? "normal").trim();
  const bedroomCondition = String(
    formData.get("bedroom_condition") ?? "normal"
  ).trim();
  const bathroomType = String(formData.get("bathroom_type") ?? "full").trim();
  const kitchenSize = String(formData.get("kitchen_size") ?? "normal").trim();
  const livingAreaSize = String(
    formData.get("living_area_size") ?? "normal"
  ).trim();
  const hallwaySize = String(formData.get("hallway_size") ?? "normal").trim();
  const kitchenCondition = String(formData.get("kitchen_condition") ?? "").trim();
  const bathroomCondition = String(
    formData.get("bathroom_condition") ?? ""
  ).trim();
  const petHairLevel = String(formData.get("pet_hair_level") ?? "").trim();
  const floorType = String(formData.get("floor_type") ?? "").trim();
  const lastCleanedRaw = String(formData.get("last_cleaned") ?? "").trim();

  if (!isVisitType(visitType)) {
    return { error: "Select a valid visit type." };
  }

  if (!isHomeType(homeType)) {
    return { error: "Select a valid home type." };
  }

  const bedrooms = Number(bedroomsRaw);
  if (
    !bedroomsRaw ||
    !Number.isFinite(bedrooms) ||
    bedrooms < 0 ||
    !Number.isInteger(bedrooms)
  ) {
    return { error: "Bedrooms must be a whole number of 0 or more." };
  }

  const bathrooms = Number(bathroomsRaw);
  if (!bathroomsRaw || !Number.isFinite(bathrooms) || bathrooms < 0) {
    return { error: "Bathrooms must be a number of 0 or more." };
  }

  if (!isSquareFeetRange(squareFeetRange)) {
    return { error: "Select a valid home size." };
  }

  if (!isServiceType(serviceType)) {
    return { error: "Select a valid service type." };
  }

  const clean_bedrooms = parseBooleanField(formData.get("clean_bedrooms"));
  const clean_bathrooms = parseBooleanField(formData.get("clean_bathrooms"));
  const clean_kitchen = parseBooleanField(formData.get("clean_kitchen"));
  const clean_common_area = parseBooleanField(
    formData.get("clean_common_area")
  );
  const clean_hallways = parseBooleanField(formData.get("clean_hallways"));
  const clean_floors = parseBooleanField(formData.get("clean_floors"));

  if (
    !clean_bedrooms &&
    !clean_bathrooms &&
    !clean_kitchen &&
    !clean_common_area &&
    !clean_hallways &&
    !clean_floors
  ) {
    return { error: "Select at least one area to clean." };
  }

  if (clean_bedrooms && bedrooms < 1) {
    return {
      error: "Enter at least 1 bedroom when bedrooms are included in scope.",
    };
  }

  if (clean_bathrooms && bathrooms < 1) {
    return {
      error: "Enter at least 1 bathroom when bathrooms are included in scope.",
    };
  }

  if (!isHomeCondition(homeCondition)) {
    return { error: "Select a valid home condition." };
  }

  if (!isAreaCondition(commonAreaCondition)) {
    return { error: "Select a valid living area condition." };
  }

  if (!isAreaSize(bedroomSize)) {
    return { error: "Select a valid bedroom size." };
  }

  if (!isAreaCondition(bedroomCondition)) {
    return { error: "Select a valid bedroom condition." };
  }

  if (!isBathroomType(bathroomType)) {
    return { error: "Select a valid bathroom type." };
  }

  if (!isAreaSize(kitchenSize)) {
    return { error: "Select a valid kitchen size." };
  }

  if (!isLivingAreaSize(livingAreaSize)) {
    return { error: "Select a valid living area size." };
  }

  if (!isAreaSize(hallwaySize)) {
    return { error: "Select a valid hallway size." };
  }

  if (!isAreaCondition(kitchenCondition)) {
    return { error: "Select a valid kitchen condition." };
  }

  if (!isAreaCondition(bathroomCondition)) {
    return { error: "Select a valid bathroom condition." };
  }

  if (!isPetHairLevel(petHairLevel)) {
    return { error: "Select a valid pet hair level." };
  }

  if (!isFloorType(floorType)) {
    return { error: "Select a valid floor type." };
  }

  let last_cleaned: LastCleaned | null = null;
  if (lastCleanedRaw) {
    if (!isLastCleaned(lastCleanedRaw)) {
      return { error: "Select a valid last cleaned option." };
    }
    last_cleaned = lastCleanedRaw;
  }

  const extraTasksRaw = formData.getAll("extra_tasks");
  const extra_tasks: ExtraTask[] = [];
  for (const entry of extraTasksRaw) {
    const value = String(entry).trim();
    if (!isExtraTask(value)) {
      return { error: "One or more extra tasks are invalid." };
    }
    if (!extra_tasks.includes(value)) {
      extra_tasks.push(value);
    }
  }

  return {
    visit_type: visitType,
    service_type: serviceType,
    home_type: homeType,
    bedrooms,
    bathrooms,
    square_feet_range: squareFeetRange,
    clean_bedrooms,
    clean_bathrooms,
    clean_kitchen,
    clean_common_area,
    clean_hallways,
    clean_floors,
    home_condition: homeCondition,
    bedroom_size: bedroomSize,
    bedroom_condition: bedroomCondition,
    bathroom_type: bathroomType,
    kitchen_size: kitchenSize,
    living_area_size: livingAreaSize,
    hallway_size: hallwaySize,
    kitchen_condition: kitchenCondition,
    bathroom_condition: bathroomCondition,
    common_area_condition: commonAreaCondition,
    pet_hair_level: petHairLevel,
    last_cleaned,
    floor_type: floorType,
    extra_tasks,
  };
}

export async function createBookingAction(
  _prevState: BookActionState,
  formData: FormData
): Promise<BookActionState> {
  const serviceAddress = String(formData.get("service_address") ?? "").trim();
  const date = formData.get("date") as string | null;
  const time = formData.get("time") as string | null;
  const specialRequests = String(formData.get("special_requests") ?? "").trim();
  const requestedHoursRaw = String(
    formData.get("client_requested_hours") ?? ""
  ).trim();
  const cleanerId = formData.get("cleaner_id") as string | null;

  if (!serviceAddress) {
    return { error: "Service address is required." };
  }

  if (!date || !time) {
    return { error: "Date and time are required." };
  }

  let scheduled_at: string;
  try {
    scheduled_at = new Date(`${date}T${time}:00`).toISOString();
  } catch {
    return { error: "Enter a valid date and time." };
  }

  const intakeResult = parseIntakeFromFormData(formData);
  if ("error" in intakeResult) {
    return intakeResult;
  }

  const quote = estimateIntake(intakeResult);

  const clientRequestedHours = Number(requestedHoursRaw);
  if (
    !requestedHoursRaw ||
    !Number.isFinite(clientRequestedHours) ||
    clientRequestedHours <= 0
  ) {
    return { error: "Select a valid number of requested hours." };
  }

  if (clientRequestedHours < quote.minimum_hours) {
    return {
      error: `Requested hours must be at least ${quote.minimum_hours}.`,
    };
  }

  if (clientRequestedHours > quote.maximum_hours) {
    return {
      error: `Requested hours cannot exceed ${quote.maximum_hours}.`,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.role !== "client") {
    redirect("/cleaner/dashboard");
  }

  let base_price: number | null = null;
  let platform_fee: number | null = null;
  let total_price: number | null = null;
  let hourly_rate_snapshot: number | null = null;
  let service_price_cents: number | null = null;
  let platform_fee_cents: number | null = null;
  let total_price_cents: number | null = null;

  if (cleanerId) {
    const { data: cleanerProfile } = await supabase
      .from("cleaner_profiles")
      .select("hourly_rate")
      .eq("user_id", cleanerId)
      .maybeSingle();

    const hourlyRate = cleanerProfile?.hourly_rate;
    if (hourlyRate != null && Number.isFinite(hourlyRate) && hourlyRate > 0) {
      hourly_rate_snapshot = hourlyRate;
      const pricing = computeBookingPricing(hourlyRate, clientRequestedHours);
      base_price = pricing.base_price;
      platform_fee = pricing.platform_fee;
      total_price = pricing.total_price;

      const pricingCents = computeBookingPricingCents(
        hourlyRate,
        clientRequestedHours
      );
      service_price_cents = pricingCents.service_price_cents;
      platform_fee_cents = pricingCents.platform_fee_cents;
      total_price_cents = pricingCents.total_price_cents;
    }
  }

  const suppliesNeeded = parseBooleanField(formData.get("supplies_needed"));

  let uiDetails: Json | null = null;
  const scopeUiExtrasRaw = String(formData.get("scope_ui_extras") ?? "").trim();
  if (scopeUiExtrasRaw) {
    try {
      const parsed = JSON.parse(scopeUiExtrasRaw) as unknown;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        uiDetails = parsed as Json;
      }
    } catch {
      return { error: "Invalid scope details. Please refresh and try again." };
    }
  }

  const scope_snapshot = {
    input: intakeResult,
    ui_details: uiDetails,
    quote,
    pricing: {
      hourly_rate_snapshot,
      service_price_cents,
      platform_fee_cents,
      total_price_cents,
      base_price,
      platform_fee,
      total_price,
      client_requested_hours: clientRequestedHours,
      recommended_hours: quote.recommended_hours,
      minimum_hours: quote.minimum_hours,
      maximum_hours: quote.maximum_hours,
    },
    captured_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("bookings")
    .insert({
      client_id: user.id,
      service_address: serviceAddress,
      scheduled_at,
      duration_hours: clientRequestedHours,
      notes: specialRequests || null,
      cleaner_id: cleanerId || null,
      status: "pending",
      visit_type: intakeResult.visit_type,
      home_type: intakeResult.home_type,
      bedrooms: intakeResult.bedrooms,
      bathrooms: intakeResult.bathrooms,
      square_feet_range: intakeResult.square_feet_range,
      service_type: intakeResult.service_type,
      clean_bedrooms: intakeResult.clean_bedrooms,
      clean_bathrooms: intakeResult.clean_bathrooms,
      clean_kitchen: intakeResult.clean_kitchen,
      clean_common_area: intakeResult.clean_common_area,
      clean_hallways: intakeResult.clean_hallways,
      clean_floors: intakeResult.clean_floors,
      home_condition: intakeResult.home_condition,
      clutter_level: null,
      kitchen_condition: intakeResult.kitchen_condition,
      bathroom_condition: intakeResult.bathroom_condition,
      pet_hair_level: intakeResult.pet_hair_level,
      last_cleaned: intakeResult.last_cleaned,
      floor_type: intakeResult.floor_type,
      mess_level: homeConditionToMessLevel(intakeResult.home_condition),
      has_pets: intakeResult.pet_hair_level !== "none",
      supplies_needed: suppliesNeeded,
      extra_tasks: intakeResult.extra_tasks,
      special_requests: specialRequests || null,
      recommended_hours: quote.recommended_hours,
      minimum_hours: quote.minimum_hours,
      maximum_hours: quote.maximum_hours,
      client_requested_hours: clientRequestedHours,
      hourly_rate_snapshot,
      service_price_cents,
      platform_fee_cents,
      total_price_cents,
      base_price,
      platform_fee,
      total_price,
      scope_snapshot,
    })
    .select("id")
    .single();

  if (error) {
    return { error: error.message };
  }

  if (cleanerId) {
    try {
      const { data: cleanerProfile } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", cleanerId)
        .maybeSingle();

      if (cleanerProfile?.email) {
        const { data: clientProfile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .maybeSingle();

        await sendNewBookingEmailToCleaner({
          cleanerEmail: cleanerProfile.email,
          cleanerName: cleanerProfile.full_name,
          clientName: clientProfile?.full_name ?? null,
          bookingId: data.id,
          scheduledAt: scheduled_at,
          durationHours: clientRequestedHours,
          serviceAddress,
        });
      }
    } catch (emailError) {
      console.error("Failed to notify cleaner of new booking:", emailError);
    }
  }

  return { bookingId: data.id };
}
