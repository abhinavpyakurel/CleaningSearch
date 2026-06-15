"use server";

import { revalidatePath } from "next/cache";

import { buildCompletionUpdate } from "@/lib/booking-completion";
import { createBookingPayoutTransfer } from "@/lib/stripe/connect";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

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
    return {
      supabase,
      user: null,
      error: "Only cleaners can manage jobs." as const,
    };
  }

  return { supabase, user, error: null };
}

export async function markJobCompleteAction(
  formData: FormData
): Promise<{ error: string | null }> {
  const bookingId = String(formData.get("booking_id") ?? "").trim();
  if (!bookingId) {
    return { error: "Invalid job." };
  }

  const auth = await getAuthenticatedCleaner();
  if (auth.error || !auth.user) {
    return { error: auth.error ?? "Not authenticated." };
  }

  const { supabase, user } = auth;

  const { data: booking, error: fetchError } = await supabase
    .from("bookings")
    .select(
      "id, cleaner_id, status, cleaner_marked_complete_at, client_marked_complete_at"
    )
    .eq("id", bookingId)
    .maybeSingle();

  if (fetchError) {
    return { error: fetchError.message };
  }

  if (!booking) {
    return { error: "Job not found." };
  }

  if (booking.cleaner_id !== user.id) {
    return { error: "You cannot complete this job." };
  }

  if (booking.status !== "confirmed") {
    return { error: "This job cannot be marked complete." };
  }

  if (booking.cleaner_marked_complete_at != null) {
    return { error: "You have already marked this job complete." };
  }

  const nowIso = new Date().toISOString();
  const updatePayload = buildCompletionUpdate(booking, "cleaner", nowIso);

  const { data: updated, error: updateError } = await supabase
    .from("bookings")
    .update(updatePayload)
    .eq("id", bookingId)
    .eq("cleaner_id", user.id)
    .eq("status", "confirmed")
    .is("cleaner_marked_complete_at", null)
    .select("id")
    .maybeSingle();

  if (updateError) {
    return { error: updateError.message };
  }

  if (!updated) {
    return { error: "Could not update job." };
  }

  revalidatePath(`/cleaner/jobs/${bookingId}`);
  revalidatePath("/cleaner/dashboard");
  revalidatePath("/client/bookings");
  return { error: null };
}

export type ReleasePayoutActionState = {
  error: string | null;
  success?: boolean;
};

export async function releasePayoutAction(
  _prevState: ReleasePayoutActionState,
  formData: FormData
): Promise<ReleasePayoutActionState> {
  const bookingId = String(formData.get("booking_id") ?? "").trim();
  if (!bookingId) {
    return { error: "Invalid job." };
  }

  const auth = await getAuthenticatedCleaner();
  if (auth.error || !auth.user) {
    return { error: auth.error ?? "Not authenticated." };
  }

  const { supabase, user } = auth;

  const { data: booking, error: fetchError } = await supabase
    .from("bookings")
    .select(
      "id, cleaner_id, status, payment_status, payout_status, cleaner_payout_cents, stripe_transfer_id"
    )
    .eq("id", bookingId)
    .maybeSingle();

  if (fetchError) {
    return { error: fetchError.message };
  }

  if (!booking) {
    return { error: "Job not found." };
  }

  if (booking.cleaner_id !== user.id) {
    return { error: "You cannot release payout for this job." };
  }

  if (
    booking.payout_status === "paid" ||
    booking.stripe_transfer_id != null
  ) {
    return { error: "This payout has already been released." };
  }

  if (
    booking.status !== "completed" ||
    booking.payment_status !== "paid" ||
    booking.payout_status !== "ready"
  ) {
    return { error: "This booking is not ready for payout." };
  }

  if (
    booking.cleaner_payout_cents == null ||
    !Number.isFinite(booking.cleaner_payout_cents) ||
    booking.cleaner_payout_cents <= 0
  ) {
    return { error: "This booking is not ready for payout." };
  }

  const { data: cleanerProfile, error: profileError } = await supabase
    .from("cleaner_profiles")
    .select(
      "stripe_account_id, stripe_payouts_enabled, stripe_onboarding_complete"
    )
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileError) {
    return { error: profileError.message };
  }

  if (!cleanerProfile?.stripe_account_id) {
    return { error: "Cleaner payout account is not ready." };
  }

  if (
    !cleanerProfile.stripe_payouts_enabled &&
    !cleanerProfile.stripe_onboarding_complete
  ) {
    return { error: "Cleaner payout account is not ready." };
  }

  let transfer;
  try {
    transfer = await createBookingPayoutTransfer({
      bookingId: booking.id,
      cleanerId: user.id,
      amountCents: booking.cleaner_payout_cents,
      destinationAccountId: cleanerProfile.stripe_account_id,
      idempotencyKey: `booking_payout_${booking.id}_${Date.now()}`,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("Stripe secret key not configured")
    ) {
      return { error: "Missing server configuration for payout release." };
    }

    const message =
      error instanceof Error ? error.message : "Unknown error";

    if (
      message ===
        "The app is using a different Stripe sandbox/account than the dashboard balance you funded." ||
      message.startsWith("Insufficient platform balance:")
    ) {
      return { error: message };
    }

    return { error: `Stripe transfer failed: ${message}` };
  }

  const nowIso = new Date().toISOString();

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return { error: "Missing server configuration for payout release." };
  }

  const { data: updated, error: updateError } = await admin
    .from("bookings")
    .update({
      payout_status: "paid",
      stripe_transfer_id: transfer.id,
      paid_out_at: nowIso,
    })
    .eq("id", bookingId)
    .eq("cleaner_id", user.id)
    .eq("status", "completed")
    .eq("payment_status", "paid")
    .eq("payout_status", "ready")
    .is("stripe_transfer_id", null)
    .select("id")
    .maybeSingle();

  if (updateError) {
    return { error: updateError.message };
  }

  if (!updated) {
    return {
      error:
        "Payout transfer succeeded but booking could not be updated. Contact support.",
    };
  }

  revalidatePath(`/cleaner/jobs/${bookingId}`);
  revalidatePath("/cleaner/dashboard");
  return { error: null, success: true };
}
