import Link from "next/link";
import { ChevronRight, Clock, Star } from "lucide-react";

import type { BrowseCleaner } from "@/app/client/cleaners/cleaners-browse";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

function formatHourlyRate(rate: number | null): string {
  if (rate == null || !Number.isFinite(rate)) {
    return "Rate not set";
  }

  const rounded = Number.isInteger(rate) ? rate : rate.toFixed(2);
  return `$${rounded}/hr`;
}

function truncateBio(bio: string | null): string | null {
  if (!bio) {
    return null;
  }

  if (bio.length <= 160) {
    return bio;
  }

  return `${bio.slice(0, 160).trimEnd()}…`;
}

function isTopRated(cleaner: BrowseCleaner): boolean {
  const stats = cleaner.review_stats;
  if (!stats || stats.review_count < 5) {
    return false;
  }

  return stats.average_rating >= 4.8;
}

export function CleanerCard({ cleaner }: { cleaner: BrowseCleaner }) {
  const fullName = cleaner.full_name?.trim() || "Cleaner";
  const bio = truncateBio(cleaner.bio);
  const photoUrl = cleaner.profile_photo_url?.trim() ?? "";
  const initials = fullName
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const canBook = cleaner.is_available && cleaner.has_availability;
  const reviewCount = cleaner.review_stats?.review_count ?? 0;

  return (
    <Card className="border border-border shadow-sm">
      <CardContent className="p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <Avatar className="size-14 shrink-0">
            {photoUrl ? (
              <AvatarImage src={photoUrl} alt={`${fullName} profile`} />
            ) : null}
            <AvatarFallback className="text-lg font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <h2 className="font-semibold text-foreground">{fullName}</h2>
              {isTopRated(cleaner) ? (
                <Badge className="text-xs">Top rated</Badge>
              ) : reviewCount === 0 ? (
                <Badge variant="secondary" className="text-xs">
                  New
                </Badge>
              ) : null}
              <span
                className={`ml-auto text-xs font-medium ${
                  cleaner.is_available ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {cleaner.is_available
                  ? "Accepting requests"
                  : "Not accepting new requests"}
              </span>
            </div>

            <div className="mb-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              {reviewCount > 0 && cleaner.review_stats ? (
                <span className="flex items-center gap-1">
                  <Star className="size-3.5 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium text-foreground">
                    {cleaner.review_stats.average_rating.toFixed(1)}
                  </span>
                  <span>
                    ({reviewCount} {reviewCount === 1 ? "review" : "reviews"})
                  </span>
                </span>
              ) : (
                <span>No reviews yet</span>
              )}
              <span className="text-border">·</span>
              <span className="font-medium text-foreground">
                {formatHourlyRate(cleaner.hourly_rate)}
              </span>
            </div>

            {bio ? (
              <p className="mb-3 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                {bio}
              </p>
            ) : null}

            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              {cleaner.typical_availability ? (
                <div className="flex items-start gap-1.5">
                  <Clock className="mt-0.5 size-3.5 shrink-0" />
                  <span>{cleaner.typical_availability}</span>
                </div>
              ) : (
                <span>No typical availability listed yet</span>
              )}
            </div>

            {!canBook && cleaner.is_available ? (
              <p className="mt-2 text-xs text-muted-foreground">
                Booking unavailable until this cleaner adds availability.
              </p>
            ) : null}
          </div>

          <div className="flex shrink-0 gap-2 sm:flex-col">
            <Link
              href={`/client/cleaners/${encodeURIComponent(cleaner.user_id)}`}
              className="flex-1 sm:flex-none"
            >
              <Button variant="outline" size="sm" className="w-full rounded-md">
                View profile
              </Button>
            </Link>
            {canBook ? (
              <Link
                href={`/client/book?cleaner_id=${encodeURIComponent(cleaner.user_id)}`}
                className="flex-1 sm:flex-none"
              >
                <Button size="sm" className="w-full gap-1 rounded-md">
                  Request booking
                  <ChevronRight className="size-3.5" />
                </Button>
              </Link>
            ) : (
              <Button
                size="sm"
                className="flex-1 sm:flex-none rounded-md"
                disabled
                title={
                  cleaner.is_available
                    ? "This cleaner has not added availability yet"
                    : "This cleaner is not accepting new requests"
                }
              >
                Request booking
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
