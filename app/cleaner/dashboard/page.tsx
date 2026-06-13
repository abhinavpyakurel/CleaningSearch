import Link from "next/link";
import { redirect } from "next/navigation";
import { CornerLeftDown } from "lucide-react";
import {
  toggleCleanerAvailability,
} from "@/app/cleaner/dashboard/actions";
import { CleanerStatsCard } from "@/app/cleaner/dashboard/cleaner-stats-card";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/site-header";

type JobListing = {
  id: string;
  service_address: string | null;
  scheduled_at: string | null;
  duration_hours: number | null;
  notes: string | null;
  cleaner_marked_complete_at?: string | null;
  client_marked_complete_at?: string | null;
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
  showCompletionHint,
}: {
  job: JobListing;
  showCompletionHint?: boolean;
}) {
  const waitingForClient =
    showCompletionHint &&
    job.cleaner_marked_complete_at != null &&
    job.client_marked_complete_at == null;

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-2 text-sm text-gray-700">
        <p>
          <span className="text-gray-500">Address: </span>
          {job.service_address ?? "—"}
        </p>
        <p>
          <span className="text-gray-500">When: </span>
          {formatScheduledAt(job.scheduled_at)}
        </p>
        <p>
          <span className="text-gray-500">Duration: </span>
          {formatDuration(job.duration_hours)}
        </p>
        {job.notes ? (
          <p>
            <span className="text-gray-500">Notes: </span>
            <span className="whitespace-pre-wrap">{job.notes}</span>
          </p>
        ) : null}

        {waitingForClient ? (
          <p className="text-sm text-gray-500">
            Waiting for client confirmation.
          </p>
        ) : null}
      </div>

      <Link
        href={`/cleaner/jobs/${job.id}`}
        className="mt-4 inline-block text-sm font-semibold text-[#00695C] hover:underline"
      >
        View job details
      </Link>
    </div>
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
      "hourly_rate, service_radius_miles, bio, total_jobs, avg_rating, is_available"
    )
    .eq("user_id", user.id)
    .maybeSingle();

  const jobSelect =
    "id, service_address, scheduled_at, duration_hours, notes, cleaner_marked_complete_at, client_marked_complete_at" as const;

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
      <SiteHeader />
      <div className="relative min-h-screen max-w-screen bg-[#F5F5F0]">
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-80 w-80 rounded-full bg-[#00695C] opacity-5"
          aria-hidden
        />

        <section className="relative mx-auto max-w-5xl px-6 pb-8 pt-12">
          <h1 className="text-4xl font-bold text-gray-900">
            Welcome, {welcomeName}
          </h1>
          <p className="mt-1 text-base text-gray-500">Cleaner dashboard</p>
        </section>

        <div className="relative mx-auto max-w-5xl px-6 pb-16">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900">
                  Incoming requests <CornerLeftDown className="size-4" />
                </h2>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Review and respond to booking requests sent directly to you.
              </p>
              <Link
                href="/cleaner/requests"
                className="mt-6 inline-block rounded-xl bg-[#00695C] px-6 py-3 font-semibold text-white transition-all hover:bg-[#00695C]/80 hover:text-white"
              >
                View incoming requests
              </Link>
            </div>

            {!cleanerProfile ? (
              <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
                <h2 className="text-xl font-bold text-gray-900">
                  Complete your cleaner profile
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Add your rates and service area to start receiving jobs.
                </p>
                <Link
                  href="/cleaner/onboarding"
                  className="mt-6 inline-block rounded-xl bg-[#00695C] px-6 py-3 font-semibold text-white transition-all hover:bg-[#004D40]"
                >
                  Finish onboarding
                </Link>
              </div>
            ) : (
              <CleanerStatsCard
                hourlyRate={cleanerProfile.hourly_rate}
                serviceRadiusMiles={cleanerProfile.service_radius_miles}
                bio={cleanerProfile.bio}
                totalJobs={cleanerProfile.total_jobs}
                avgRating={cleanerProfile.avg_rating}
              />
            )}
          </div>

          {cleanerProfile ? (
            <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-8 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Job availability
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Let clients know whether you are open to new bookings.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {cleanerProfile.is_available ? (
                  <span className="rounded-full bg-green-50 px-4 py-2 text-sm font-semibold text-green-700">
                    ● Available for jobs
                  </span>
                ) : (
                  <span className="rounded-full bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-600">
                    ○ Not available
                  </span>
                )}
                <form action={toggleCleanerAvailability}>
                  <button
                    type="submit"
                    className={
                      cleanerProfile.is_available
                        ? "rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-600 transition-all hover:border-red-300 hover:text-red-500"
                        : "rounded-xl bg-[#00695C] px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-[#004D40]"
                    }
                  >
                    {cleanerProfile.is_available
                      ? "Go unavailable"
                      : "Go available"}
                  </button>
                </form>
              </div>
            </div>
          ) : null}

          <section className="mt-10 flex flex-col gap-4">
            <h2 className="text-xl font-bold text-gray-900">Available jobs</h2>
            {!availableJobs?.length ? (
              <p className="text-sm text-gray-500">
                No available jobs right now.
              </p>
            ) : (
              <ul className="flex flex-col gap-4">
                {availableJobs.map((job) => (
                  <li key={job.id}>
                    <JobCard job={job} />
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="mt-10 flex flex-col gap-4">
            <h2 className="text-xl font-bold text-gray-900">
              Your assigned jobs
            </h2>
            {!myJobs?.length ? (
              <p className="text-sm text-gray-500">No assigned jobs yet.</p>
            ) : (
              <ul className="flex flex-col gap-4">
                {myJobs.map((job) => (
                  <li key={job.id}>
                    <JobCard job={job} showCompletionHint />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
