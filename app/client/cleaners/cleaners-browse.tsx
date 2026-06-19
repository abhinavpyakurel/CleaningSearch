"use client";

import { useMemo, useState } from "react";
import { Search, SlidersHorizontal, Users } from "lucide-react";

import { CleanerCard } from "@/app/client/cleaners/cleaner-card";
import { Input } from "@/components/ui/input";
import {
  cleanerHasAvailabilityOnDay,
  type CleanerAvailabilityWindow,
} from "@/lib/cleaner-availability";
import type { ReviewStats } from "@/lib/reviews/stats";

export type BrowseCleaner = {
  user_id: string;
  full_name: string | null;
  bio: string | null;
  hourly_rate: number | null;
  profile_photo_url: string | null;
  is_available: boolean;
  review_stats: ReviewStats | null;
  typical_availability: string | null;
  has_availability: boolean;
  availability_windows: CleanerAvailabilityWindow[];
};

const DAY_FILTER_OPTIONS = [
  { value: "any", label: "Any day" },
  { value: "0", label: "Sunday" },
  { value: "1", label: "Monday" },
  { value: "2", label: "Tuesday" },
  { value: "3", label: "Wednesday" },
  { value: "4", label: "Thursday" },
  { value: "5", label: "Friday" },
  { value: "6", label: "Saturday" },
] as const;

const SORT_OPTIONS = [
  { value: "highest-rated", label: "Highest rated" },
  { value: "lowest-price", label: "Lowest price" },
  { value: "highest-price", label: "Highest price" },
  { value: "name", label: "Name (A–Z)" },
] as const;

type SortOption = (typeof SORT_OPTIONS)[number]["value"];

function sortCleaners(cleaners: BrowseCleaner[], sortBy: SortOption): BrowseCleaner[] {
  const sorted = [...cleaners];

  sorted.sort((a, b) => {
    switch (sortBy) {
      case "lowest-price": {
        const aRate = a.hourly_rate ?? Number.POSITIVE_INFINITY;
        const bRate = b.hourly_rate ?? Number.POSITIVE_INFINITY;
        return aRate - bRate;
      }
      case "highest-price": {
        const aRate = a.hourly_rate ?? 0;
        const bRate = b.hourly_rate ?? 0;
        return bRate - aRate;
      }
      case "name": {
        const aName = a.full_name?.trim().toLowerCase() ?? "";
        const bName = b.full_name?.trim().toLowerCase() ?? "";
        return aName.localeCompare(bName);
      }
      case "highest-rated":
      default: {
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
      }
    }
  });

  return sorted;
}

type CleanersBrowseProps = {
  cleaners: BrowseCleaner[];
};

export function CleanersBrowse({ cleaners }: CleanersBrowseProps) {
  const [search, setSearch] = useState("");
  const [dayFilter, setDayFilter] = useState("any");
  const [sortBy, setSortBy] = useState<SortOption>("highest-rated");

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    const matched = cleaners.filter((cleaner) => {
      const name = cleaner.full_name?.trim().toLowerCase() ?? "";
      const bio = cleaner.bio?.trim().toLowerCase() ?? "";
      const matchesSearch =
        query.length === 0 || name.includes(query) || bio.includes(query);

      const matchesDay =
        dayFilter === "any" ||
        cleanerHasAvailabilityOnDay(
          cleaner.availability_windows,
          Number(dayFilter)
        );

      return matchesSearch && matchesDay;
    });

    return sortCleaners(matched, sortBy);
  }, [cleaners, dayFilter, search, sortBy]);

  if (cleaners.length === 0) {
    return (
      <div className="py-16 text-center">
        <Users className="mx-auto mb-3 size-10 text-muted-foreground/40" />
        <p className="font-semibold text-foreground">
          No cleaners available right now
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Check back soon or invite a cleaner to join CleanMatch.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or bio..."
            className="pl-9"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <SlidersHorizontal className="size-4 text-muted-foreground" />
          <select
            value={dayFilter}
            onChange={(event) => setDayFilter(event.target.value)}
            className="rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground outline-none"
            aria-label="Filter by available day"
          >
            {DAY_FILTER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value as SortOption)}
            className="rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground outline-none"
            aria-label="Sort cleaners"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <p className="mb-4 text-sm text-muted-foreground">
        {filtered.length} cleaner{filtered.length === 1 ? "" : "s"} found
      </p>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card py-16 text-center">
          <Search className="mx-auto mb-3 size-10 text-muted-foreground/40" />
          <p className="mb-1 font-semibold text-foreground">No cleaners found</p>
          <p className="text-sm text-muted-foreground">
            Try adjusting your search or filters.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-4 pb-16">
          {filtered.map((cleaner) => (
            <li key={cleaner.user_id}>
              <CleanerCard cleaner={cleaner} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
