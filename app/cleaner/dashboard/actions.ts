"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

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
