import { redirect } from "next/navigation";

import {
  CleanersBrowse,
  type BrowseCleaner,
} from "@/app/client/cleaners/cleaners-browse";
import type { Tables } from "@/lib/database.types";
import {
  formatTypicalAvailabilitySummary,
  type CleanerAvailabilityWindow,
} from "@/lib/cleaner-availability";
import { isCleanerPubliclyVisible } from "@/lib/profiles";
import { createClient } from "@/lib/supabase/server";
import {
  buildReviewStatsByReviewee,
  type ReviewStats,
} from "@/lib/reviews/stats";

type CleanerRow = Pick<
  Tables<"cleaner_profiles">,
  | "user_id"
  | "bio"
  | "hourly_rate"
  | "service_radius_miles"
  | "is_available"
  | "profile_photo_url"
> & {
  profiles: Pick<Tables<"profiles">, "full_name"> | null;
};

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
      is_available,
      profile_photo_url,
      profiles:profiles!cleaner_profiles_user_id_fkey ( full_name )
    `
    )
    .eq("is_available", true);

  if (error) {
    throw new Error(error.message);
  }

  const cleanerRows = (cleaners ?? []) as CleanerRow[];
  const cleanerIds = cleanerRows.map((cleaner) => cleaner.user_id);

  const fullNameByCleanerId = new Map<string, string | null>();

  if (cleanerIds.length > 0) {
    const { data: profileRows, error: profilesError } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", cleanerIds);

    if (profilesError) {
      throw new Error(profilesError.message);
    }

    for (const row of profileRows ?? []) {
      fullNameByCleanerId.set(row.id, row.full_name);
    }
  }

  const reviewStatsByCleaner = new Map<string, ReviewStats>();
  const availabilityByCleaner = new Map<string, CleanerAvailabilityWindow[]>();

  if (cleanerIds.length > 0) {
    const [{ data: reviewRows, error: reviewsError }, { data: availabilityRows, error: availabilityError }] =
      await Promise.all([
        supabase
          .from("reviews")
          .select("reviewee_id, rating")
          .in("reviewee_id", cleanerIds),
        supabase
          .from("cleaner_availability_windows")
          .select("cleaner_id, day_of_week, start_time, end_time")
          .in("cleaner_id", cleanerIds)
          .order("day_of_week", { ascending: true }),
      ]);

    if (reviewsError) {
      throw new Error(reviewsError.message);
    }

    if (availabilityError) {
      throw new Error(availabilityError.message);
    }

    const statsMap = buildReviewStatsByReviewee(reviewRows ?? []);
    for (const [id, stats] of statsMap) {
      reviewStatsByCleaner.set(id, stats);
    }

    for (const row of availabilityRows ?? []) {
      const windows = availabilityByCleaner.get(row.cleaner_id) ?? [];
      windows.push({
        day_of_week: row.day_of_week,
        start_time: row.start_time,
        end_time: row.end_time,
      });
      availabilityByCleaner.set(row.cleaner_id, windows);
    }
  }

  const list: BrowseCleaner[] = cleanerRows
    .filter((cleaner) =>
      isCleanerPubliclyVisible({
        full_name:
          cleaner.profiles?.full_name ??
          fullNameByCleanerId.get(cleaner.user_id) ??
          null,
        bio: cleaner.bio,
        hourly_rate: cleaner.hourly_rate,
        service_radius_miles: cleaner.service_radius_miles,
        profile_photo_url: cleaner.profile_photo_url,
        is_available: cleaner.is_available,
      })
    )
    .map((cleaner) => {
      const fullName =
        cleaner.profiles?.full_name ??
        fullNameByCleanerId.get(cleaner.user_id) ??
        null;
      const availabilityWindows =
        availabilityByCleaner.get(cleaner.user_id) ?? [];

      return {
        user_id: cleaner.user_id,
        full_name: fullName,
        bio: cleaner.bio,
        hourly_rate: cleaner.hourly_rate,
        profile_photo_url: cleaner.profile_photo_url,
        is_available: cleaner.is_available,
        review_stats: reviewStatsByCleaner.get(cleaner.user_id) ?? null,
        typical_availability: formatTypicalAvailabilitySummary(availabilityWindows),
        has_availability: availabilityWindows.length > 0,
        availability_windows: availabilityWindows,
      };
    })
    .sort((a, b) => {
      const aRating = a.review_stats?.average_rating ?? 0;
      const bRating = b.review_stats?.average_rating ?? 0;
      if (bRating !== aRating) {
        return bRating - aRating;
      }
      const aCount = a.review_stats?.review_count ?? 0;
      const bCount = b.review_stats?.review_count ?? 0;
      if (bCount !== aCount) {
        return bCount - aCount;
      }
      const aRate = a.hourly_rate ?? 0;
      const bRate = b.hourly_rate ?? 0;
      return aRate - bRate;
    });

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-6">
          <h1 className="mb-1 text-2xl font-bold text-foreground">
            Find a cleaner
          </h1>
          <p className="text-sm text-muted-foreground">
            Browse cleaners accepting requests and book directly
          </p>
        </div>

        <CleanersBrowse cleaners={list} />
      </div>
    </div>
  );
}
