import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Star,
} from "lucide-react";

import type { Tables } from "@/lib/database.types";
import {
  buildWeeklyAvailabilityRows,
  formatTypicalAvailabilitySummary,
} from "@/lib/cleaner-availability";
import { isCleanerPubliclyVisible } from "@/lib/profiles";
import { createClient } from "@/lib/supabase/server";
import { buildReviewStatsByReviewee } from "@/lib/reviews/stats";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

type CleanerDetail = Pick<
  Tables<"cleaner_profiles">,
  | "user_id"
  | "bio"
  | "hourly_rate"
  | "service_radius_miles"
  | "is_available"
  | "profile_photo_url"
  | "stripe_payouts_enabled"
  | "created_at"
  | "years_experience"
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
  return `$${rounded}`;
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

function formatMemberSince(iso: string): string | null {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatServiceRadius(miles: number | null): string | null {
  if (miles == null || !Number.isFinite(miles) || miles <= 0) {
    return null;
  }

  const label = miles === 1 ? "mile" : "miles";
  return `Serves within ${miles} ${label}`;
}

function isTopRated(reviewCount: number, averageRating: number): boolean {
  return reviewCount >= 5 && averageRating >= 4.8;
}

function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          className={`size-3.5 ${
            index < rating
              ? "fill-yellow-400 text-yellow-400"
              : "text-muted"
          }`}
        />
      ))}
    </div>
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
      is_available,
      profile_photo_url,
      stripe_payouts_enabled,
      created_at,
      years_experience,
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
  const initials = fullName
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const serviceArea = formatServiceRadius(detail.service_radius_miles);
  const memberSince = formatMemberSince(detail.created_at);

  const { data: reviewRows, error: reviewsError } = await supabase
    .from("reviews")
    .select("reviewee_id, rating, comment, created_at")
    .eq("reviewee_id", params.cleanerId)
    .order("created_at", { ascending: false });

  if (reviewsError) {
    throw new Error(reviewsError.message);
  }

  const statsMap = buildReviewStatsByReviewee(
    (reviewRows ?? []).map((review) => ({
      reviewee_id: review.reviewee_id,
      rating: review.rating,
    }))
  );
  const stats = statsMap.get(params.cleanerId);
  const reviewCount = stats?.review_count ?? 0;

  const reviews: CleanerReview[] = (reviewRows ?? []).map((review) => ({
    rating: review.rating,
    comment: review.comment,
    created_at: review.created_at,
  }));

  const { data: availabilityRows, error: availabilityError } = await supabase
    .from("cleaner_availability_windows")
    .select("day_of_week, start_time, end_time")
    .eq("cleaner_id", params.cleanerId)
    .order("day_of_week", { ascending: true });

  if (availabilityError) {
    throw new Error(availabilityError.message);
  }

  const windows = availabilityRows ?? [];
  const typicalAvailability = formatTypicalAvailabilitySummary(windows);
  const weeklyAvailability = buildWeeklyAvailabilityRows(windows);
  const hasAvailability = windows.length > 0;
  const canBook = detail.is_available && hasAvailability;

  const trustItems = [
    "Profile complete",
    detail.is_available
      ? "Accepting requests"
      : "Not accepting new requests",
    reviewCount > 0
      ? `Reviewed by ${reviewCount} ${reviewCount === 1 ? "client" : "clients"}`
      : null,
    detail.stripe_payouts_enabled ? "Stripe payouts set up" : null,
    memberSince ? `Member since ${memberSince}` : null,
  ].filter((item): item is string => item != null);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <Link
          href="/client/cleaners"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Back to results
        </Link>

        <Card className="mb-6 border border-border shadow-sm">
          <CardContent className="p-6">
            <div className="flex flex-col gap-5 sm:flex-row">
              <Avatar className="size-20 shrink-0">
                {photoUrl ? (
                  <AvatarImage src={photoUrl} alt={`${fullName} profile`} />
                ) : null}
                <AvatarFallback className="text-2xl font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <h1 className="text-xl font-bold text-foreground">
                        {fullName}
                      </h1>
                      {stats && isTopRated(reviewCount, stats.average_rating) ? (
                        <Badge className="text-xs">Top rated</Badge>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                      {reviewCount > 0 && stats ? (
                        <span className="flex items-center gap-1">
                          <Star className="size-3.5 fill-yellow-400 text-yellow-400" />
                          <span className="font-semibold text-foreground">
                            {stats.average_rating.toFixed(1)}
                          </span>
                          <span>
                            ({reviewCount}{" "}
                            {reviewCount === 1 ? "review" : "reviews"})
                          </span>
                        </span>
                      ) : (
                        <span>No reviews yet</span>
                      )}
                      {serviceArea ? (
                        <>
                          <span className="text-border">·</span>
                          <span>{serviceArea}</span>
                        </>
                      ) : null}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-foreground">
                      {formatHourlyRate(detail.hourly_rate)}
                    </p>
                    <p className="text-sm text-muted-foreground">/hour</p>
                  </div>
                </div>

                <Separator className="my-4" />

                {detail.bio ? (
                  <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
                    {detail.bio}
                  </p>
                ) : null}

                {detail.years_experience != null &&
                Number.isFinite(detail.years_experience) &&
                detail.years_experience > 0 ? (
                  <p className="mb-4 text-sm text-muted-foreground">
                    {detail.years_experience}{" "}
                    {detail.years_experience === 1 ? "year" : "years"} of
                    experience
                  </p>
                ) : null}

                <p className="text-sm font-medium text-foreground">
                  {detail.is_available
                    ? "Accepting requests"
                    : "Not accepting new requests"}
                </p>
              </div>
            </div>

            <div className="mt-5">
              {canBook ? (
                <Link
                  href={`/client/book?cleaner_id=${encodeURIComponent(detail.user_id)}`}
                >
                  <Button size="lg" className="gap-2">
                    Request booking
                    <ChevronRight className="size-4" />
                  </Button>
                </Link>
              ) : detail.is_available ? (
                <p className="text-sm text-muted-foreground">
                  Booking unavailable until this cleaner adds availability.
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Not accepting new requests.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="flex flex-col gap-6 md:col-span-2">
            <Card className="border border-border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Profile details</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-col gap-2.5">
                  {trustItems.map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-2 text-sm text-foreground"
                    >
                      <CheckCircle2 className="size-4 shrink-0 text-primary" />
                      {item}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border border-border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Reviews</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {reviews.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No reviews yet.</p>
                ) : (
                  <div className="flex flex-col gap-5">
                    {reviews.map((review, index) => (
                      <div key={`${review.created_at}-${index}`}>
                        {index > 0 ? <Separator className="mb-5" /> : null}
                        <div className="mb-2 flex items-center justify-between">
                          <p className="text-sm font-medium text-foreground">
                            Verified client
                          </p>
                          <RatingStars rating={review.rating} />
                        </div>
                        {review.comment ? (
                          <p className="text-sm leading-relaxed text-muted-foreground">
                            {review.comment}
                          </p>
                        ) : null}
                        <time
                          dateTime={review.created_at}
                          className="mt-1 block text-xs text-muted-foreground"
                        >
                          {formatReviewDate(review.created_at)}
                        </time>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col gap-6">
            <Card className="border border-border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Typical availability</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {hasAvailability ? (
                  <>
                    <div className="flex flex-col gap-2">
                      {weeklyAvailability.map((row) => (
                        <div
                          key={row.dayOfWeek}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="w-8 text-muted-foreground">
                            {row.dayLabelShort}
                          </span>
                          {row.timeRanges.length > 0 ? (
                            <div className="flex flex-wrap justify-end gap-1">
                              {row.timeRanges.map((range) => (
                                <span
                                  key={range}
                                  className="rounded bg-accent px-2 py-0.5 text-xs text-accent-foreground"
                                >
                                  {range}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground/60">
                              Unavailable
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                    {typicalAvailability ? (
                      <p className="mt-4 text-sm text-muted-foreground">
                        {typicalAvailability}
                      </p>
                    ) : null}
                    <p className="mt-3 flex items-start gap-1.5 text-xs text-muted-foreground">
                      <Clock className="mt-0.5 size-3.5 shrink-0" />
                      Exact openings are checked when you request a booking.
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    This cleaner has not added availability yet.
                  </p>
                )}
              </CardContent>
            </Card>

            {canBook ? (
              <Card className="border border-border bg-accent/30 shadow-sm">
                <CardContent className="p-5">
                  <p className="mb-1 text-sm font-medium text-foreground">
                    Ready to book?
                  </p>
                  <p className="mb-4 text-xs text-muted-foreground">
                    Choose a time within their typical availability. Exact
                    openings are confirmed during booking.
                  </p>
                  <Link
                    href={`/client/book?cleaner_id=${encodeURIComponent(detail.user_id)}`}
                  >
                    <Button className="w-full gap-2" size="sm">
                      Request booking
                      <ChevronRight className="size-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
