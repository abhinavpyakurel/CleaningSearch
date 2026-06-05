import Link from "next/link";
import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  formatUsd,
  formatUsdFromCents,
  getBookingTotalAmount,
} from "@/lib/booking-price";
import {
  getServiceTypeLabel,
  SERVICE_TYPES,
  type ServiceType,
} from "@/lib/intake-estimate";
import { createClient } from "@/lib/supabase/server";

type BookingConfirmPageProps = {
  searchParams: { booking_id?: string };
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
    weekday: "long",
    month: "long",
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
  const display = Number.isInteger(hours) ? String(hours) : hours.toFixed(1);
  return `${display} ${label}`;
}

function formatServiceType(value: string | null): string {
  if (!value) {
    return "—";
  }

  if (SERVICE_TYPES.includes(value as ServiceType)) {
    return getServiceTypeLabel(value as ServiceType);
  }

  return value;
}

export default async function BookingConfirmPage({
  searchParams,
}: BookingConfirmPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const bookingId = searchParams.booking_id?.trim();
  if (!bookingId) {
    redirect("/client/home");
  }

  const { data: booking } = await supabase
    .from("bookings")
    .select(
      "service_address, scheduled_at, duration_hours, client_requested_hours, recommended_hours, service_type, special_requests, notes, status, total_price, total_price_cents, base_price, platform_fee"
    )
    .eq("id", bookingId)
    .eq("client_id", user.id)
    .maybeSingle();

  if (!booking) {
    redirect("/client/home");
  }

  const requestedHours =
    booking.client_requested_hours ?? booking.duration_hours;
  const totalAmount =
    booking.total_price_cents != null
      ? formatUsdFromCents(booking.total_price_cents)
      : formatUsd(getBookingTotalAmount(booking));
  const specialRequests = booking.special_requests ?? booking.notes;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col gap-6 p-4 sm:p-8">
      <Card className="w-full">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
          <CardTitle className="text-2xl">Booking Requested!</CardTitle>
          <Badge variant="secondary">Pending</Badge>
        </CardHeader>
        <CardContent>
          <dl className="flex flex-col gap-4 text-sm">
            <div>
              <dt className="font-medium text-muted-foreground">
                Service address
              </dt>
              <dd className="mt-1">{booking.service_address ?? "—"}</dd>
            </div>
            <div>
              <dt className="font-medium text-muted-foreground">
                Date and time
              </dt>
              <dd className="mt-1">
                {formatScheduledAt(booking.scheduled_at)}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-muted-foreground">
                Service type
              </dt>
              <dd className="mt-1">
                {formatServiceType(booking.service_type)}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-muted-foreground">
                Recommended hours
              </dt>
              <dd className="mt-1">
                {formatDuration(booking.recommended_hours)}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-muted-foreground">
                Requested hours
              </dt>
              <dd className="mt-1">{formatDuration(requestedHours)}</dd>
            </div>
            <div>
              <dt className="font-medium text-muted-foreground">
                Estimated total
              </dt>
              <dd className="mt-1">{totalAmount}</dd>
            </div>
            {specialRequests ? (
              <div>
                <dt className="font-medium text-muted-foreground">
                  Special requests
                </dt>
                <dd className="mt-1 whitespace-pre-wrap">{specialRequests}</dd>
              </div>
            ) : null}
          </dl>
        </CardContent>
        <CardFooter>
          <Button className="w-full" render={<Link href="/client/home" />}>
            Back to Home
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}
