"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { parseProfileRole, roleHomePath } from "@/lib/auth";
import { ensureProfile } from "@/lib/profiles";
import { createClient } from "@/lib/supabase/server";

export type AuthActionState = {
  error?: string;
  message?: string;
};

function missingSupabaseConfig(): boolean {
  return (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export async function registerAction(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  if (missingSupabaseConfig()) {
    return { error: "Supabase is not configured. Check your environment variables." };
  }

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("fullName") ?? "").trim();
  const role = parseProfileRole(formData.get("role"));

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  if (password.length < 6) {
    return { error: "Password must be at least 6 characters." };
  }

  const supabase = await createClient();

  const { data, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        role,
        full_name: fullName || email,
      },
    },
  });

  if (signUpError) {
    return { error: signUpError.message };
  }

  if (!data.user) {
    return { error: "Registration failed. Please try again." };
  }

  if (!data.session) {
    return {
      message:
        "Check your email to confirm your account, then sign in to continue.",
    };
  }

  const { error: profileError } = await ensureProfile(
    supabase,
    data.user.id,
    role,
    fullName || null
  );

  if (profileError) {
    return { error: profileError };
  }

  revalidatePath("/", "layout");
  redirect(roleHomePath(role));
}
