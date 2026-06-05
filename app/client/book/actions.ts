"use server";

import { redirect } from "next/navigation";

import {
  computeBookingPricing,
  computeBookingPricingCents,
} from "@/lib/booking-price";
import { sendNewBookingEmailToCleaner } from "@/lib/email/notifications";
import {
  estimateIntake,
  EXTRA_TASKS,
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
import { createClient } from "@/lib/supabase/server";

export type BookActionState = {
  error?: string;
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

function isMessLevel(value: string): value is MessLevel {
  return (MESS_LEVELS as readonly string[]).includes(value);
}

function isExtraTask(value: string): value is ExtraTask {
  return (EXTRA_TASKS as readonly string[]).includes(value);
}

function parseIntakeFromFormData(formData: FormData): IntakeInput | BookActionState {
  const homeType = String(formData.get("home_type") ?? "").trim();
  const bedroomsRaw = String(formData.get("bedrooms") ?? "").trim();
  const bathroomsRaw = String(formData.get("bathrooms") ?? "").trim();
  const squareFeetRange = String(formData.get("square_feet_range") ?? "").trim();
  const serviceType = String(formData.get("service_type") ?? "").trim();
  const messLevel = String(formData.get("mess_level") ?? "").trim();

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

  if (!isMessLevel(messLevel)) {
    return { error: "Select a valid mess level." };
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
    home_type: homeType,
    bedrooms,
    bathrooms,
    square_feet_range: squareFeetRange,
    service_type: serviceType,
    mess_level: messLevel,
    has_pets: parseBooleanField(formData.get("has_pets")),
    supplies_needed: parseBooleanField(formData.get("supplies_needed")),
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

  const scope_snapshot = {
    input: intakeResult,
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
      home_type: intakeResult.home_type,
      bedrooms: intakeResult.bedrooms,
      bathrooms: intakeResult.bathrooms,
      square_feet_range: intakeResult.square_feet_range,
      service_type: intakeResult.service_type,
      mess_level: intakeResult.mess_level,
      has_pets: intakeResult.has_pets,
      supplies_needed: intakeResult.supplies_needed,
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

  redirect(`/client/book/confirm?booking_id=${data.id}`);
}
