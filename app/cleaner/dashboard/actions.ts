"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export async function updateCleanerAvailability(
  isAvailable: boolean
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated." };
  }

  const { error } = await supabase
    .from("cleaner_profiles")
    .update({ is_available: isAvailable })
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/cleaner/dashboard");
  return { error: null };
}

export async function acceptJobAction(
  formData: FormData
): Promise<{ error: string | null }> {
  const bookingId = String(formData.get("booking_id") ?? "").trim();
  if (!bookingId) {
    return { error: "Invalid job." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.role !== "cleaner") {
    return { error: "Only cleaners can accept jobs." };
  }

  console.log("acceptJobAction called", { bookingId, userId: user.id });
  

  const { data, error } = await supabase
    .from("bookings")
    .update({ cleaner_id: user.id, status: "confirmed" })
    .eq("id", bookingId)
    .is("cleaner_id", null)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("acceptJobAction supabase error", error);
    return { error: error.message };
  }

  if (!data) {
    return { error: "This job is no longer available." };
  }

  revalidatePath("/cleaner/dashboard");
  return { error: null };
}
