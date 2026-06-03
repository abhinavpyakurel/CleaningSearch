"use server";

import { revalidatePath } from "next/cache";

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
    .select("id, client_id, cleaner_id, status")
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

  if (booking.status !== "confirmed" && booking.status !== "in_progress") {
    return { error: "This booking cannot be marked completed." };
  }

  const { data: updated, error: updateError } = await supabase
    .from("bookings")
    .update({ status: "completed" })
    .eq("id", bookingId)
    .eq("client_id", user.id)
    .select("id")
    .maybeSingle();

  if (updateError) {
    return { error: updateError.message };
  }

  if (!updated) {
    return { error: "Could not update booking." };
  }

  revalidatePath("/client/bookings");
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
    .select("id, client_id, status, scheduled_at")
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

  if (booking.status !== "pending" && booking.status !== "confirmed") {
    return { error: "This booking can no longer be cancelled." };
  }

  if (booking.status === "confirmed") {
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
    .in("status", ["pending", "confirmed"])
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
