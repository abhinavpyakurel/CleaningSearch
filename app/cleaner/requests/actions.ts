"use server";

import { revalidatePath } from "next/cache";

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
    return { supabase, user: null, error: "Only cleaners can manage requests." as const };
  }

  return { supabase, user, error: null };
}

async function updatePendingRequest(
  formData: FormData,
  status: "confirmed" | "cancelled"
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

  revalidatePath("/cleaner/requests");
  return { error: null };
}

export async function acceptRequestAction(
  formData: FormData
): Promise<{ error: string | null }> {
  return updatePendingRequest(formData, "confirmed");
}

export async function declineRequestAction(
  formData: FormData
): Promise<{ error: string | null }> {
  return updatePendingRequest(formData, "cancelled");
}
