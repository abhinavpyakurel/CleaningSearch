import { redirect } from "next/navigation";
import { Calendar, Clock, Home, Inbox, MapPin } from "lucide-react";

import { DashboardEmptyState } from "@/app/cleaner/_components/dashboard-empty-state";
import { CounterOfferForm } from "@/app/cleaner/requests/counter-offer-form";
import { RequestResponseForms } from "@/app/cleaner/requests/request-response-forms";
import { BookingPhotoGallery } from "@/app/cleaner/requests/booking-photo-gallery";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  computeAcceptedBookingPricingCents,
  formatHourlyRate,
  formatUsdFromCents,
} from "@/lib/booking-price";
import { getCleanerStatusLabel } from "@/lib/cleaner-booking-labels";
import {
  getCounterEditableFields,
  getSelectedAreaLabels,
  parseScopeSnapshot,
} from "@/lib/counter-offer";
import { getServiceTypeLabel } from "@/lib/intake-estimate";
import {
  createSignedBookingPhotoUrls,
  type BookingPhotoSignedUrl,
} from "@/lib/booking-photos";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/database.types";

type PendingRequest = {
  id: string;
  service_address: string | null;
  scheduled_at: string | null;
  duration_hours: number | null;
  notes: string | null;
  status: string;
  payment_status: string;
  scope_snapshot: Json | null;
  recommended_hours: number | null;
  client_requested_hours: number | null;
  total_price_cents: number | null;
  cleaner_payout_cents: number | null;
  hourly_rate_snapshot: number | null;
  created_at: string;
  client: { full_name: string | null } | null;
  photos: BookingPhotoSignedUrl[];
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

function formatHoursValue(hours: number | null): string {
  if (hours == null || !Number.isFinite(hours)) {
    return "—";
  }

  return Number.isInteger(hours) ? String(hours) : hours.toFixed(1);
}

function clientName(request: PendingRequest): string {
  return request.client?.full_name?.trim() || "Client";
}

function clientInitial(name: string): string {
  return name.trim() ? name.trim()[0]!.toUpperCase() : "C";
}

function resolveCleanerPayoutCents(request: PendingRequest): number | null {
  if (
    request.cleaner_payout_cents != null &&
    Number.isFinite(request.cleaner_payout_cents)
  ) {
    return request.cleaner_payout_cents;
  }

  const hours =
    request.client_requested_hours ?? request.duration_hours;
  const rate = request.hourly_rate_snapshot;

  if (hours == null || rate == null) {
    return null;
  }

  return computeAcceptedBookingPricingCents(rate, hours).cleaner_payout_cents;
}

function RequestCard({ request }: { request: PendingRequest }) {
  const scope = parseScopeSnapshot(request.scope_snapshot);
  const clientRequestedHours =
    request.client_requested_hours ?? request.duration_hours;
  const counterFormConfig =
    scope && clientRequestedHours != null
      ? {
          editableFields: getCounterEditableFields(scope, clientRequestedHours),
          currentExtraTasks: scope.input.extra_tasks,
          minimumHours: scope.quote.minimum_hours,
          maximumHours: scope.quote.maximum_hours,
          recommendedHours:
            request.recommended_hours ?? scope.quote.recommended_hours,
        }
      : null;

  const name = clientName(request);
  const payoutCents = resolveCleanerPayoutCents(request);
  const estimatedHours =
    clientRequestedHours ??
    request.recommended_hours ??
    request.duration_hours;

  return (
    <Card className="border border-border shadow-sm">
      <CardContent className="p-5">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-accent font-bold text-accent-foreground">
              {clientInitial(name)}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-foreground">
                  {name}
                </span>
                <Badge variant="secondary" className="text-xs">
                  {getCleanerStatusLabel(request.status, request.payment_status)}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Requested{" "}
                {new Intl.DateTimeFormat("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                }).format(new Date(request.created_at))}
              </p>
            </div>
          </div>
          <div className="text-right">
            {payoutCents != null ? (
              <>
                <p className="text-lg font-bold text-foreground">
                  {formatUsdFromCents(payoutCents)}
                </p>
                <p className="text-xs text-muted-foreground">Your payout</p>
              </>
            ) : null}
            <p className="mt-1 text-xs text-muted-foreground">
              {formatDuration(estimatedHours)}
            </p>
          </div>
        </div>

        <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="size-3.5 shrink-0" />
            {formatScheduledAt(request.scheduled_at)}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="size-3.5 shrink-0" />
            Est. {formatHoursValue(estimatedHours)}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground sm:col-span-2">
            <MapPin className="size-3.5 shrink-0" />
            {request.service_address ?? "—"}
          </div>
        </div>

        {scope ? (
          <div className="mb-4 rounded-lg bg-muted/40 p-3">
            <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Home className="size-3.5 shrink-0" />
              Scope summary
            </div>
            <p className="text-xs font-semibold text-foreground">
              {getServiceTypeLabel(scope.input.service_type)}
            </p>
            <ul className="mt-1 list-disc pl-5 text-xs text-muted-foreground">
              {getSelectedAreaLabels(scope.input).map((label) => (
                <li key={label}>{label}</li>
              ))}
            </ul>
            <div className="mt-2 grid gap-1 text-xs text-muted-foreground">
              <p>
                Recommended:{" "}
                {formatHoursValue(
                  request.recommended_hours ?? scope.quote.recommended_hours
                )}{" "}
                hrs
              </p>
              <p>
                Client total: {formatUsdFromCents(request.total_price_cents)}
              </p>
              <p>Rate: {formatHourlyRate(request.hourly_rate_snapshot)}</p>
            </div>
          </div>
        ) : (
          <p className="mb-4 text-xs text-muted-foreground">
            Duration: {formatDuration(request.duration_hours)}
          </p>
        )}

        <div className="mb-4">
          <BookingPhotoGallery photos={request.photos} compact />
        </div>

        {request.notes ? (
          <div className="mb-4 rounded-lg bg-muted p-3">
            <p className="mb-1 text-xs font-medium text-muted-foreground">
              Client notes
            </p>
            <p className="text-xs leading-relaxed text-foreground">
              {request.notes}
            </p>
          </div>
        ) : null}

        <Separator className="mb-4" />

        <div className="flex flex-col gap-3">
          <RequestResponseForms bookingId={request.id} />
          {counterFormConfig ? (
            <CounterOfferForm
              bookingId={request.id}
              editableFields={counterFormConfig.editableFields}
              currentExtraTasks={counterFormConfig.currentExtraTasks}
              minimumHours={counterFormConfig.minimumHours}
              maximumHours={counterFormConfig.maximumHours}
              recommendedHours={counterFormConfig.recommendedHours}
              clientRequestedHours={clientRequestedHours!}
              totalPriceCents={request.total_price_cents}
              hourlyRateSnapshot={request.hourly_rate_snapshot}
            />
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

export default async function CleanerRequestsPage() {
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
      notes,
      status,
      payment_status,
      scope_snapshot,
      recommended_hours,
      client_requested_hours,
      total_price_cents,
      cleaner_payout_cents,
      hourly_rate_snapshot,
      created_at,
      client:profiles!bookings_client_id_fkey ( full_name ),
      booking_photos ( id, storage_path )
    `
    )
    .eq("cleaner_id", user.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const requests: PendingRequest[] = await Promise.all(
    (bookings ?? []).map(async (booking) => {
      const {
        booking_photos: photoRowsRaw,
        ...request
      } = booking as typeof booking & {
        booking_photos: { id: string; storage_path: string }[] | null;
      };
      const photoRows = photoRowsRaw ?? [];
      const photos = await createSignedBookingPhotoUrls(supabase, photoRows);

      return {
        ...(request as Omit<PendingRequest, "photos">),
        photos,
      };
    })
  );

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <header className="mb-6">
          <div className="mb-1 flex items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground">
              Incoming requests
            </h1>
            {requests.length > 0 ? (
              <span className="flex size-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                {requests.length}
              </span>
            ) : null}
          </div>
          <p className="text-sm text-muted-foreground">
            Review booking requests and accept, decline, or suggest an
            adjustment.
          </p>
        </header>

        {requests.length === 0 ? (
          <DashboardEmptyState
            icon={Inbox}
            title="No new requests"
            description="Make sure your profile is visible so clients can find and book you."
          />
        ) : (
          <>
            <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Needs your response ({requests.length})
            </p>
            <ul className="flex flex-col gap-4">
              {requests.map((request) => (
                <li key={request.id}>
                  <RequestCard request={request} />
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </main>
  );
}
