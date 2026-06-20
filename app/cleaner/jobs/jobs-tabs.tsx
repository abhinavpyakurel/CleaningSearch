"use client";

import Link from "next/link";
import {
  BriefcaseBusiness,
  CalendarCheck,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";

import { JobCard, type CleanerJob } from "@/app/cleaner/jobs/job-card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatUsdFromCents } from "@/lib/booking-price";

export type JobTab = "upcoming" | "awaiting-payment" | "completed" | "cancelled";

export type GroupedJobs = Record<JobTab, CleanerJob[]>;

type JobsTabsProps = {
  groups: GroupedJobs;
  defaultTab: JobTab;
  completedPayoutCents: number;
};

const tabTriggerClassName =
  "rounded-full px-4 py-2 text-muted-foreground transition-all duration-200 ease-in-out hover:text-foreground data-[active]:bg-gray-200 data-[active]:font-medium data-[active]:text-foreground data-[active]:shadow-sm";

function TabCount({ count }: { count: number }) {
  if (count <= 0) {
    return null;
  }

  return (
    <span className="ml-1.5 flex size-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
      {count}
    </span>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card py-16 text-center">
      <Icon className="mx-auto mb-3 size-10 text-muted-foreground/40" />
      <p className="mb-1 font-semibold text-foreground">{title}</p>
      <p className="mb-4 text-sm text-muted-foreground">{description}</p>
      {action}
    </div>
  );
}

function JobList({ jobs }: { jobs: CleanerJob[] }) {
  return (
    <div className="flex flex-col gap-4">
      {jobs.map((job) => (
        <JobCard key={job.id} job={job} />
      ))}
    </div>
  );
}

export function JobsTabs({
  groups,
  defaultTab,
  completedPayoutCents,
}: JobsTabsProps) {
  const completedCount = groups.completed.length;
  const cancelledCount = groups.cancelled.length;

  return (
    <Tabs defaultValue={defaultTab}>
      <TabsList className="mb-6 h-auto w-full justify-start gap-1 overflow-x-auto rounded-full bg-muted p-1 sm:w-fit">
        <TabsTrigger value="upcoming" className={tabTriggerClassName}>
          Upcoming
          <TabCount count={groups.upcoming.length} />
        </TabsTrigger>
        <TabsTrigger value="awaiting-payment" className={tabTriggerClassName}>
          Awaiting payment
          <TabCount count={groups["awaiting-payment"].length} />
        </TabsTrigger>
        <TabsTrigger value="completed" className={tabTriggerClassName}>
          Completed
          <TabCount count={completedCount} />
        </TabsTrigger>
        <TabsTrigger value="cancelled" className={tabTriggerClassName}>
          Cancelled
          <TabCount count={cancelledCount} />
        </TabsTrigger>
      </TabsList>

      <TabsContent value="upcoming">
        {groups.upcoming.length === 0 ? (
          <EmptyState
            icon={CalendarCheck}
            title="No upcoming jobs"
            description="Paid and confirmed bookings will appear here."
            action={
              <Link href="/cleaner/requests">
                <Button size="sm" variant="outline">
                  Review requests
                </Button>
              </Link>
            }
          />
        ) : (
          <JobList jobs={groups.upcoming} />
        )}
      </TabsContent>

      <TabsContent value="awaiting-payment">
        {groups["awaiting-payment"].length === 0 ? (
          <EmptyState
            icon={Clock}
            title="No jobs awaiting payment"
            description="Accepted bookings waiting for client checkout will appear here."
          />
        ) : (
          <JobList jobs={groups["awaiting-payment"]} />
        )}
      </TabsContent>

      <TabsContent value="completed">
        {completedCount === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title="No completed jobs yet"
            description="Finished jobs and payout status will appear here."
          />
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 rounded-xl border border-primary/10 bg-accent/30 p-4">
              <CheckCircle2 className="size-5 shrink-0 text-primary" />
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {completedCount} job{completedCount === 1 ? "" : "s"} completed
                </p>
                {completedPayoutCents > 0 ? (
                  <p className="text-xs text-muted-foreground">
                    {formatUsdFromCents(completedPayoutCents)} total cleaner payout
                    recorded on completed jobs
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Payout amounts appear once jobs are priced and completed.
                  </p>
                )}
              </div>
            </div>
            <JobList jobs={groups.completed} />
          </div>
        )}
      </TabsContent>

      <TabsContent value="cancelled">
        {cancelledCount === 0 ? (
          <EmptyState
            icon={XCircle}
            title="No cancelled jobs"
            description="Cancelled, refunded, or disputed bookings will appear here."
          />
        ) : (
          <JobList jobs={groups.cancelled} />
        )}
      </TabsContent>
    </Tabs>
  );
}

export function GlobalJobsEmptyState() {
  return (
    <section className="rounded-xl border border-dashed border-border bg-card py-24 text-center">
      <BriefcaseBusiness className="mx-auto mb-3 size-10 text-muted-foreground/40" />
      <p className="text-xl font-semibold text-foreground">No jobs yet</p>
      <p className="mt-2 text-sm text-muted-foreground">
        Accept requests to start building your schedule.
      </p>
      <Link href="/cleaner/requests" className="mt-6 inline-block">
        <Button size="sm">Go to requests</Button>
      </Link>
    </section>
  );
}
