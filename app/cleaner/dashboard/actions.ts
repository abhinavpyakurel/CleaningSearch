"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  dayStatesToWindows,
  DAY_LABELS,
  normalizeTimeToMinutes,
  type DayAvailabilityState,
} from "@/lib/cleaner-availability";
import {
  createAccountOnboardingLink,
  createExpressConnectedAccount,
  fetchCleanerStripeStatus,
  type CleanerStripeStatus,
} from "@/lib/stripe/connect";
import { createClient } from "@/lib/supabase/server";

const BIO_MAX_LENGTH = 300;

export type UpdateCleanerProfileState = {
  error?: string;
  success?: boolean;
};

export type SaveCleanerAvailabilityState = {
  error?: string;
  success?: boolean;
};

function parseAvailabilityFromFormData(
  formData: FormData
): { windows: ReturnType<typeof dayStatesToWindows> } | { error: string } {
  const dayStates: DayAvailabilityState[] = DAY_LABELS.map((_, dayOfWeek) => {
    const enabled =
      String(formData.get(`day_${dayOfWeek}_enabled`) ?? "").toLowerCase() ===
      "true";
    const startTime = String(formData.get(`day_${dayOfWeek}_start`) ?? "").trim();
    const endTime = String(formData.get(`day_${dayOfWeek}_end`) ?? "").trim();

    return {
      enabled,
      startTime: startTime || "09:00",
      endTime: endTime || "17:00",
    };
  });

  for (const [index, day] of dayStates.entries()) {
    if (!day.enabled) {
      continue;
    }

    const startMinutes = normalizeTimeToMinutes(day.startTime);
    const endMinutes = normalizeTimeToMinutes(day.endTime);
    if (startMinutes == null || endMinutes == null) {
      return {
        error: `${DAY_LABELS[index]} has an invalid time.`,
      };
    }

    if (endMinutes <= startMinutes) {
      return {
        error: `${DAY_LABELS[index]} end time must be after the start time.`,
      };
    }
  }

  return { windows: dayStatesToWindows(dayStates) };
}

export async function saveCleanerAvailabilityAction(
  _prevState: SaveCleanerAvailabilityState,
  formData: FormData
): Promise<SaveCleanerAvailabilityState> {
  const parsed = parseAvailabilityFromFormData(formData);
  if ("error" in parsed) {
    return { error: parsed.error };
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
    return { error: "Only cleaners can update availability." };
  }

  const { error: deleteError } = await supabase
    .from("cleaner_availability_windows")
    .delete()
    .eq("cleaner_id", user.id);

  if (deleteError) {
    return { error: deleteError.message };
  }

  if (parsed.windows.length > 0) {
    const rows = parsed.windows.map((window) => ({
      cleaner_id: user.id,
      day_of_week: window.day_of_week,
      start_time: window.start_time,
      end_time: window.end_time,
      updated_at: new Date().toISOString(),
    }));

    const { error: insertError } = await supabase
      .from("cleaner_availability_windows")
      .insert(rows);

    if (insertError) {
      return { error: insertError.message };
    }
  }

  revalidatePath("/cleaner/dashboard");
  revalidatePath("/cleaner/availability");
  revalidatePath("/client/cleaners");
  revalidatePath(`/client/cleaners/${user.id}`);
  return { success: true };
}

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
  revalidatePath("/cleaner/availability");
  revalidatePath("/client/cleaners");
  revalidatePath(`/client/cleaners/${user.id}`);
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

async function requireCleanerWithProfile(): Promise<
  | { error: "unauthenticated" }
  | { error: "forbidden" }
  | { error: "no_profile" }
  | {
      user: { id: string; email?: string };
      cleanerProfile: {
        stripe_account_id: string | null;
      };
    }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "unauthenticated" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.role !== "cleaner") {
    return { error: "forbidden" };
  }

  const { data: cleanerProfile } = await supabase
    .from("cleaner_profiles")
    .select("stripe_account_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!cleanerProfile) {
    return { error: "no_profile" };
  }

  return { user, cleanerProfile };
}

export async function syncCleanerStripeStatus(
  userId: string,
  accountId: string
): Promise<CleanerStripeStatus | null> {
  const supabase = await createClient();
  const status = await fetchCleanerStripeStatus(accountId);

  const { error } = await supabase
    .from("cleaner_profiles")
    .update(status)
    .eq("user_id", userId)
    .eq("stripe_account_id", accountId);

  if (error) {
    return null;
  }

  revalidatePath("/cleaner/dashboard");
  return status;
}

async function redirectToPayoutOnboarding(
  userId: string,
  email: string | null | undefined,
  existingAccountId: string | null
): Promise<never> {
  const supabase = await createClient();
  let accountId = existingAccountId;

  if (!accountId) {
    const account = await createExpressConnectedAccount(email);
    accountId = account.id;

    const { error } = await supabase
      .from("cleaner_profiles")
      .update({ stripe_account_id: accountId })
      .eq("user_id", userId);

    if (error) {
      redirect("/cleaner/dashboard?payout_error=save_failed");
    }
  }

  const onboardingUrl = await createAccountOnboardingLink(accountId);
  redirect(onboardingUrl);
}

export async function startPayoutSetupAction(): Promise<void> {
  const result = await requireCleanerWithProfile();

  if ("error" in result) {
    if (result.error === "unauthenticated") {
      redirect("/login");
    }
    redirect("/client/home");
  }

  await redirectToPayoutOnboarding(
    result.user.id,
    result.user.email,
    result.cleanerProfile.stripe_account_id
  );
}

export async function refreshPayoutSetupAction(): Promise<void> {
  const result = await requireCleanerWithProfile();

  if ("error" in result) {
    if (result.error === "unauthenticated") {
      redirect("/login");
    }
    redirect("/client/home");
  }

  if (!result.cleanerProfile.stripe_account_id) {
    redirect("/cleaner/dashboard");
  }

  const onboardingUrl = await createAccountOnboardingLink(
    result.cleanerProfile.stripe_account_id
  );
  redirect(onboardingUrl);
}
