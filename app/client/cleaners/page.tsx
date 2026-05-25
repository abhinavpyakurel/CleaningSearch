import Link from "next/link";
import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Tables } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/server";

type AvailableCleaner = Pick<
  Tables<"cleaner_profiles">,
  | "user_id"
  | "bio"
  | "hourly_rate"
  | "service_radius_miles"
  | "avg_rating"
  | "total_jobs"
  | "is_available"
> & {
  profiles: Pick<Tables<"profiles">, "full_name"> | null;
};

function truncateBio(bio: string | null): string | null {
  if (!bio) {
    return null;
  }

  if (bio.length <= 120) {
    return bio;
  }

  return `${bio.slice(0, 120).trimEnd()}…`;
}

function formatHourlyRate(rate: number | null): string {
  if (rate == null || !Number.isFinite(rate)) {
    return "Rate not set";
  }

  const rounded = Number.isInteger(rate) ? rate : rate.toFixed(2);
  return `$${rounded}/hr`;
}

function formatServiceRadius(miles: number | null): string {
  if (miles == null || !Number.isFinite(miles)) {
    return "Service radius not set";
  }

  const label = miles === 1 ? "mile" : "miles";
  return `Service radius: ${miles} ${label}`;
}

function formatJobsCompleted(totalJobs: number): string {
  const label = totalJobs === 1 ? "job" : "jobs";
  return `${totalJobs} ${label} completed`;
}

function isNewCleaner(avgRating: number | null | undefined): boolean {
  return avgRating == null || avgRating === 0;
}

function CleanerCard({ cleaner }: { cleaner: AvailableCleaner }) {
  const fullName = cleaner.profiles?.full_name?.trim() || "Cleaner";
  const bio = truncateBio(cleaner.bio);

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="gap-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <CardTitle className="text-lg">{fullName}</CardTitle>
          {isNewCleaner(cleaner.avg_rating) ? (
            <Badge variant="secondary">New</Badge>
          ) : (
            <Badge variant="outline">★ {cleaner.avg_rating.toFixed(1)}</Badge>
          )}
        </div>
        <CardDescription className="text-base text-foreground">
          {formatHourlyRate(cleaner.hourly_rate)}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-2 text-sm">
        <p className="text-muted-foreground">
          {formatServiceRadius(cleaner.service_radius_miles)}
        </p>
        <p className="text-muted-foreground">
          {formatJobsCompleted(cleaner.total_jobs)}
        </p>
        {bio ? (
          <p className="text-foreground/90">{bio}</p>
        ) : (
          <p className="italic text-muted-foreground">No bio yet</p>
        )}
      </CardContent>
      <CardFooter>
        <Button
          className="w-full"
          render={
            <Link
              href={`/client/book?cleaner_id=${encodeURIComponent(cleaner.user_id)}`}
            />
          }
        >
          Book this cleaner
        </Button>
      </CardFooter>
    </Card>
  );
}

export default async function ClientCleanersPage() {
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

  const { data: cleaners, error } = await supabase
    .from("cleaner_profiles")
    .select(
      `
      user_id,
      bio,
      hourly_rate,
      service_radius_miles,
      avg_rating,
      total_jobs,
      is_available,
      profiles ( full_name )
    `
    )
    .eq("is_available", true)
    .order("avg_rating", { ascending: false })
    .order("total_jobs", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const list = (cleaners ?? []) as AvailableCleaner[];

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 p-4 sm:p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Find a cleaner
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Browse available cleaners and book directly
        </p>
      </div>

      {list.length === 0 ? (
        <p className="text-muted-foreground">
          No cleaners available right now. Check back soon.
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((cleaner) => (
            <li key={cleaner.user_id} className="min-h-0">
              <CleanerCard cleaner={cleaner} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
