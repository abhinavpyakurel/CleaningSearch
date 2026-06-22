import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight, Info } from "lucide-react";

import { toggleCleanerAvailability } from "@/app/cleaner/dashboard/actions";
import { AvailabilityEditor } from "@/app/cleaner/dashboard/availability-editor";
import { DashboardEmptyState } from "@/app/cleaner/_components/dashboard-empty-state";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DAY_LABELS_SHORT } from "@/lib/cleaner-availability";
import { createClient } from "@/lib/supabase/server";

export default async function CleanerAvailabilityPage() {
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

  const { data: cleanerProfile } = await supabase
    .from("cleaner_profiles")
    .select("is_available")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!cleanerProfile) {
    redirect("/cleaner/onboarding");
  }

  const { data: availabilityWindows } = await supabase
    .from("cleaner_availability_windows")
    .select("day_of_week, start_time, end_time")
    .eq("cleaner_id", user.id)
    .order("day_of_week", { ascending: true });

  const windows = availabilityWindows ?? [];
  const openDays = new Set(windows.map((window) => window.day_of_week));
  const openCount = openDays.size;
  const hasSavedAvailability = windows.length > 0;
  const isAcceptingRequests = cleanerProfile.is_available;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Availability</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Control when clients can discover you and request bookings.
          </p>
        </div>

        <Card className="mb-6 border border-border shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <CardTitle className="text-base">Accepting new requests</CardTitle>
                <CardDescription className="mt-1.5 leading-relaxed">
                  When this is off, clients cannot send you new booking requests.
                  Existing bookings are not affected.
                </CardDescription>
              </div>
              <form action={toggleCleanerAvailability} className="shrink-0">
                <button
                  type="submit"
                  role="switch"
                  aria-checked={isAcceptingRequests}
                  aria-label="Accepting new requests"
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    isAcceptingRequests ? "bg-primary" : "bg-input"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block size-5 rounded-full bg-card shadow-sm ring-0 transition-transform ${
                      isAcceptingRequests ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </form>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm text-muted-foreground">
              {isAcceptingRequests
                ? "You are currently accepting new booking requests."
                : "You are not accepting new booking requests."}
            </p>
          </CardContent>
        </Card>

        {hasSavedAvailability ? (
          <div className="mb-6 flex items-center gap-2 rounded-xl border border-primary/10 bg-accent/30 p-3.5">
            <Info className="size-4 shrink-0 text-primary" />
            <p className="text-sm text-foreground">
              You&apos;re open{" "}
              <span className="font-semibold">{openCount} of 7 days</span> this
              week.
            </p>
          </div>
        ) : (
          <div className="mb-6">
            <DashboardEmptyState
              icon={Info}
              title="No weekly availability set"
              description="Add availability so clients can request bookings."
            />
          </div>
        )}

        <Card className="mb-6 border border-border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Weekly availability</CardTitle>
            <CardDescription className="leading-relaxed">
              Set the days and times clients can request bookings with you. Exact
              openings are checked against existing bookings.
            </CardDescription>
            <p className="text-xs text-muted-foreground">
              One time window per day is supported in this version.
            </p>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="mb-4 flex gap-1.5">
              {DAY_LABELS_SHORT.map((day, index) => (
                <div key={day} className="flex flex-1 flex-col items-center gap-1">
                  <span className="text-xs text-muted-foreground">{day}</span>
                  <div
                    className={`h-2 w-full rounded-full ${
                      openDays.has(index) ? "bg-primary" : "bg-muted"
                    }`}
                  />
                </div>
              ))}
            </div>
            <AvailabilityEditor initialWindows={windows} />
          </CardContent>
        </Card>

        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Confirmed and pending jobs automatically block overlapping requests.
          </p>
        </div>

        <div className="mt-6">
          <Link href="/cleaner/dashboard">
            <Button variant="ghost" size="sm" className="gap-1 text-xs">
              Back to dashboard
              <ChevronRight className="size-3.5" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
