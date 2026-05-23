import { redirect } from "next/navigation";

import { RegisterForm } from "@/app/(auth)/register/register-form";
import { roleHomePath } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function RegisterPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile) {
      redirect(roleHomePath(profile.role));
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
      <RegisterForm />
    </main>
  );
}
