import { redirect } from "next/navigation";
import { CounterOfferForm } from "@/app/cleaner/requests/counter-offer-form";
import { RequestResponseForms } from "@/app/cleaner/requests/request-response-forms";
import { BookingPhotoGallery } from "@/app/cleaner/requests/booking-photo-gallery";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  formatHourlyRate,
  formatUsdFromCents,
} from "@/lib/booking-price";
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
  scope_snapshot: Json | null;
  recommended_hours: number | null;
  client_requested_hours: number | null;
  total_price_cents: number | null;
  hourly_rate_snapshot: number | null;
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

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 pb-2">
        <CardTitle className="text-base font-medium leading-snug">
          {clientName(request)}
        </CardTitle>
        <Badge variant="secondary">Pending</Badge>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 text-sm">
        <p>
          <span className="text-muted-foreground">Address: </span>
          {request.service_address ?? "—"}
        </p>
        <p>
          <span className="text-muted-foreground">When: </span>
          {formatScheduledAt(request.scheduled_at)}
        </p>

        {scope ? (
          <>
            <div>
              <p className="text-muted-foreground">Selected areas</p>
              <ul className="mt-1 list-disc pl-5">
                {getSelectedAreaLabels(scope.input).map((label) => (
                  <li key={label}>{label}</li>
                ))}
              </ul>
            </div>
            <p>
              <span className="text-muted-foreground">Service type: </span>
              {getServiceTypeLabel(scope.input.service_type)}
            </p>
            <div className="grid gap-1 rounded-lg bg-muted/40 p-3">
              <p>
                <span className="text-muted-foreground">Recommended hours: </span>
                {formatHoursValue(
                  request.recommended_hours ?? scope.quote.recommended_hours
                )}
              </p>
              <p>
                <span className="text-muted-foreground">
                  Client requested hours:{" "}
                </span>
                {formatHoursValue(clientRequestedHours)}
              </p>
              <p>
                <span className="text-muted-foreground">Current total price: </span>
                {formatUsdFromCents(request.total_price_cents)}
              </p>
              <p>
                <span className="text-muted-foreground">Hourly rate snapshot: </span>
                {formatHourlyRate(request.hourly_rate_snapshot)}
              </p>
            </div>
          </>
        ) : (
          <p>
            <span className="text-muted-foreground">Duration: </span>
            {formatDuration(request.duration_hours)}
          </p>
        )}

        <div>
          <p className="text-muted-foreground">Photos</p>
          <div className="mt-2">
            <BookingPhotoGallery photos={request.photos} />
          </div>
        </div>

        {request.notes ? (
          <p>
            <span className="text-muted-foreground">Notes: </span>
            <span className="whitespace-pre-wrap">{request.notes}</span>
          </p>
        ) : (
          <p>
            <span className="text-muted-foreground">Notes: </span>—
          </p>
        )}
      </CardContent>
      <CardFooter className="flex flex-col items-stretch gap-3">
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
      </CardFooter>
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
      scope_snapshot,
      recommended_hours,
      client_requested_hours,
      total_price_cents,
      hourly_rate_snapshot,
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
    <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col gap-6 p-4 sm:p-8">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">
            Incoming requests
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Pending booking requests assigned to you
          </p>
        </header>

        {requests.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No pending requests right now.
          </p>
        ) : (
          <ul className="flex flex-col gap-4">
            {requests.map((request) => (
              <li key={request.id}>
                <RequestCard request={request} />
              </li>
            ))}
          </ul>
        )}
      </main>
  );
}
