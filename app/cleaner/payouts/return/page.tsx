import { redirect } from "next/navigation";

import { syncCleanerStripeStatus } from "@/app/cleaner/dashboard/actions";
import { createClient } from "@/lib/supabase/server";

export default async function CleanerPayoutsReturnPage() {
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

  if (!profile || profile.role !== "cleaner") {
    redirect("/client/home");
  }

  const { data: cleanerProfile } = await supabase
    .from("cleaner_profiles")
    .select("stripe_account_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (cleanerProfile?.stripe_account_id) {
    await syncCleanerStripeStatus(user.id, cleanerProfile.stripe_account_id);
  }

  redirect("/cleaner/dashboard");
}
