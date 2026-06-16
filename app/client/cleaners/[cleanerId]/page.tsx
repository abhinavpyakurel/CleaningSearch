import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import type { Tables } from "@/lib/database.types";
import { formatAvailabilitySummary } from "@/lib/cleaner-availability";
import { isCleanerPubliclyVisible } from "@/lib/profiles";
import { createClient } from "@/lib/supabase/server";
import { buildReviewStatsByReviewee } from "@/lib/reviews/stats";

type CleanerDetail = Pick<
  Tables<"cleaner_profiles">,
  | "user_id"
  | "bio"
  | "hourly_rate"
  | "service_radius_miles"
  | "total_jobs"
  | "is_available"
  | "profile_photo_url"
> & {
  profiles: Pick<Tables<"profiles">, "full_name"> | null;
};

type CleanerReview = Pick<
  Tables<"reviews">,
  "rating" | "comment" | "created_at"
>;

function formatHourlyRate(rate: number | null): string {
  if (rate == null || !Number.isFinite(rate)) {
    return "Rate not set";
  }

  const rounded = Number.isInteger(rate) ? rate : rate.toFixed(2);
  return `$${rounded}/hr`;
}

function formatReviewDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function RatingStars({ rating }: { rating: number }) {
  return (
    <span className="text-amber-600" aria-label={`${rating} out of 5 stars`}>
      {"★".repeat(rating)}
      <span className="text-gray-300">{"★".repeat(5 - rating)}</span>
    </span>
  );
}

export default async function CleanerProfilePage({
  params,
}: {
  params: { cleanerId: string };
}) {
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

  const { data: cleaner, error } = await supabase
    .from("cleaner_profiles")
    .select(
      `
      user_id,
      bio,
      hourly_rate,
      service_radius_miles,
      total_jobs,
      is_available,
      profile_photo_url,
      profiles ( full_name )
    `
    )
    .eq("user_id", params.cleanerId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!cleaner) {
    notFound();
  }

  const detail = cleaner as CleanerDetail;
  const fullName = detail.profiles?.full_name?.trim() || "Cleaner";

  if (
    !isCleanerPubliclyVisible({
      full_name: detail.profiles?.full_name ?? null,
      bio: detail.bio,
      hourly_rate: detail.hourly_rate,
      service_radius_miles: detail.service_radius_miles,
      profile_photo_url: detail.profile_photo_url,
      is_available: detail.is_available,
    })
  ) {
    notFound();
  }

  const photoUrl = detail.profile_photo_url?.trim() ?? "";

  const { data: reviewRows, error: reviewsError } = await supabase
    .from("reviews")
    .select("reviewee_id, rating, comment, created_at")
    .eq("reviewee_id", params.cleanerId)
    .order("created_at", { ascending: false });

  if (reviewsError) {
    throw new Error(reviewsError.message);
  }

  const statsMap = buildReviewStatsByReviewee(
    (reviewRows ?? []).map((r) => ({
      reviewee_id: r.reviewee_id,
      rating: r.rating,
    }))
  );
  const stats = statsMap.get(params.cleanerId);

  const reviews: CleanerReview[] = (reviewRows ?? []).map((r) => ({
    rating: r.rating,
    comment: r.comment,
    created_at: r.created_at,
  }));

  const { data: availabilityRows, error: availabilityError } = await supabase
    .from("cleaner_availability_windows")
    .select("day_of_week, start_time, end_time")
    .eq("cleaner_id", params.cleanerId)
    .order("day_of_week", { ascending: true });

  if (availabilityError) {
    throw new Error(availabilityError.message);
  }

  const availabilitySummary = formatAvailabilitySummary(availabilityRows ?? []);
  const hasAvailability = (availabilityRows ?? []).length > 0;
  const canBook = detail.is_available && hasAvailability;

  return (
    <div className="min-h-screen w-full bg-[#F5F5F0]">
        <div className="mx-auto max-w-3xl px-6 pb-16 pt-12">
          <Link
            href="/client/cleaners"
            className="text-sm font-medium text-[#00695C] hover:underline"
          >
            ← Back to cleaners
          </Link>

          <header className="mt-6 rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
            {photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photoUrl}
                alt={`${fullName} profile`}
                className="mb-4 h-28 w-28 rounded-full border border-gray-100 object-cover"
              />
            ) : null}
            <h1 className="text-3xl font-bold text-gray-900">{fullName}</h1>
            <p className="mt-2 text-2xl font-bold text-[#00695C]">
              {formatHourlyRate(detail.hourly_rate)}
            </p>
            {stats && stats.review_count > 0 ? (
              <p className="mt-2 text-sm text-gray-600">
                ★ {stats.average_rating.toFixed(1)} · {stats.review_count}{" "}
                {stats.review_count === 1 ? "review" : "reviews"}
              </p>
            ) : (
              <p className="mt-2 text-sm text-gray-500">No reviews yet</p>
            )}
            {detail.bio ? (
              <p className="mt-4 text-sm leading-relaxed text-gray-600">
                {detail.bio}
              </p>
            ) : null}
            <div className="mt-4">
              {hasAvailability ? (
                <p className="text-sm font-medium text-gray-700">
                  {availabilitySummary}
                </p>
              ) : (
                <p className="text-sm text-gray-500">
                  This cleaner has not added availability yet.
                </p>
              )}
            </div>
            {canBook ? (
              <Link
                href={`/client/book?cleaner_id=${encodeURIComponent(detail.user_id)}`}
                className="mt-6 inline-block rounded-xl bg-[#00695C] px-6 py-3 font-semibold text-white transition-all hover:bg-[#004D40]"
              >
                Book this cleaner
              </Link>
            ) : detail.is_available ? (
              <p className="mt-6 text-sm text-gray-500">
                Booking unavailable until this cleaner adds availability.
              </p>
            ) : (
              <p className="mt-6 text-sm text-gray-500">Currently unavailable</p>
            )}
          </header>

          <section className="mt-8">
            <h2 className="text-xl font-bold text-gray-900">Reviews</h2>
            {reviews.length === 0 ? (
              <p className="mt-3 text-sm text-gray-500">No reviews yet.</p>
            ) : (
              <ul className="mt-4 space-y-4">
                {reviews.map((review, index) => (
                  <li
                    key={`${review.created_at}-${index}`}
                    className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <RatingStars rating={review.rating} />
                      <time
                        dateTime={review.created_at}
                        className="text-xs text-gray-400"
                      >
                        {formatReviewDate(review.created_at)}
                      </time>
                    </div>
                    <p className="mt-2 text-xs font-medium text-gray-500">
                      Verified client
                    </p>
                    {review.comment ? (
                      <p className="mt-2 text-sm leading-relaxed text-gray-700">
                        {review.comment}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
  );
}
