"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { roleHomePath } from "@/lib/auth";
import { getProfileRole } from "@/lib/profiles";
import { createClient } from "@/lib/supabase/server";

export type AuthActionState = {
  error?: string;
};

function missingSupabaseConfig(): boolean {
  return (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export async function loginAction(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  if (missingSupabaseConfig()) {
    return { error: "Supabase is not configured. Check your environment variables." };
  }

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const supabase = await createClient();

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    return { error: signInError.message };
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: "Could not sign in. Please try again." };
  }

  const { role, error: profileError } = await getProfileRole(supabase, user.id);

  if (profileError || !role) {
    return {
      error:
        profileError ??
        "Profile not found. Complete registration or contact support.",
    };
  }

  if (role !== "client" && role !== "cleaner") {
    return { error: "Unknown account type. Contact support." };
  }

  revalidatePath("/", "layout");
  redirect(roleHomePath(role));
}
