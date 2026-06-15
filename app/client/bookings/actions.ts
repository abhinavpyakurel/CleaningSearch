"use server";

import { revalidatePath } from "next/cache";

import {
  getBookingUpdateFromCounterScope,
  parseScopeSnapshot,
} from "@/lib/counter-offer";
import { buildCompletionUpdate } from "@/lib/booking-completion";
import { createBookingRefund } from "@/lib/stripe/refund";
import { createAdminClient } from "@/lib/supabase/admin";
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

export type MarkCompleteActionState = { error: string | null };

export async function markBookingCompletedAction(
  _prevState: MarkCompleteActionState,
  formData: FormData
): Promise<MarkCompleteActionState> {
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
      "id, client_id, cleaner_id, status, payment_status, cleaner_marked_complete_at, client_marked_complete_at"
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

  if (booking.payment_status !== "paid") {
    return { error: "Payment must be completed before confirming the job." };
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
    .eq("payment_status", "paid")
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

function getScheduledTimeMs(scheduledAt: string | null): number | null {
  if (!scheduledAt) {
    return null;
  }

  const scheduledTime = new Date(scheduledAt).getTime();
  if (Number.isNaN(scheduledTime)) {
    return null;
  }

  return scheduledTime;
}

function isMoreThan24HoursBeforeScheduled(scheduledAt: string | null): boolean {
  const scheduledTime = getScheduledTimeMs(scheduledAt);
  if (scheduledTime == null) {
    return false;
  }

  return scheduledTime - Date.now() > CANCELLATION_WINDOW_MS;
}

type CancelBookingRow = {
  id: string;
  client_id: string;
  status: string;
  payment_status: string;
  payout_status: string;
  scheduled_at: string | null;
  stripe_payment_intent_id: string | null;
  stripe_refund_id: string | null;
  cleaner_payout_cents: number | null;
  platform_fee_cents: number | null;
  total_price_cents: number | null;
  cleaner_marked_complete_at: string | null;
  client_marked_complete_at: string | null;
};

function getPaidRefundAmounts(booking: CancelBookingRow): {
  refundAmountCents: number;
  nonRefundableFeeCents: number;
} | { error: string } {
  if (
    booking.cleaner_payout_cents == null ||
    !Number.isFinite(booking.cleaner_payout_cents) ||
    booking.cleaner_payout_cents <= 0
  ) {
    return {
      error:
        "This booking cannot be refunded right now. Please contact support.",
    };
  }

  const refundAmountCents = booking.cleaner_payout_cents;
  const nonRefundableFeeCents = booking.platform_fee_cents ?? 0;

  if (
    booking.total_price_cents != null &&
    Number.isFinite(booking.total_price_cents) &&
    refundAmountCents > booking.total_price_cents
  ) {
    return {
      error:
        "This booking cannot be refunded right now. Please contact support.",
    };
  }

  return { refundAmountCents, nonRefundableFeeCents };
}

function isPaidRefundEligible(booking: CancelBookingRow): string | null {
  if (
    booking.stripe_refund_id != null ||
    booking.payment_status === "refunded"
  ) {
    return "This booking has already been refunded.";
  }

  if (booking.status !== "confirmed" || booking.payment_status !== "paid") {
    return null;
  }

  if (
    booking.cleaner_marked_complete_at != null ||
    booking.client_marked_complete_at != null
  ) {
    return "Cannot cancel after completion has started.";
  }

  const scheduledTime = getScheduledTimeMs(booking.scheduled_at);
  if (scheduledTime == null) {
    return "This booking can no longer be cancelled.";
  }

  if (scheduledTime - Date.now() <= CANCELLATION_WINDOW_MS) {
    return "Cancellation is unavailable within 24 hours of the scheduled time.";
  }

  if (booking.payout_status === "ready" || booking.payout_status === "paid") {
    return "This booking can no longer be cancelled because payout processing has started.";
  }

  if (booking.payout_status !== "locked") {
    return "This booking can no longer be cancelled.";
  }

  if (booking.stripe_payment_intent_id == null) {
    return "This booking can no longer be cancelled.";
  }

  return null;
}

function isUnpaidCancellable(booking: CancelBookingRow): boolean {
  if (booking.status === "pending") {
    return true;
  }

  if (
    booking.status === "accepted_pending_payment" &&
    booking.payment_status === "unpaid"
  ) {
    return true;
  }

  if (booking.status === "confirmed" && booking.payment_status === "unpaid") {
    if (
      booking.cleaner_marked_complete_at != null ||
      booking.client_marked_complete_at != null
    ) {
      return false;
    }

    if (!isMoreThan24HoursBeforeScheduled(booking.scheduled_at)) {
      return false;
    }

    return true;
  }

  return false;
}

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
      "id, client_id, status, payment_status, payout_status, scheduled_at, stripe_payment_intent_id, stripe_refund_id, cleaner_payout_cents, platform_fee_cents, total_price_cents, cleaner_marked_complete_at, client_marked_complete_at"
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

  const paidRefundError = isPaidRefundEligible(booking);
  const requiresRefund =
    booking.status === "confirmed" && booking.payment_status === "paid";

  if (requiresRefund) {
    if (paidRefundError) {
      return { error: paidRefundError };
    }

    const refundAmounts = getPaidRefundAmounts(booking);
    if ("error" in refundAmounts) {
      return { error: refundAmounts.error };
    }

    const { refundAmountCents, nonRefundableFeeCents } = refundAmounts;

    let refund;
    try {
      refund = await createBookingRefund({
        paymentIntentId: booking.stripe_payment_intent_id!,
        bookingId: booking.id,
        clientId: user.id,
        amountCents: refundAmountCents,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Stripe refund failed.";
      return { error: `Refund failed: ${message}` };
    }

    let admin;
    try {
      admin = createAdminClient();
    } catch {
      return {
        error:
          "Refund succeeded but booking could not be updated. Contact support.",
      };
    }

    const nowIso = new Date().toISOString();
    const { data: updated, error: updateError } = await admin
      .from("bookings")
      .update({
        status: "cancelled",
        payment_status: "refunded",
        refunded_at: nowIso,
        stripe_refund_id: refund.id,
        refund_amount_cents: refundAmountCents,
        non_refundable_fee_cents: nonRefundableFeeCents,
        payout_status: "paused",
      })
      .eq("id", bookingId)
      .eq("client_id", user.id)
      .eq("status", "confirmed")
      .eq("payment_status", "paid")
      .eq("payout_status", "locked")
      .is("stripe_refund_id", null)
      .is("cleaner_marked_complete_at", null)
      .is("client_marked_complete_at", null)
      .select("id")
      .maybeSingle();

    if (updateError) {
      return {
        error:
          "Refund succeeded but booking could not be updated. Contact support.",
      };
    }

    if (!updated) {
      return { error: "This booking has already been refunded." };
    }

    revalidatePath("/client/bookings");
    revalidatePath(`/cleaner/jobs/${bookingId}`);
    revalidatePath("/cleaner/dashboard");
    return { error: null };
  }

  if (!isUnpaidCancellable(booking)) {
    if (
      booking.status === "confirmed" &&
      booking.payment_status === "unpaid" &&
      !isMoreThan24HoursBeforeScheduled(booking.scheduled_at)
    ) {
      return {
        error:
          "Cancellation is unavailable within 24 hours of the scheduled time.",
      };
    }

    if (
      booking.cleaner_marked_complete_at != null ||
      booking.client_marked_complete_at != null
    ) {
      return { error: "Cannot cancel after completion has started." };
    }

    return { error: "This booking can no longer be cancelled." };
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
  revalidatePath(`/cleaner/jobs/${bookingId}`);
  revalidatePath("/cleaner/dashboard");
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
