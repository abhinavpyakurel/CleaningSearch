import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight } from "lucide-react";

import {
  type ClientBooking,
} from "@/app/client/bookings/booking-card";
import {
  BookingsTabs,
  GlobalEmptyState,
  type BookingTab,
  type GroupedBookings,
} from "@/app/client/bookings/bookings-tabs";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

type BookingsPageProps = {
  searchParams?: { payment?: string };
};

function getBookingTab(booking: ClientBooking): BookingTab {
  if (
    booking.payment_status === "refunded" ||
    booking.status === "cancelled" ||
    booking.status === "declined"
  ) {
    return "cancelled";
  }

  if (booking.status === "completed") {
    return "completed";
  }

  if (
    booking.status === "countered" ||
    booking.status === "disputed" ||
    (booking.status === "accepted_pending_payment" &&
      booking.payment_status === "unpaid")
  ) {
    return "needs-action";
  }

  if (
    booking.status === "pending" ||
    (booking.status === "confirmed" && booking.payment_status === "paid") ||
    (booking.status === "in_progress" && booking.payment_status === "paid")
  ) {
    return "upcoming";
  }

  return "needs-action";
}

function groupBookings(bookings: ClientBooking[]): GroupedBookings {
  const groups: GroupedBookings = {
    upcoming: [],
    "needs-action": [],
    completed: [],
    cancelled: [],
  };

  for (const booking of bookings) {
    groups[getBookingTab(booking)].push(booking);
  }

  return groups;
}

function PaymentBanner({ payment }: { payment?: string }) {
  if (payment === "success") {
    return (
      <div
        className="mb-6 rounded-xl border border-primary/20 bg-accent px-4 py-3 text-sm text-foreground"
        role="status"
      >
        Payment received. Your booking will show as confirmed once Stripe
        finishes processing.
      </div>
    );
  }

  if (payment === "cancelled") {
    return (
      <div
        className="mb-6 rounded-xl border border-border bg-muted px-4 py-3 text-sm text-muted-foreground"
        role="status"
      >
        Checkout was cancelled. You can pay anytime from this page to confirm
        your booking.
      </div>
    );
  }

  return null;
}

export default async function BookingsPage({ searchParams }: BookingsPageProps) {
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
      "id, service_address, scheduled_at, duration_hours, notes, status, payment_status, payout_status, stripe_payment_intent_id, stripe_refund_id, refund_amount_cents, non_refundable_fee_cents, cleaner_id, client_requested_hours, total_price_cents, cleaner_payout_cents, platform_fee_cents, counter_adjustments, counter_hours, counter_total_price_cents, counter_reason, cleaner_marked_complete_at, client_marked_complete_at, service_type"
    )
    .eq("client_id", user.id)
    .order("scheduled_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const rows = bookings ?? [];
  const bookingIds = rows.map((b) => b.id);

  const reviewedBookingIds = new Set<string>();

  if (bookingIds.length > 0) {
    const { data: clientReviews, error: reviewsError } = await supabase
      .from("reviews")
      .select("booking_id")
      .eq("reviewer_id", user.id)
      .in("booking_id", bookingIds);

    if (reviewsError) {
      throw new Error(reviewsError.message);
    }

    for (const review of clientReviews ?? []) {
      reviewedBookingIds.add(review.booking_id);
    }
  }

  const cleanerIds = [
    ...Array.from(
      new Set(
        rows
          .map((b) => b.cleaner_id)
          .filter((id): id is string => id != null)
      )
    ),
  ];

  const cleanerNameById = new Map<string, string>();
  const cleanerPhotoById = new Map<string, string>();

  if (cleanerIds.length > 0) {
    const { data: cleanerProfiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", cleanerIds);

    if (profilesError) {
      throw new Error(profilesError.message);
    }

    for (const profileRow of cleanerProfiles ?? []) {
      const name = profileRow.full_name?.trim();
      if (name) {
        cleanerNameById.set(profileRow.id, name);
      }
    }

    const { data: cleanerProfileRows, error: cleanerProfilesError } =
      await supabase
        .from("cleaner_profiles")
        .select("user_id, profile_photo_url")
        .in("user_id", cleanerIds);

    if (cleanerProfilesError) {
      throw new Error(cleanerProfilesError.message);
    }

    for (const row of cleanerProfileRows ?? []) {
      const photoUrl = row.profile_photo_url?.trim();
      if (photoUrl) {
        cleanerPhotoById.set(row.user_id, photoUrl);
      }
    }
  }

  const list: ClientBooking[] = rows.map((booking) => {
    const cleanerName =
      booking.cleaner_id != null
        ? cleanerNameById.get(booking.cleaner_id) ?? null
        : null;

    return {
      ...booking,
      cleaner_name:
        booking.cleaner_id != null && cleanerName ? cleanerName : null,
      cleaner_photo_url:
        booking.cleaner_id != null
          ? cleanerPhotoById.get(booking.cleaner_id) ?? null
          : null,
      has_review: reviewedBookingIds.has(booking.id),
    };
  });

  const groups = groupBookings(list);
  const defaultTab: BookingTab =
    groups["needs-action"].length > 0 ? "needs-action" : "upcoming";
  const paymentParam = searchParams?.payment;

  return (
    <div className="min-h-screen w-full bg-background">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">My bookings</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage all your cleaning appointments.
            </p>
          </div>
          <Link href="/client/cleaners">
            <Button size="sm" className="gap-1.5">
              Book again
              <ChevronRight className="size-4" />
            </Button>
          </Link>
        </div>

        <PaymentBanner payment={paymentParam} />

        {list.length === 0 ? (
          <GlobalEmptyState />
        ) : (
          <BookingsTabs
            groups={groups}
            paymentParam={paymentParam}
            defaultTab={defaultTab}
          />
        )}
      </div>
    </div>
  );
}
