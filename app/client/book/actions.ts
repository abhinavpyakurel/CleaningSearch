"use server";

import { redirect } from "next/navigation";

import { sendNewBookingEmailToCleaner } from "@/lib/email/notifications";
import { createClient } from "@/lib/supabase/server";

export type BookActionState = {
  error?: string;
};

export async function createBookingAction(
  _prevState: BookActionState,
  formData: FormData
): Promise<BookActionState> {
  const serviceAddress = String(formData.get("service_address") ?? "").trim();
  const date = formData.get("date") as string | null;
  const time = formData.get("time") as string | null;
  const notesRaw = String(formData.get("notes") ?? "").trim();
  const durationRaw = String(formData.get("duration_hours") ?? "").trim();
  const cleanerId = formData.get("cleaner_id") as string | null;

  if (!serviceAddress) {
    return { error: "Service address is required." };
  }

  if (!date || !time) {
    return { error: "Date and time are required." };
  }

  let scheduled_at: string;
  try {
    scheduled_at = new Date(`${date}T${time}:00`).toISOString();
  } catch {
    return { error: "Enter a valid date and time." };
  }

  const durationHours = Number(durationRaw);
  if (!durationRaw || !Number.isFinite(durationHours) || durationHours <= 0) {
    return { error: "Duration must be a positive number of hours." };
  }

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

  const { data, error } = await supabase
    .from("bookings")
    .insert({
      client_id: user.id,
      service_address: serviceAddress,
      scheduled_at,
      duration_hours: durationHours,
      notes: notesRaw || null,
      cleaner_id: cleanerId || null,
      status: "pending",
    })
    .select("id")
    .single();

  if (error) {
    return { error: error.message };
  }

  if (cleanerId) {
    try {
      const { data: cleanerProfile } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", cleanerId)
        .maybeSingle();

      if (cleanerProfile?.email) {
        const { data: clientProfile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .maybeSingle();

        await sendNewBookingEmailToCleaner({
          cleanerEmail: cleanerProfile.email,
          cleanerName: cleanerProfile.full_name,
          clientName: clientProfile?.full_name ?? null,
          bookingId: data.id,
          scheduledAt: scheduled_at,
          durationHours,
          serviceAddress,
        });
      }
    } catch (emailError) {
      console.error("Failed to notify cleaner of new booking:", emailError);
    }
  }

  redirect(`/client/book/confirm?booking_id=${data.id}`);
}
