"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { normalizeProfilePhotoUrl } from "@/lib/profiles";
import { createClient } from "@/lib/supabase/server";

export type OnboardingActionState = {
  error?: string;
};

function parseRequiredNumber(
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
  return { value: parsed };
}

export async function onboardingAction(
  _prevState: OnboardingActionState,
  formData: FormData
): Promise<OnboardingActionState> {
  const fullName = String(formData.get("full_name") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();
  const profilePhotoUrl = normalizeProfilePhotoUrl(
    String(formData.get("profile_photo_url") ?? "")
  );

  if (!fullName) {
    return { error: "Full name is required." };
  }

  if (!profilePhotoUrl) {
    return { error: "Profile photo URL is required." };
  }

  const hourlyRateResult = parseRequiredNumber(
    formData.get("hourly_rate"),
    "Hourly rate"
  );
  if (hourlyRateResult.error) {
    return { error: hourlyRateResult.error };
  }

  const radiusResult = parseRequiredNumber(
    formData.get("service_radius_miles"),
    "Service radius"
  );
  if (radiusResult.error) {
    return { error: radiusResult.error };
  }

  const experienceResult = parseRequiredNumber(
    formData.get("years_experience"),
    "Years of experience"
  );
  if (experienceResult.error) {
    return { error: experienceResult.error };
  }

  const hourlyRate = hourlyRateResult.value!;
  const serviceRadius = radiusResult.value!;
  const yearsExperience = experienceResult.value!;

  if (hourlyRate <= 0) {
    return { error: "Hourly rate must be greater than zero." };
  }

  if (serviceRadius <= 0) {
    return { error: "Service radius must be greater than zero." };
  }

  if (yearsExperience < 0 || !Number.isInteger(yearsExperience)) {
    return { error: "Years of experience must be a whole number of 0 or more." };
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

  if (!profile || profile.role !== "cleaner") {
    redirect("/client/home");
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ full_name: fullName })
    .eq("id", user.id);

  if (profileError) {
    return { error: profileError.message };
  }

  const { error: cleanerError } = await supabase.from("cleaner_profiles").upsert(
    {
      user_id: user.id,
      bio: bio || null,
      profile_photo_url: profilePhotoUrl,
      hourly_rate: hourlyRate,
      service_radius_miles: Math.round(serviceRadius),
      years_experience: yearsExperience,
      is_available: true,
    },
    { onConflict: "user_id" }
  );

  if (cleanerError) {
    return { error: cleanerError.message };
  }

  revalidatePath("/cleaner/dashboard");
  redirect("/cleaner/dashboard");
}
