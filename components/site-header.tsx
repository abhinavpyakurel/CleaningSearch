import Link from "next/link";
import { headers } from "next/headers";

import { Button } from "@/components/ui/button";
import { getProfile } from "@/lib/profiles";
import { createClient } from "@/lib/supabase/server";

export async function SiteHeader() {
  const pathname = headers().get("x-pathname") ?? "";
  if (pathname === "/") {
    return null;
  }

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
          ) : (
            <>
              {profile.role === "client" ? (
                <>
                  <Button variant="ghost" render={<Link href="/client/bookings" />}>
                    My bookings
                  </Button>
                  <Button render={<Link href="/client/cleaners" />}>
                    Find a cleaner
                  </Button>
                </>
              ) : profile.role === "cleaner" ? (
                <Button render={<Link href="/cleaner/dashboard" />}>
                  Dashboard
                </Button>
              ) : null}
              <Button variant="ghost" render={<Link href="/logout" />}>
                Log out
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
