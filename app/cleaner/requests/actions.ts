"use server";

import { revalidatePath } from "next/cache";

import {
  sendBookingAcceptedEmailToClient,
  sendBookingDeclinedEmailToClient,
} from "@/lib/email/notifications";
import { createClient } from "@/lib/supabase/server";

async function getAuthenticatedCleaner() {
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

  if (!profile || profile.role !== "cleaner") {
    return { supabase, user: null, error: "Only cleaners can manage requests." as const };
  }

  return { supabase, user, error: null };
}

async function updatePendingRequest(
  formData: FormData,
  status: "confirmed" | "cancelled"
): Promise<{ error: string | null }> {
  const bookingId = String(formData.get("booking_id") ?? "").trim();
  if (!bookingId) {
    return { error: "Invalid request." };
  }

  const auth = await getAuthenticatedCleaner();
  if (auth.error || !auth.user) {
    return { error: auth.error ?? "Not authenticated." };
  }

  const { supabase, user } = auth;

  const { data, error } = await supabase
    .from("bookings")
    .update({ status })
    .eq("id", bookingId)
    .eq("cleaner_id", user.id)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();

  if (error) {
    return { error: error.message };
  }

  if (!data) {
    return { error: "This request is no longer pending." };
  }

  try {
    const { data: booking } = await supabase
      .from("bookings")
      .select("id, client_id, scheduled_at, duration_hours, service_address")
      .eq("id", bookingId)
      .maybeSingle();

    if (booking?.client_id) {
      const { data: clientProfile } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", booking.client_id)
        .maybeSingle();

      if (clientProfile?.email) {
        const { data: cleanerProfile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .maybeSingle();

        if (
          booking.scheduled_at &&
          typeof booking.duration_hours === "number" &&
          booking.service_address
        ) {
          const emailArgs = {
            clientEmail: clientProfile.email,
            clientName: clientProfile.full_name,
            cleanerName: cleanerProfile?.full_name ?? null,
            bookingId: booking.id,
            scheduledAt: booking.scheduled_at,
            durationHours: booking.duration_hours,
            serviceAddress: booking.service_address,
          };

          if (status === "confirmed") {
            await sendBookingAcceptedEmailToClient(emailArgs);
          } else {
            await sendBookingDeclinedEmailToClient(emailArgs);
          }
        }
      }
    }
  } catch (emailError) {
    console.error(
      "EMAIL_DEBUG: Failed to notify client of booking decision:",
      emailError
    );
  }

  revalidatePath("/cleaner/requests");
  return { error: null };
}

export async function acceptRequestAction(
  formData: FormData
): Promise<{ error: string | null }> {
  return updatePendingRequest(formData, "confirmed");
}

export async function declineRequestAction(
  formData: FormData
): Promise<{ error: string | null }> {
  return updatePendingRequest(formData, "cancelled");
}
