"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

const BIO_MAX_LENGTH = 300;

export type UpdateCleanerProfileState = {
  error?: string;
  success?: boolean;
};

function parseRequiredPositiveNumber(
  value: FormDataEntryValue | null,
  label: string
): { value: number | null; error?: string } {
  const raw = String(value ?? "").trim();
  if (!raw) {
    return { value: null, error: `${label} is required.` };
  }
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) {
    return { value: null, error: `${label} must be a valid number.` };
  }
  if (parsed <= 0) {
    return { value: null, error: `${label} must be greater than zero.` };
  }
  return { value: parsed };
}

export async function updateCleanerProfileAction(
  _prevState: UpdateCleanerProfileState,
  formData: FormData
): Promise<UpdateCleanerProfileState> {
  const bio = String(formData.get("bio") ?? "").trim();

  if (bio.length > BIO_MAX_LENGTH) {
    return { error: `Bio must be ${BIO_MAX_LENGTH} characters or fewer.` };
  }

  const hourlyRateResult = parseRequiredPositiveNumber(
    formData.get("hourly_rate"),
    "Hourly rate"
  );
  if (hourlyRateResult.error) {
    return { error: hourlyRateResult.error };
  }

  const radiusResult = parseRequiredPositiveNumber(
    formData.get("service_radius_miles"),
    "Service radius"
  );
  if (radiusResult.error) {
    return { error: radiusResult.error };
  }

  const hourlyRate = hourlyRateResult.value!;
  const serviceRadius = radiusResult.value!;

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
    return { error: "Only cleaners can update this profile." };
  }

  const { error } = await supabase
    .from("cleaner_profiles")
    .update({
      bio: bio || null,
      hourly_rate: hourlyRate,
      service_radius_miles: Math.round(serviceRadius),
    })
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/cleaner/dashboard");
  return { success: true };
}

export async function toggleCleanerAvailability(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.role !== "cleaner") {
    return;
  }

  const { data: cleanerProfile } = await supabase
    .from("cleaner_profiles")
    .select("is_available")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!cleanerProfile) {
    return;
  }

  const { error } = await supabase
    .from("cleaner_profiles")
    .update({ is_available: !cleanerProfile.is_available })
    .eq("user_id", user.id);

  if (error) {
    return;
  }

  revalidatePath("/cleaner/dashboard");
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
