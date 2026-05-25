import Link from "next/link";

import { Button } from "@/components/ui/button";
import { getProfile } from "@/lib/profiles";
import { createClient } from "@/lib/supabase/server";

export async function SiteHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const profile = user
    ? await getProfile(supabase, user.id)
    : { role: null, full_name: null, error: null };

  return (
    <header className="border-b border-border">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="text-sm font-semibold tracking-tight">
          CleanMatch
        </Link>
        <nav className="flex flex-wrap items-center justify-end gap-2">
          {!user ? (
            <>
              <Button variant="ghost" render={<Link href="/login" />}>
                Login
              </Button>
              <Button render={<Link href="/register" />}>Sign up</Button>
            </>
          ) : profile.role === "client" ? (
            <>
              <Button variant="ghost" render={<Link href="/client/bookings" />}>
                My bookings
              </Button>
              <Button render={<Link href="/client/book" />}>
                Book a cleaning
              </Button>
            </>
          ) : profile.role === "cleaner" ? (
            <Button render={<Link href="/cleaner/dashboard" />}>
              Dashboard
            </Button>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
