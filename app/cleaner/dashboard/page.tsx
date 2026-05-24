import Link from "next/link";
import { redirect } from "next/navigation";

import { AvailabilityToggle } from "@/app/cleaner/dashboard/availability-toggle";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export default async function CleanerDashboardPage() {
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

  const { data: cleanerProfile } = await supabase
    .from("cleaner_profiles")
    .select(
      "hourly_rate, service_radius_miles, total_jobs, avg_rating, is_available"
    )
    .eq("user_id", user.id)
    .maybeSingle();

  const welcomeName = profile?.full_name ?? user.email ?? "there";

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col gap-6 p-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome, {welcomeName}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Cleaner dashboard</p>
      </header>

      {!cleanerProfile ? (
        <Card>
          <CardHeader>
            <CardTitle>Complete your cleaner profile</CardTitle>
            <CardDescription>
              Add your rates and service area to start receiving jobs.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button render={<Link href="/cleaner/onboarding" />}>
              Finish onboarding
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Your stats</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            <p>
              <span className="text-muted-foreground">Hourly rate: </span>
              {cleanerProfile.hourly_rate != null
                ? `$${cleanerProfile.hourly_rate}/hr`
                : "Not set"}
            </p>
            <p>
              <span className="text-muted-foreground">Service radius: </span>
              {cleanerProfile.service_radius_miles != null
                ? `${cleanerProfile.service_radius_miles} mi`
                : "Not set"}
            </p>
            <p>
              <span className="text-muted-foreground">Total jobs: </span>
              {cleanerProfile.total_jobs}
            </p>
            <p>
              <span className="text-muted-foreground">Average rating: </span>
              {cleanerProfile.avg_rating.toFixed(1)}
            </p>
          </CardContent>
          <CardFooter className="border-t border-border pt-6">
            <AvailabilityToggle initialAvailable={cleanerProfile.is_available} />
          </CardFooter>
        </Card>
      )}

      <section>
        <h2 className="text-lg font-semibold">Today&apos;s jobs</h2>
        <p className="mt-2 text-sm text-muted-foreground">No jobs yet</p>
      </section>
    </main>
  );
}
