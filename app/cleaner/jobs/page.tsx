import { redirect } from "next/navigation";

import { type CleanerJob } from "@/app/cleaner/jobs/job-card";
import {
  GlobalJobsEmptyState,
  JobsTabs,
  type GroupedJobs,
  type JobTab,
} from "@/app/cleaner/jobs/jobs-tabs";
import { createClient } from "@/lib/supabase/server";
import { formatUsdFromCents } from "@/lib/booking-price";

const JOB_STATUSES = [
  "accepted_pending_payment",
  "confirmed",
  "in_progress",
  "completed",
  "cancelled",
  "disputed",
] as const;

function getJobTab(booking: CleanerJob): JobTab {
  if (
    booking.payment_status === "refunded" ||
    booking.status === "cancelled" ||
    booking.status === "disputed"
  ) {
    return "cancelled";
  }

  if (booking.status === "completed") {
    return "completed";
  }

  if (
    booking.status === "accepted_pending_payment" &&
    booking.payment_status === "unpaid"
  ) {
    return "awaiting-payment";
  }

  if (
    (booking.status === "confirmed" || booking.status === "in_progress") &&
    booking.payment_status === "paid"
  ) {
    return "upcoming";
  }

  return "awaiting-payment";
}

function groupJobs(jobs: CleanerJob[]): GroupedJobs {
  const groups: GroupedJobs = {
    upcoming: [],
    "awaiting-payment": [],
    completed: [],
    cancelled: [],
  };

  for (const job of jobs) {
    groups[getJobTab(job)].push(job);
  }

  const sortAsc = (a: CleanerJob, b: CleanerJob) => {
    const aTime = a.scheduled_at ? new Date(a.scheduled_at).getTime() : 0;
    const bTime = b.scheduled_at ? new Date(b.scheduled_at).getTime() : 0;
    return aTime - bTime;
  };

  const sortDesc = (a: CleanerJob, b: CleanerJob) => sortAsc(b, a);

  groups.upcoming.sort(sortAsc);
  groups["awaiting-payment"].sort(sortAsc);
  groups.completed.sort(sortDesc);
  groups.cancelled.sort(sortDesc);

  return groups;
}

function pickDefaultTab(groups: GroupedJobs): JobTab {
  if (groups.upcoming.length > 0) {
    return "upcoming";
  }

  if (groups["awaiting-payment"].length > 0) {
    return "awaiting-payment";
  }

  if (groups.completed.length > 0) {
    return "completed";
  }

  if (groups.cancelled.length > 0) {
    return "cancelled";
  }

  return "upcoming";
}

function sumCompletedPayoutCents(jobs: CleanerJob[]): number {
  return jobs.reduce((sum, job) => {
    const cents = job.cleaner_payout_cents;
    if (cents == null || !Number.isFinite(cents)) {
      return sum;
    }

    return sum + cents;
  }, 0);
}

export default async function CleanerJobsPage() {
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

  const { data: bookings, error } = await supabase
    .from("bookings")
    .select(
      `
      id,
      service_address,
      scheduled_at,
      duration_hours,
      client_requested_hours,
      status,
      payment_status,
      payout_status,
      cleaner_payout_cents,
      cleaner_marked_complete_at,
      client_marked_complete_at,
      scope_snapshot,
      client:profiles!bookings_client_id_fkey ( full_name )
    `
    )
    .eq("cleaner_id", user.id)
    .in("status", [...JOB_STATUSES])
    .order("scheduled_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const jobs = (bookings ?? []) as CleanerJob[];
  const groups = groupJobs(jobs);
  const defaultTab = pickDefaultTab(groups);
  const completedPayoutCents = sumCompletedPayoutCents(groups.completed);

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">My jobs</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {groups.completed.length} completed
            {completedPayoutCents > 0
              ? ` · ${formatUsdFromCents(completedPayoutCents)} total payout on completed jobs`
              : ""}
          </p>
        </header>

        {jobs.length === 0 ? (
          <GlobalJobsEmptyState />
        ) : (
          <JobsTabs
            groups={groups}
            defaultTab={defaultTab}
            completedPayoutCents={completedPayoutCents}
          />
        )}
      </div>
    </main>
  );
}
