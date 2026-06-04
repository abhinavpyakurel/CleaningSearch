import type { SupabaseClient } from "@supabase/supabase-js";

import type { ProfileRole } from "@/lib/auth";
import type { Database } from "@/lib/database.types";

export async function ensureProfile(
  supabase: SupabaseClient<Database>,
  userId: string,
  role: ProfileRole,
  fullName: string | null
): Promise<{ error: string | null }> {
  const { data: existing, error: selectError } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (selectError) {
    return { error: selectError.message };
  }

  if (existing) {
    const { error } = await supabase
      .from("profiles")
      .update({ role, full_name: fullName })
      .eq("id", userId);

    return { error: error?.message ?? null };
  }

  const { error } = await supabase.from("profiles").insert({
    id: userId,
    role,
    full_name: fullName,
  });

  return { error: error?.message ?? null };
}

export async function getProfileRole(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<{ role: string | null; error: string | null }> {
  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    return { role: null, error: error.message };
  }

  return { role: data?.role ?? null, error: null };
}

export async function getProfile(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<{
  role: string | null;
  full_name: string | null;
  error: string | null;
}> {
  const { data, error } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    return { role: null, full_name: null, error: error.message };
  }

  return {
    role: data?.role ?? null,
    full_name: data?.full_name ?? null,
    error: null,
  };
}

export type CleanerMarketplaceProfile = {
  full_name: string | null;
  bio: string | null;
  hourly_rate: number | null;
  service_radius_miles: number | null;
  profile_photo_url: string | null;
  is_available: boolean;
};

export function normalizeProfilePhotoUrl(
  value: string | null | undefined
): string | null {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : null;
}

export function isCleanerPubliclyVisible(
  profile: CleanerMarketplaceProfile
): boolean {
  if (!profile.is_available) {
    return false;
  }

  if (!profile.full_name?.trim()) {
    return false;
  }

  if (!profile.bio?.trim()) {
    return false;
  }

  if (
    profile.hourly_rate == null ||
    !Number.isFinite(profile.hourly_rate) ||
    profile.hourly_rate <= 0
  ) {
    return false;
  }

  if (
    profile.service_radius_miles == null ||
    !Number.isFinite(profile.service_radius_miles) ||
    profile.service_radius_miles <= 0
  ) {
    return false;
  }

  if (!normalizeProfilePhotoUrl(profile.profile_photo_url)) {
    return false;
  }

  return true;
}
