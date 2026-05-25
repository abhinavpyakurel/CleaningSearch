import Link from "next/link";

import { Button } from "@/components/ui/button";
import { getProfile } from "@/lib/profiles";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/site-header";

export default async function ClientHomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { full_name } = user
    ? await getProfile(supabase, user.id)
    : { full_name: null };

  return (
    <>
    <SiteHeader/>
    <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col gap-6 p-8">
      <div>
        <h1 className="text-2xl font-semibold">Client home</h1>
        {full_name ? (
          <p className="mt-1 text-muted-foreground">Welcome, {full_name}</p>
        ) : null}
      </div>
      <nav className="flex flex-col gap-3 sm:flex-row">
        <Button render={<Link href="/client/cleaners" />}>Find a cleaner</Button>
        <Button variant="outline" render={<Link href="/client/bookings" />}>
          View my bookings
        </Button>
      </nav>
    </main>
    </>
  );
}
