"use server";

import { revalidatePath } from "next/cache";

import {
  getBookingUpdateFromCounterScope,
  parseScopeSnapshot,
} from "@/lib/counter-offer";
import { buildCompletionUpdate } from "@/lib/booking-completion";
import { createClient } from "@/lib/supabase/server";

async function getAuthenticatedClient() {
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

  if (!profile || profile.role !== "client") {
    return {
      supabase,
      user: null,
      error: "Only clients can manage bookings." as const,
    };
  }

  return { supabase, user, error: null };
}

export async function markBookingCompletedAction(
  formData: FormData
): Promise<{ error: string | null }> {
  const bookingId = String(formData.get("booking_id") ?? "").trim();
  if (!bookingId) {
    return { error: "Invalid booking." };
  }

  const auth = await getAuthenticatedClient();
  if (auth.error || !auth.user) {
    return { error: auth.error ?? "Not authenticated." };
  }

  const { supabase, user } = auth;

  const { data: booking, error: fetchError } = await supabase
    .from("bookings")
    .select(
      "id, client_id, cleaner_id, status, cleaner_marked_complete_at, client_marked_complete_at"
    )
    .eq("id", bookingId)
    .maybeSingle();

  if (fetchError) {
    return { error: fetchError.message };
  }

  if (!booking) {
    return { error: "Booking not found." };
  }

  if (booking.client_id !== user.id) {
    return { error: "You cannot complete this booking." };
  }

  if (booking.status !== "confirmed") {
    return { error: "This booking cannot be marked completed." };
  }

  if (booking.client_marked_complete_at != null) {
    return { error: "You have already confirmed completion." };
  }

  const nowIso = new Date().toISOString();
  const updatePayload = buildCompletionUpdate(booking, "client", nowIso);

  const { data: updated, error: updateError } = await supabase
    .from("bookings")
    .update(updatePayload)
    .eq("id", bookingId)
    .eq("client_id", user.id)
    .eq("status", "confirmed")
    .is("client_marked_complete_at", null)
    .select("id")
    .maybeSingle();

  if (updateError) {
    return { error: updateError.message };
  }

  if (!updated) {
    return { error: "Could not update booking." };
  }

  revalidatePath("/client/bookings");
  revalidatePath(`/cleaner/jobs/${bookingId}`);
  revalidatePath("/cleaner/dashboard");
  return { error: null };
}

export type CancelBookingState = { error: string | null };

const CANCELLATION_WINDOW_MS = 24 * 60 * 60 * 1000;

export async function cancelBookingAction(
  _prevState: CancelBookingState,
  formData: FormData
): Promise<CancelBookingState> {
  const bookingId = String(formData.get("booking_id") ?? "").trim();
  if (!bookingId) {
    return { error: "Invalid booking." };
  }

  const auth = await getAuthenticatedClient();
  if (auth.error || !auth.user) {
    return { error: auth.error ?? "Not authenticated." };
  }

  const { supabase, user } = auth;

  const { data: booking, error: fetchError } = await supabase
    .from("bookings")
    .select(
      "id, client_id, status, scheduled_at, cleaner_marked_complete_at, client_marked_complete_at"
    )
    .eq("id", bookingId)
    .maybeSingle();

  if (fetchError) {
    return { error: fetchError.message };
  }

  if (!booking) {
    return { error: "Booking not found." };
  }

  if (booking.client_id !== user.id) {
    return { error: "You cannot cancel this booking." };
  }

  if (booking.status !== "pending" && booking.status !== "confirmed" && booking.status !== "accepted_pending_payment") {
    return { error: "This booking can no longer be cancelled." };
  }

  if (booking.status === "accepted_pending_payment") {
    const { data: fullBooking } = await supabase
      .from("bookings")
      .select("payment_status")
      .eq("id", bookingId)
      .maybeSingle();

    if (fullBooking?.payment_status === "paid") {
      return { error: "This booking can no longer be cancelled." };
    }
  }

  if (booking.status === "confirmed") {
    if (
      booking.cleaner_marked_complete_at != null ||
      booking.client_marked_complete_at != null
    ) {
      return {
        error: "Cannot cancel after completion has been started.",
      };
    }

    const scheduledTime = booking.scheduled_at
      ? new Date(booking.scheduled_at).getTime()
      : NaN;

    if (Number.isNaN(scheduledTime)) {
      return { error: "This booking can no longer be cancelled." };
    }

    if (scheduledTime - Date.now() <= CANCELLATION_WINDOW_MS) {
      return {
        error:
          "Confirmed bookings can't be cancelled within 24 hours of the scheduled time.",
      };
    }
  }

  const { data: updated, error: updateError } = await supabase
    .from("bookings")
    .update({ status: "cancelled" })
    .eq("id", bookingId)
    .eq("client_id", user.id)
    .in("status", ["pending", "confirmed", "accepted_pending_payment"])
    .select("id")
    .maybeSingle();

  if (updateError) {
    return { error: updateError.message };
  }

  if (!updated) {
    return { error: "Could not cancel booking." };
  }

  revalidatePath("/client/bookings");
  return { error: null };
}

