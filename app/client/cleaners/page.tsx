import Link from "next/link";
import { redirect } from "next/navigation";

import type { Tables } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/server";
import {
  buildReviewStatsByReviewee,
  type ReviewStats,
} from "@/lib/reviews/stats";
import { SiteHeader } from "@/components/site-header";

type AvailableCleaner = Pick<
  Tables<"cleaner_profiles">,
  | "user_id"
  | "bio"
  | "hourly_rate"
  | "service_radius_miles"
  | "total_jobs"
  | "is_available"
> & {
  profiles: Pick<Tables<"profiles">, "full_name"> | null;
  review_stats: ReviewStats | null;
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

function formatReviewTrust(stats: ReviewStats | null): string | null {
  if (!stats || stats.review_count === 0) {
    return null;
  }

  const label = stats.review_count === 1 ? "review" : "reviews";
  return `★ ${stats.average_rating.toFixed(1)} · ${stats.review_count} ${label}`;
}

function CleanerCard({ cleaner }: { cleaner: AvailableCleaner }) {
  const fullName = cleaner.profiles?.full_name?.trim() || "Cleaner";
  const bio = truncateBio(cleaner.bio);
  const reviewTrust = formatReviewTrust(cleaner.review_stats);

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-md">
      <div>
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-xl font-bold text-gray-900">
            <Link
              href={`/client/cleaners/${encodeURIComponent(cleaner.user_id)}`}
              className="hover:text-[#00695C]"
            >
              {fullName}
            </Link>
          </h2>
          {reviewTrust ? (
            <span className="shrink-0 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
              {reviewTrust}
            </span>
          ) : (
            <span className="shrink-0 rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-500">
              New
            </span>
          )}
        </div>

        <div className="mt-3 space-y-1">
          <p className="text-2xl font-bold text-[#00695C]">
            {formatHourlyRate(cleaner.hourly_rate)}
          </p>
          <p className="text-sm text-gray-500">
            {formatServiceRadius(cleaner.service_radius_miles)}
          </p>
          <p className="text-sm text-gray-500">
            {formatJobsCompleted(cleaner.total_jobs)}
          </p>
        </div>

        {bio ? (
          <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-gray-600">
            {bio}
          </p>
        ) : (
          <p className="mt-3 line-clamp-2 text-sm italic leading-relaxed text-gray-400">
            No bio yet
          </p>
        )}
      </div>

      <div className="mt-6 space-y-2">
        <p className="text-xs font-medium text-green-600">● Available now</p>
        <Link
          href={`/client/cleaners/${encodeURIComponent(cleaner.user_id)}`}
          className="block w-full rounded-xl border border-gray-200 py-2.5 text-center text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
        >
          View profile & reviews
        </Link>
        <Link
          href={`/client/book?cleaner_id=${encodeURIComponent(cleaner.user_id)}`}
          className="block w-full rounded-xl bg-[#00695C] py-3 text-center font-semibold text-white transition-all duration-200 hover:bg-[#004D40]"
        >
          Book this cleaner
        </Link>
      </div>
    </div>
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
      total_jobs,
      is_available,
      profiles:profiles!cleaner_profiles_user_id_fkey ( full_name )
    `
    )
    .eq("is_available", true)
    .order("total_jobs", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const cleanerRows = cleaners ?? [];
  const cleanerIds = cleanerRows.map((c) => c.user_id);

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

  const baseList: Omit<AvailableCleaner, "review_stats">[] = cleanerRows.map(
    (cleaner) => ({
      ...cleaner,
      profiles: {
        full_name:
          cleaner.profiles?.full_name ??
          fullNameByCleanerId.get(cleaner.user_id) ??
          null,
      },
    })
  );

  const reviewStatsByCleaner = new Map<string, ReviewStats>();

  if (cleanerIds.length > 0) {
    const { data: reviewRows, error: reviewsError } = await supabase
      .from("reviews")
      .select("reviewee_id, rating")
      .in("reviewee_id", cleanerIds);

    if (reviewsError) {
      throw new Error(reviewsError.message);
    }

    const statsMap = buildReviewStatsByReviewee(reviewRows ?? []);
    for (const [id, stats] of statsMap) {
      reviewStatsByCleaner.set(id, stats);
    }
  }

  const list: AvailableCleaner[] = baseList
    .map((cleaner) => ({
      ...cleaner,
      review_stats: reviewStatsByCleaner.get(cleaner.user_id) ?? null,
    }))
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
      return b.total_jobs - a.total_jobs;
    });

  return (
    <>
      <SiteHeader />
      <div className="relative min-h-screen w-full overflow-hidden bg-[#F5F5F0]">
        <div
          className="pointer-events-none absolute -right-20 -top-20 h-96 w-96 rounded-full bg-[#00695C] opacity-5"
          aria-hidden
        />

        <section className="relative mx-auto max-w-6xl px-6 pb-8 pt-12">
          <h1 className="text-4xl font-bold text-gray-900">Find a cleaner</h1>
          <p className="mt-2 text-lg text-gray-500">
            Browse available cleaners and book directly
          </p>
        </section>

        {list.length === 0 ? (
          <section className="relative w-full py-24 text-center">
            <p className="text-5xl" role="img" aria-label="Broom">
              🧹
            </p>
            <p className="mt-4 text-xl font-semibold text-gray-700">
              No cleaners available right now.
            </p>
            <p className="mt-2 text-sm text-gray-400">
              Check back soon or invite a cleaner to join CleanMatch.
            </p>
          </section>
        ) : (
          <ul className="relative mx-auto grid max-w-6xl grid-cols-1 gap-6 px-6 pb-16 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((cleaner) => (
              <li key={cleaner.user_id}>
                <CleanerCard cleaner={cleaner} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
