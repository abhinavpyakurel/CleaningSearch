"use server";

import { revalidatePath } from "next/cache";

import {
  sendBookingAcceptedEmailToClient,
  sendBookingDeclinedEmailToClient,
} from "@/lib/email/notifications";
import {
  buildCounterOffer,
  counterAdjustmentsToJson,
  parseScopeSnapshot,
  scopeSnapshotToJson,
  type CounterOfferSubmission,
} from "@/lib/counter-offer";
import { EXTRA_TASKS, type ExtraTask } from "@/lib/intake-estimate";
import { computeAcceptedBookingPricingCents } from "@/lib/booking-price";
import { createClient } from "@/lib/supabase/server";

export type CounterOfferActionState = { error: string | null };

async function getAuthenticatedCleaner() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { supabase, user: null, error: "Not authenticated." as const };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.role !== "cleaner") {
    return { supabase, user: null, error: "Only cleaners can manage requests." as const };
  }

  return { supabase, user, error: null };
}

function parseNumericField(value: unknown): number | null {
  if (value == null) {
    return null;
  }

  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseOptionalString(formData: FormData, key: string): string | undefined {
  const value = String(formData.get(key) ?? "").trim();
  return value || undefined;
}

function parseCounterSubmission(formData: FormData): CounterOfferSubmission {
  const requestedHoursRaw = parseOptionalString(formData, "counter_requested_hours");
  const requested_hours =
    requestedHoursRaw != null ? Number(requestedHoursRaw) : undefined;

  const extraTasksRaw = formData.getAll("counter_extra_tasks");
  const extra_tasks: ExtraTask[] = [];
  for (const entry of extraTasksRaw) {
    const value = String(entry).trim();
    if (
      (EXTRA_TASKS as readonly string[]).includes(value) &&
      !extra_tasks.includes(value as ExtraTask)
    ) {
      extra_tasks.push(value as ExtraTask);
    }
  }

  return {
    requested_hours:
      requested_hours != null && Number.isFinite(requested_hours)
        ? requested_hours
        : undefined,
    service_type: parseOptionalString(formData, "counter_service_type"),
    bedroom_size: parseOptionalString(formData, "counter_bedroom_size"),
    bedroom_clutter: parseOptionalString(formData, "counter_bedroom_clutter"),
    bathroom_type: parseOptionalString(formData, "counter_bathroom_type"),
    bathroom_condition: parseOptionalString(
      formData,
      "counter_bathroom_condition"
    ),
    kitchen_size: parseOptionalString(formData, "counter_kitchen_size"),
    kitchen_condition: parseOptionalString(formData, "counter_kitchen_condition"),
    living_area_size: parseOptionalString(formData, "counter_living_area_size"),
    living_area_clutter: parseOptionalString(
      formData,
      "counter_living_area_clutter"
    ),
    hallway_size: parseOptionalString(formData, "counter_hallway_size"),
    hallway_clutter: parseOptionalString(formData, "counter_hallway_clutter"),
    extra_tasks,
  };
}

async function updatePendingRequest(
  formData: FormData,
  status: "cancelled"
): Promise<{ error: string | null }> {
  const bookingId = String(formData.get("booking_id") ?? "").trim();
  if (!bookingId) {
    return { error: "Invalid request." };
  }

  const auth = await getAuthenticatedCleaner();
  if (auth.error || !auth.user) {
    return { error: auth.error ?? "Not authenticated." };
  }

  const { supabase, user } = auth;

  const { data, error } = await supabase
    .from("bookings")
    .update({ status })
    .eq("id", bookingId)
    .eq("cleaner_id", user.id)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();

  if (error) {
    return { error: error.message };
  }

  if (!data) {
    return { error: "This request is no longer pending." };
  }

  try {
    const { data: booking } = await supabase
      .from("bookings")
      .select("id, client_id, scheduled_at, duration_hours, service_address")
      .eq("id", bookingId)
      .maybeSingle();

    if (booking?.client_id) {
      const { data: clientProfile } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", booking.client_id)
        .maybeSingle();

      if (clientProfile?.email) {
        const { data: cleanerProfile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .maybeSingle();

        if (
          booking.scheduled_at &&
          typeof booking.duration_hours === "number" &&
          booking.service_address
        ) {
          const emailArgs = {
            clientEmail: clientProfile.email,
            clientName: clientProfile.full_name,
            cleanerName: cleanerProfile?.full_name ?? null,
            bookingId: booking.id,
            scheduledAt: booking.scheduled_at,
            durationHours: booking.duration_hours,
            serviceAddress: booking.service_address,
          };

          if (status === "cancelled") {
            await sendBookingDeclinedEmailToClient(emailArgs);
          }
        }
      }
    }
  } catch (emailError) {
    console.error(
      "EMAIL_DEBUG: Failed to notify client of booking decision:",
      emailError
    );
  }

  revalidatePath("/cleaner/requests");
  return { error: null };
}

export async function acceptRequestAction(
  formData: FormData
): Promise<{ error: string | null }> {
  const bookingId = String(formData.get("booking_id") ?? "").trim();
  if (!bookingId) {
    return { error: "Invalid request." };
  }

  const auth = await getAuthenticatedCleaner();
  if (auth.error || !auth.user) {
    return { error: auth.error ?? "Not authenticated." };
  }

  const { supabase, user } = auth;

  const { data: booking, error: fetchError } = await supabase
    .from("bookings")
    .select(
      "id, status, client_id, scheduled_at, duration_hours, service_address, client_requested_hours, hourly_rate_snapshot"
    )
    .eq("id", bookingId)
    .eq("cleaner_id", user.id)
    .maybeSingle();

  if (fetchError) {
    return { error: fetchError.message };
  }

  if (!booking) {
    return { error: "Booking not found." };
  }

  if (booking.status !== "pending") {
    return { error: "This request is no longer pending." };
  }

  const hours = parseNumericField(
    booking.client_requested_hours ?? booking.duration_hours
  );
  const hourlyRate = parseNumericField(booking.hourly_rate_snapshot);

  if (hours == null) {
    return { error: "Requested hours are missing for this booking." };
  }

  if (hourlyRate == null) {
    return { error: "Hourly rate is missing for this booking." };
  }

  const pricing = computeAcceptedBookingPricingCents(hourlyRate, hours);

  const { data, error } = await supabase
    .from("bookings")
    .update({
      status: "accepted_pending_payment",
      payment_status: "unpaid",
      cleaner_payout_cents: pricing.cleaner_payout_cents,
      platform_fee_cents: pricing.platform_fee_cents,
      total_price_cents: pricing.total_price_cents,
      service_price_cents: pricing.cleaner_payout_cents,
    } as never)
    .eq("id", bookingId)
    .eq("cleaner_id", user.id)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();

  if (error) {
    return { error: error.message };
  }

  if (!data) {
    return { error: "This request is no longer pending." };
  }

  try {
    if (booking.client_id) {
      const { data: clientProfile } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", booking.client_id)
        .maybeSingle();

      if (clientProfile?.email) {
        const { data: cleanerProfile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .maybeSingle();

        if (
          booking.scheduled_at &&
          typeof booking.duration_hours === "number" &&
          booking.service_address
        ) {
          await sendBookingAcceptedEmailToClient({
            clientEmail: clientProfile.email,
            clientName: clientProfile.full_name,
            cleanerName: cleanerProfile?.full_name ?? null,
            bookingId: booking.id,
            scheduledAt: booking.scheduled_at,
            durationHours: booking.duration_hours,
            serviceAddress: booking.service_address,
          });
        }
      }
    }
  } catch (emailError) {
    console.error(
      "EMAIL_DEBUG: Failed to notify client of booking acceptance:",
      emailError
    );
  }

  revalidatePath("/cleaner/requests");
  revalidatePath("/client/bookings");
  revalidatePath("/cleaner/dashboard");
  return { error: null };
}

export async function declineRequestAction(
  formData: FormData
): Promise<{ error: string | null }> {
  return updatePendingRequest(formData, "cancelled");
}

export async function submitCounterOfferAction(
  _prevState: CounterOfferActionState,
  formData: FormData
): Promise<CounterOfferActionState> {
  const bookingId = String(formData.get("booking_id") ?? "").trim();
  const counterReason = String(formData.get("counter_reason") ?? "").trim();

  if (!bookingId) {
    return { error: "Invalid request." };
  }

  if (!counterReason) {
    return { error: "Add a short reason for this adjustment." };
  }

  const auth = await getAuthenticatedCleaner();
  if (auth.error || !auth.user) {
    return { error: auth.error ?? "Not authenticated." };
  }

  const { supabase, user } = auth;

  const { data: booking, error: fetchError } = await supabase
    .from("bookings")
    .select(
      "id, status, scope_snapshot, client_requested_hours, hourly_rate_snapshot, duration_hours"
    )
    .eq("id", bookingId)
    .eq("cleaner_id", user.id)
    .maybeSingle();

  if (fetchError) {
    return { error: fetchError.message };
  }

  if (!booking) {
    return { error: "Booking not found." };
  }

  if (booking.status !== "pending") {
    return { error: "Only pending requests can receive a counter offer." };
  }

  const scope = parseScopeSnapshot(booking.scope_snapshot);
  if (!scope) {
    return {
      error: "This booking does not have structured scope details to adjust.",
    };
  }

  const clientRequestedHours =
    booking.client_requested_hours ?? booking.duration_hours ?? scope.quote.recommended_hours;

  if (!Number.isFinite(clientRequestedHours)) {
    return { error: "Requested hours are missing for this booking." };
  }

  const hourlyRateSnapshot = booking.hourly_rate_snapshot;
  if (hourlyRateSnapshot == null || !Number.isFinite(hourlyRateSnapshot)) {
    return { error: "Hourly rate is missing for this booking." };
  }

  const submission = parseCounterSubmission(formData);
  const result = buildCounterOffer(
    scope,
    clientRequestedHours,
    hourlyRateSnapshot,
    submission
  );

  if ("error" in result) {
    return { error: result.error };
  }

  const { data: updated, error: updateError } = await supabase
    .from("bookings")
    .update({
      status: "countered",
      counter_adjustments: counterAdjustmentsToJson(result.data.counter_adjustments),
      counter_scope_snapshot: scopeSnapshotToJson(
        result.data.counter_scope_snapshot
      ),
      counter_hours: result.data.counter_hours,
      counter_total_price_cents: result.data.counter_total_price_cents,
      counter_reason: counterReason,
      countered_at: new Date().toISOString(),
    } as never)
    .eq("id", bookingId)
    .eq("cleaner_id", user.id)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();

  if (updateError) {
    return { error: updateError.message };
  }

  if (!updated) {
    return { error: "This request is no longer pending." };
  }

  revalidatePath("/cleaner/requests");
  revalidatePath("/client/bookings");
  return { error: null };
}
