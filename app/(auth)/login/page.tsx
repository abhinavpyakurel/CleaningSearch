import { redirect } from "next/navigation";

import { loginAction } from "@/app/(auth)/login/actions";
import { LoginForm } from "@/app/(auth)/login/login-form";
import { roleHomePath } from "@/lib/auth";
import { getProfileRole } from "@/lib/profiles";
import { createClient } from "@/lib/supabase/server";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { redirectTo?: string };
}) {
  const { redirectTo } = searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { role } = await getProfileRole(supabase, user.id);
    if (role) {
      redirect(roleHomePath(role));
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
      <LoginForm action={loginAction} redirectTo={redirectTo} />
    </main>
  );
}