export type CounterResponseActionState = { error: string | null };

export async function acceptCounterOfferAction(
  _prevState: CounterResponseActionState,
  formData: FormData
): Promise<CounterResponseActionState> {
  const bookingId = String(formData.get("booking_id") ?? "").trim();
  if (!bookingId) {
    return { error: "Invalid booking." };
  }

  const auth = await getAuthenticatedClient();
  if (auth.error || !auth.user) {
    return { error: auth.error ?? "Not authenticated." };
  }

  const { supabase, user } = auth;

  const { data: booking, error: fetchError } = await supabase
    .from("bookings")
    .select("id, client_id, status, counter_scope_snapshot, counter_hours, counter_total_price_cents")
    .eq("id", bookingId)
    .maybeSingle();

  if (fetchError) {
    return { error: fetchError.message };
  }

  if (!booking) {
    return { error: "Booking not found." };
  }

  if (booking.client_id !== user.id) {
    return { error: "You cannot respond to this counter offer." };
  }

  if (booking.status !== "countered") {
    return { error: "This booking does not have an active counter offer." };
  }

  const counterScope = parseScopeSnapshot(booking.counter_scope_snapshot);
  if (!counterScope) {
    return { error: "Counter offer details are missing." };
  }

  if (
    booking.counter_hours == null ||
    booking.counter_total_price_cents == null
  ) {
    return { error: "Counter offer pricing is incomplete." };
  }

  const updatePayload = getBookingUpdateFromCounterScope(counterScope);

  const { data: updated, error: updateError } = await supabase
    .from("bookings")
    .update(updatePayload as never)
    .eq("id", bookingId)
    .eq("client_id", user.id)
    .eq("status", "countered")
    .select("id")
    .maybeSingle();

  if (updateError) {
    return { error: updateError.message };
  }

  if (!updated) {
    return { error: "Could not accept the counter offer." };
  }

  revalidatePath("/client/bookings");
  revalidatePath("/cleaner/requests");
  revalidatePath("/cleaner/dashboard");
  return { error: null };
}

export async function declineCounterOfferAction(
  _prevState: CounterResponseActionState,
  formData: FormData
): Promise<CounterResponseActionState> {
  const bookingId = String(formData.get("booking_id") ?? "").trim();
  if (!bookingId) {
    return { error: "Invalid booking." };
  }

  const auth = await getAuthenticatedClient();
  if (auth.error || !auth.user) {
    return { error: auth.error ?? "Not authenticated." };
  }

  const { supabase, user } = auth;

  const { data: updated, error: updateError } = await supabase
    .from("bookings")
    .update({ status: "declined" } as never)
    .eq("id", bookingId)
    .eq("client_id", user.id)
    .eq("status", "countered")
    .select("id")
    .maybeSingle();

  if (updateError) {
    return { error: updateError.message };
  }

  if (!updated) {
    return { error: "Could not decline the counter offer." };
  }

  revalidatePath("/client/bookings");
  revalidatePath("/cleaner/requests");
  return { error: null };
}
