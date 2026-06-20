import Link from "next/link";
import { Calendar, Clock, Home, MapPin } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getPayoutStatusLabel } from "@/lib/booking-completion";
import { formatUsdFromCents } from "@/lib/booking-price";
import {
  getCleanerStatusBadgeVariant,
  getCleanerStatusLabel,
} from "@/lib/cleaner-booking-labels";
import { getSelectedAreaLabels, parseScopeSnapshot } from "@/lib/counter-offer";
import { getServiceTypeLabel } from "@/lib/intake-estimate";
import { cn } from "@/lib/utils";
import type { Json } from "@/lib/database.types";

export type CleanerJob = {
  id: string;
  service_address: string | null;
  scheduled_at: string | null;
  duration_hours: number | null;
  client_requested_hours: number | null;
  status: string;
  payment_status: string;
  payout_status: string | null;
  cleaner_payout_cents: number | null;
  cleaner_marked_complete_at: string | null;
  client_marked_complete_at: string | null;
  scope_snapshot: Json | null;
  client: { full_name: string | null } | null;
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

function clientName(job: CleanerJob): string {
  return job.client?.full_name?.trim() || "Client";
}

function clientInitial(name: string): string {
  return name.trim() ? name.trim()[0]!.toUpperCase() : "C";
}

function getPaymentStatusLabel(paymentStatus: string): string {
  switch (paymentStatus) {
    case "paid":
      return "Paid";
    case "refunded":
      return "Refunded";
    case "unpaid":
      return "Unpaid";
    default:
      return paymentStatus;
  }
}

function getDisplayStatusLabel(job: CleanerJob): string {
  if (job.status === "completed" && job.payout_status === "ready") {
    return "Payout eligible";
  }

  if (job.status === "completed" && job.payout_status === "paid") {
    return "Paid out";
  }

  if (job.payout_status === "paused") {
    return "Payout paused";
  }

  return getCleanerStatusLabel(job.status, job.payment_status);
}

function scopeSummary(job: CleanerJob): string | null {
  const scope = parseScopeSnapshot(job.scope_snapshot);
  if (!scope) {
    return null;
  }

  const areas = getSelectedAreaLabels(scope.input);
  const serviceLabel = getServiceTypeLabel(scope.input.service_type);

  if (areas.length === 0) {
    return serviceLabel;
  }

  if (areas.length <= 2) {
    return `${serviceLabel} · ${areas.join(", ")}`;
  }

  return `${serviceLabel} · ${areas.slice(0, 2).join(", ")} +${areas.length - 2} more`;
}

function showPayoutLabel(job: CleanerJob): boolean {
  return (
    job.status === "completed" &&
    job.payout_status != null &&
    ["ready", "paid", "paused", "locked"].includes(job.payout_status)
  );
}

export function JobCard({ job }: { job: CleanerJob }) {
  const name = clientName(job);
  const estimatedHours = job.client_requested_hours ?? job.duration_hours;
  const summary = scopeSummary(job);
  const waitingForClient =
    job.status === "confirmed" &&
    job.payment_status === "paid" &&
    job.cleaner_marked_complete_at != null &&
    job.client_marked_complete_at == null;

  return (
    <Card className="border border-border shadow-sm">
      <CardContent className="p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-accent font-bold text-accent-foreground">
            {clientInitial(name)}
          </div>

          <div className="min-w-0 flex-1">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-foreground">{name}</span>
              <Badge
                variant={getCleanerStatusBadgeVariant(job.status, job.payment_status)}
                className="text-xs"
              >
                {getDisplayStatusLabel(job)}
              </Badge>
            </div>

            <div className="mb-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="size-3.5 shrink-0" />
                {formatScheduledAt(job.scheduled_at)}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="size-3.5 shrink-0" />
                {formatDuration(estimatedHours)}
              </span>
              {job.service_address ? (
                <span className="flex items-center gap-1">
                  <MapPin className="size-3.5 shrink-0" />
                  <span className="truncate">{job.service_address}</span>
                </span>
              ) : null}
            </div>

            {summary ? (
              <p className="mb-2 flex items-start gap-1.5 text-xs text-muted-foreground">
                <Home className="mt-0.5 size-3.5 shrink-0" />
                {summary}
              </p>
            ) : null}

            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span>Payment: {getPaymentStatusLabel(job.payment_status)}</span>
              {showPayoutLabel(job) ? (
                <span>Payout: {getPayoutStatusLabel(job.payout_status!)}</span>
              ) : null}
            </div>

            {waitingForClient ? (
              <p className="mt-2 text-xs text-muted-foreground">
                Waiting for client confirmation.
              </p>
            ) : null}
          </div>

          <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
            {job.cleaner_payout_cents != null ? (
              <div className="text-left sm:text-right">
                <p className="text-base font-bold text-foreground">
                  {formatUsdFromCents(job.cleaner_payout_cents)}
                </p>
                <p className="text-xs text-muted-foreground">Your payout</p>
              </div>
            ) : null}
            <Link
              href={`/cleaner/jobs/${job.id}`}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              View details
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
