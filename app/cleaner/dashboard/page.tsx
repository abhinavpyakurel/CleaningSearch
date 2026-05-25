import Link from "next/link";
import { redirect } from "next/navigation";

import { acceptJobAction } from "@/app/cleaner/dashboard/actions";
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
import { SiteHeader } from "@/components/site-header";

type JobListing = {
  id: string;
  service_address: string | null;
  scheduled_at: string | null;
  duration_hours: number | null;
  notes: string | null;
};

function formatScheduledAt(iso: string | null): string {
  if (!iso) {
    return "Not scheduled";
  }

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "Not scheduled";
  }

  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatDuration(hours: number | null): string {
  if (hours == null || !Number.isFinite(hours)) {
    return "—";
  }

  const label = hours === 1 ? "hour" : "hours";
  return `${hours} ${label}`;
}

function JobCard({
  job,
  showAccept,
}: {
  job: JobListing;
  showAccept?: boolean;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-2 pt-6 text-sm">
        <p>
          <span className="text-muted-foreground">Address: </span>
          {job.service_address ?? "—"}
        </p>
        <p>
          <span className="text-muted-foreground">When: </span>
          {formatScheduledAt(job.scheduled_at)}
        </p>
        <p>
          <span className="text-muted-foreground">Duration: </span>
          {formatDuration(job.duration_hours)}
        </p>
        {job.notes ? (
          <p>
            <span className="text-muted-foreground">Notes: </span>
            <span className="whitespace-pre-wrap">{job.notes}</span>
          </p>
        ) : null}
      </CardContent>
      {showAccept ? (
        <CardFooter>
          <form action={acceptJobAction}>
            <input type="hidden" name="booking_id" value={job.id} />
            <Button type="submit">Accept job</Button>
          </form>
        </CardFooter>
      ) : null}
    </Card>
  );
}

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
    .select("id, role, full_name")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.role !== "cleaner") {
    redirect("/client/home");
  }

  const { data: cleanerProfile } = await supabase
    .from("cleaner_profiles")
    .select(
      "hourly_rate, service_radius_miles, total_jobs, avg_rating, is_available"
    )
    .eq("user_id", user.id)
    .maybeSingle();

  const jobSelect =
    "id, service_address, scheduled_at, duration_hours, notes" as const;

  const [{ data: availableJobs }, { data: myJobs }] = await Promise.all([
    supabase
      .from("bookings")
      .select(jobSelect)
      .eq("status", "pending")
      .is("cleaner_id", null)
      .order("scheduled_at", { ascending: true }),
    supabase
      .from("bookings")
      .select(jobSelect)
      .eq("cleaner_id", user.id)
      .eq("status", "confirmed")
      .order("scheduled_at", { ascending: true }),
  ]);

  const welcomeName = profile.full_name ?? user.email ?? "there";

  return (
    <>
    <SiteHeader/>
    <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col gap-6 p-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome, {welcomeName}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Cleaner dashboard</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Incoming requests</CardTitle>
          <CardDescription>
            Review and respond to booking requests sent directly to you.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button render={<Link href="/cleaner/requests" />}>
            View incoming requests
          </Button>
        </CardFooter>
      </Card>

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

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Available jobs</h2>
        {!availableJobs?.length ? (
          <p className="text-sm text-muted-foreground">
            No available jobs right now.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {availableJobs.map((job) => (
              <li key={job.id}>
                <JobCard job={job} showAccept />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Your assigned jobs</h2>
        {!myJobs?.length ? (
          <p className="text-sm text-muted-foreground">
            No assigned jobs yet.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {myJobs.map((job) => (
              <li key={job.id}>
                <JobCard job={job} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
    </>
  );
}
