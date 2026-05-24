import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/server";

async function submitCleanerOnboarding(formData: FormData) {
  "use server";

  const fullName = String(formData.get("full_name") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();
  const hourlyRateRaw = String(formData.get("hourly_rate") ?? "").trim();
  const serviceRadiusRaw = String(formData.get("service_radius_miles") ?? "").trim();

  if (!fullName) {
    redirect("/cleaner/onboarding?error=" + encodeURIComponent("Full name is required."));
  }

  const hourlyRate = Number(hourlyRateRaw);
  const serviceRadius = Number(serviceRadiusRaw);

  if (!hourlyRateRaw || !Number.isFinite(hourlyRate) || hourlyRate <= 0) {
    redirect(
      "/cleaner/onboarding?error=" +
        encodeURIComponent("Hourly rate must be a number greater than zero.")
    );
  }

  if (!serviceRadiusRaw || !Number.isFinite(serviceRadius) || serviceRadius <= 0) {
    redirect(
      "/cleaner/onboarding?error=" +
        encodeURIComponent("Service radius must be a number greater than zero.")
    );
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
    redirect("/cleaner/onboarding?error=" + encodeURIComponent(profileError.message));
  }

  const { error: cleanerError } = await supabase.from("cleaner_profiles").upsert(
    {
      user_id: user.id,
      bio: bio || null,
      hourly_rate: hourlyRate,
      service_radius_miles: Math.round(serviceRadius),
      is_available: true,
    },
    { onConflict: "user_id" }
  );

  if (cleanerError) {
    redirect("/cleaner/onboarding?error=" + encodeURIComponent(cleanerError.message));
  }

  revalidatePath("/cleaner/dashboard");
  redirect("/cleaner/dashboard");
}

type CleanerOnboardingPageProps = {
  searchParams: { error?: string };
};

export default async function CleanerOnboardingPage({
  searchParams,
}: CleanerOnboardingPageProps) {
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
    .select("bio, hourly_rate, service_radius_miles")
    .eq("user_id", user.id)
    .maybeSingle();

  const errorMessage = searchParams.error
    ? decodeURIComponent(searchParams.error)
    : null;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center p-8">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl">Cleaner onboarding</CardTitle>
          <CardDescription>
            Tell clients about your experience and service area.
          </CardDescription>
        </CardHeader>
        <form action={submitCleanerOnboarding}>
          <CardContent className="flex flex-col gap-4">
            {errorMessage ? (
              <p
                role="alert"
                className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                {errorMessage}
              </p>
            ) : null}
            <div className="flex flex-col gap-2">
              <Label htmlFor="full_name">Full name</Label>
              <Input
                id="full_name"
                name="full_name"
                type="text"
                autoComplete="name"
                required
                defaultValue={profile.full_name ?? ""}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                name="bio"
                rows={4}
                placeholder="Describe your cleaning experience and specialties."
                defaultValue={cleanerProfile?.bio ?? ""}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="hourly_rate">Hourly rate ($)</Label>
              <Input
                id="hourly_rate"
                name="hourly_rate"
                type="number"
                min={1}
                step={0.01}
                required
                defaultValue={
                  cleanerProfile?.hourly_rate != null
                    ? String(cleanerProfile.hourly_rate)
                    : undefined
                }
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="service_radius_miles">Service radius (miles)</Label>
              <Input
                id="service_radius_miles"
                name="service_radius_miles"
                type="number"
                min={1}
                step={1}
                required
                defaultValue={
                  cleanerProfile?.service_radius_miles != null
                    ? String(cleanerProfile.service_radius_miles)
                    : undefined
                }
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full">
              Save and continue
            </Button>
          </CardFooter>
        </form>
      </Card>
    </main>
  );
}
