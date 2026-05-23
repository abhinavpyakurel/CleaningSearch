"use server";

import { redirect } from "next/navigation";

import { parseProfileRole, roleHomePath } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type AuthActionState = {
  error?: string;
  message?: string;
};

export async function login(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
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
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Could not sign in. Please try again." };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return { error: "Profile not found. Please contact support." };
  }

  const redirectTo = String(formData.get("redirectTo") ?? "").trim();
  if (
    redirectTo.startsWith("/client") &&
    profile.role === "client"
  ) {
    redirect(redirectTo);
  }
  if (
    redirectTo.startsWith("/cleaner") &&
    profile.role === "cleaner"
  ) {
    redirect(redirectTo);
  }

  redirect(roleHomePath(profile.role));
}

export async function register(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
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

  if (data.session) {
    const { error: profileError } = await supabase.from("profiles").upsert({
      id: data.user.id,
      role,
      full_name: fullName || null,
    });

    if (profileError) {
      return { error: profileError.message };
    }

    redirect(roleHomePath(role));
  }

  return {
    message:
      "Check your email to confirm your account, then sign in to continue.",
  };
}
