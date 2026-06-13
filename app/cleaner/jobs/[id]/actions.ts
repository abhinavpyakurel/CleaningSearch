"use server";

import { revalidatePath } from "next/cache";

import { buildCompletionUpdate } from "@/lib/booking-completion";
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
