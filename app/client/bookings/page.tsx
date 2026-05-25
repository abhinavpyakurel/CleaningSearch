import Link from "next/link";
import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Tables } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/server";

type Booking = Tables<"bookings">;

const STATUS_LABELS: Record<string, string> = {
  pending: "Looking for cleaner",
  confirmed: "Cleaner confirmed",
  in_progress: "In progress",
  completed: "Completed",
  disputed: "Disputed",
  cancelled: "Cancelled",
};

function getStatusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status;
}

function getStatusBadgeVariant(
  status: string
): "default" | "secondary" | "outline" {
  switch (status) {
    case "completed":
      return "default";
    case "pending":
    case "confirmed":
    case "in_progress":
      return "secondary";
    default:
      return "outline";
  }
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

function BookingCard({ booking }: { booking: Booking }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 pb-2">
        <CardTitle className="text-base font-medium leading-snug">
          {booking.service_address ?? "No address"}
        </CardTitle>
        <Badge variant={getStatusBadgeVariant(booking.status)}>
          {getStatusLabel(booking.status)}
        </Badge>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 text-sm">
        <p>
          <span className="text-muted-foreground">When: </span>
          {formatScheduledAt(booking.scheduled_at)}
        </p>
        <p>
          <span className="text-muted-foreground">Duration: </span>
          {formatDuration(booking.duration_hours)}
        </p>
        {booking.notes ? (
          <p>
            <span className="text-muted-foreground">Notes: </span>
            <span className="whitespace-pre-wrap">{booking.notes}</span>
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

export default async function BookingsPage() {
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

  if (!profile || profile.role !== "client") {
    redirect("/cleaner/dashboard");
  }

  const { data: bookings, error } = await supabase
    .from("bookings")
    .select(
      "id, service_address, scheduled_at, duration_hours, notes, status"
    )
    .eq("client_id", user.id)
    .order("scheduled_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const list = bookings ?? [];

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col gap-6 p-4 sm:p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">My bookings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your scheduled and past cleanings
        </p>
      </div>

      {list.length === 0 ? (
        <div className="flex flex-col items-start gap-4 rounded-lg border border-dashed p-6">
          <p className="text-muted-foreground">You have no bookings yet.</p>
          <Button render={<Link href="/client/book" />}>Book a cleaning</Button>
        </div>
      ) : (
        <ul className="flex flex-col gap-4">
          {list.map((booking) => (
            <li key={booking.id}>
              <BookingCard booking={booking} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
