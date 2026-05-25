import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import {
  acceptRequestAction,
  declineRequestAction,
} from "@/app/cleaner/requests/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

type PendingRequest = {
  id: string;
  service_address: string | null;
  scheduled_at: string | null;
  duration_hours: number | null;
  notes: string | null;
  status: string;
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

function clientName(request: PendingRequest): string {
  return request.client?.full_name?.trim() || "Client";
}

function RequestCard({ request }: { request: PendingRequest }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 pb-2">
        <CardTitle className="text-base font-medium leading-snug">
          {clientName(request)}
        </CardTitle>
        <Badge variant="secondary">Pending</Badge>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 text-sm">
        <p>
          <span className="text-muted-foreground">Address: </span>
          {request.service_address ?? "—"}
        </p>
        <p>
          <span className="text-muted-foreground">When: </span>
          {formatScheduledAt(request.scheduled_at)}
        </p>
        <p>
          <span className="text-muted-foreground">Duration: </span>
          {formatDuration(request.duration_hours)}
        </p>
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
      <CardFooter className="flex flex-wrap gap-2">
        <form action={acceptRequestAction}>
          <input type="hidden" name="booking_id" value={request.id} />
          <Button type="submit">Accept</Button>
        </form>
        <form action={declineRequestAction}>
          <input type="hidden" name="booking_id" value={request.id} />
          <Button type="submit" variant="outline">
            Decline
          </Button>
        </form>
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
      client:profiles!bookings_client_id_fkey ( full_name )
    `
    )
    .eq("cleaner_id", user.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const requests = (bookings ?? []) as PendingRequest[];

  return (
    <>  
    <SiteHeader/>
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
    </>
  );
}
