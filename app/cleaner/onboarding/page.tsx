import { redirect } from "next/navigation";

import { OnboardingForm } from "@/app/cleaner/onboarding/onboarding-form";
import { createClient } from "@/lib/supabase/server";

export default async function CleanerOnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.role !== "cleaner") {
    redirect("/client/home");
  }

  const { data: cleanerProfile } = await supabase
    .from("cleaner_profiles")
    .select(
      "bio, hourly_rate, service_radius_miles, years_experience, profile_photo_url"
    )
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center p-8">
      <OnboardingForm
        defaultFullName={profile.full_name ?? ""}
        defaultBio={cleanerProfile?.bio ?? ""}
        defaultHourlyRate={
          cleanerProfile?.hourly_rate != null
            ? String(cleanerProfile.hourly_rate)
            : ""
        }
        defaultServiceRadius={
          cleanerProfile?.service_radius_miles != null
            ? String(cleanerProfile.service_radius_miles)
            : ""
        }
        defaultYearsExperience={
          cleanerProfile?.years_experience != null
            ? String(cleanerProfile.years_experience)
            : ""
        }
        defaultProfilePhotoUrl={cleanerProfile?.profile_photo_url ?? ""}
      />
    </main>
  );
}
