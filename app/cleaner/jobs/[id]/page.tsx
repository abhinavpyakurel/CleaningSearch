import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Calendar, Clock, MapPin } from "lucide-react";

import { MarkJobCompleteForm } from "@/app/cleaner/jobs/[id]/mark-complete-form";
import { SiteHeader } from "@/components/site-header";
import { getPayoutStatusLabel } from "@/lib/booking-completion";
import { createClient } from "@/lib/supabase/server";

type JobPageProps = {
  params: { id: string };
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  countered: "Countered",
  accepted_pending_payment: "Awaiting client payment",
  confirmed: "Paid and confirmed",
  in_progress: "In progress",
  completed: "Completed",
  disputed: "Disputed",
  cancelled: "Cancelled",
  declined: "Declined",
};

function getStatusLabel(status: string, paymentStatus: string): string {
  if (status === "confirmed" && paymentStatus === "paid") {
    return "Paid and confirmed";
  }

  return STATUS_LABELS[status] ?? status;
}

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

export default async function JobPage({ params }: JobPageProps) {
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

  const { data: booking, error } = await supabase
    .from("bookings")
    .select(
      "id, service_address, scheduled_at, duration_hours, notes, status, payment_status, cleaner_marked_complete_at, client_marked_complete_at, payout_status"
    )
    .eq("id", params.id)
    .eq("cleaner_id", user.id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!booking) {
    notFound();
  }

  const isAwaitingPayment = booking.status === "accepted_pending_payment";
  const isPaidAndConfirmed =
    booking.status === "confirmed" && booking.payment_status === "paid";

  const canMarkComplete =
    isPaidAndConfirmed && booking.cleaner_marked_complete_at == null;
  const waitingForClient =
    isPaidAndConfirmed &&
    booking.cleaner_marked_complete_at != null &&
    booking.client_marked_complete_at == null;

  return (
    <>
      <SiteHeader />
      <div className="min-h-screen w-full bg-[#F5F5F0]">
        <header className="mx-auto max-w-3xl px-6 pb-6 pt-12">
          <Link
            href="/cleaner/dashboard"
            className="text-sm font-medium text-[#00695C] hover:underline"
          >
            ← Back to dashboard
          </Link>
          <h1 className="mt-4 text-3xl font-bold text-gray-900">Job details</h1>
          <p className="mt-1 text-base text-gray-500">
            {getStatusLabel(booking.status, booking.payment_status)}
          </p>
        </header>

        <section className="mx-auto max-w-3xl px-6 pb-16">
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="grid gap-4 text-sm text-gray-700">
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Address
                  </p>
                  <p className="mt-1 text-base font-semibold text-gray-900">
                    {booking.service_address ?? "No address"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Scheduled
                  </p>
                  <p className="mt-1">{formatScheduledAt(booking.scheduled_at)}</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Duration
                  </p>
                  <p className="mt-1">{formatDuration(booking.duration_hours)}</p>
                </div>
              </div>
            </div>

            {booking.notes ? (
              <p className="mt-4 text-sm italic text-gray-500 whitespace-pre-wrap">
                {booking.notes}
              </p>
            ) : null}

            <div className="mt-6 flex flex-col gap-2">
              {isAwaitingPayment ? (
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-orange-700">
                    Awaiting client payment
                  </p>
                  <p className="text-sm text-gray-600">
                    This booking is not confirmed until the client pays.
                  </p>
                </div>
              ) : null}

              {isPaidAndConfirmed ? (
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-green-700">
                    Paid and confirmed
                  </p>
                  <p className="text-sm text-gray-600">
                    Payout locked until both sides confirm completion.
                  </p>
                </div>
              ) : null}

              {canMarkComplete ? (
                <MarkJobCompleteForm bookingId={booking.id} />
              ) : null}

              {waitingForClient ? (
                <p className="text-sm text-gray-600">
                  Marked complete. Waiting for client confirmation.
                </p>
              ) : null}

              {booking.status === "completed" ? (
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-green-700">Completed</p>
                  <p className="text-sm text-gray-600">
                    Payout status: {getPayoutStatusLabel(booking.payout_status)}
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
