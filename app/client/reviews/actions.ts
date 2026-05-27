"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export type ReviewActionState = {
  error?: string;
};

async function getAuthenticatedClient() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { supabase, user: null, error: "Not authenticated." as const };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.role !== "client") {
    return {
      supabase,
      user: null,
      error: "Only clients can submit reviews." as const,
    };
  }

  return { supabase, user, error: null };
}

export async function createReviewAction(
  _prevState: ReviewActionState,
  formData: FormData
): Promise<ReviewActionState> {
  const bookingId = String(formData.get("booking_id") ?? "").trim();
  const ratingRaw = String(formData.get("rating") ?? "").trim();
  const commentRaw = String(formData.get("comment") ?? "").trim();

  if (!bookingId) {
    return { error: "Invalid booking." };
  }

  const rating = Number(ratingRaw);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { error: "Rating must be a number from 1 to 5." };
  }

  const auth = await getAuthenticatedClient();
  if (auth.error || !auth.user) {
    return { error: auth.error ?? "Not authenticated." };
  }

  const { supabase, user } = auth;

  const { data: booking, error: fetchError } = await supabase
    .from("bookings")
    .select("id, client_id, cleaner_id, status")
    .eq("id", bookingId)
    .maybeSingle();

  if (fetchError) {
    return { error: fetchError.message };
  }

  if (!booking) {
    return { error: "Booking not found." };
  }

  if (booking.client_id !== user.id) {
    return { error: "You cannot review this booking." };
  }

  if (booking.status !== "completed") {
    return { error: "You can only review completed bookings." };
  }

  if (!booking.cleaner_id) {
    return { error: "This booking has no assigned cleaner." };
  }

  const { data: existingReview, error: existingError } = await supabase
    .from("reviews")
    .select("id")
    .eq("booking_id", booking.id)
    .eq("reviewer_id", user.id)
    .maybeSingle();

  if (existingError) {
    return { error: existingError.message };
  }

  if (existingReview) {
    return { error: "You have already reviewed this booking." };
  }

  const { error: insertError } = await supabase.from("reviews").insert({
    booking_id: booking.id,
    reviewer_id: booking.client_id,
    reviewee_id: booking.cleaner_id,
    rating,
    comment: commentRaw || null,
  });

  if (insertError) {
    return { error: insertError.message };
  }

  revalidatePath("/client/bookings");
  revalidatePath("/client/cleaners");
  revalidatePath(`/client/cleaners/${booking.cleaner_id}`);
  return {};
}
