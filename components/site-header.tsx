import Link from "next/link";
import { headers } from "next/headers";

import { Button } from "@/components/ui/button";
import { CleanerNav } from "@/components/cleaner-nav";
import { ClientNav } from "@/components/client-nav";
import { PublicNav } from "@/components/public-nav";
import { getProfile } from "@/lib/profiles";
import { createClient } from "@/lib/supabase/server";

const HIDDEN_PATHS = new Set(["/", "/login", "/register"]);

export async function SiteHeader() {
  const pathname = headers().get("x-pathname") ?? "";

  if (HIDDEN_PATHS.has(pathname)) {
    return null;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <PublicNav />;
  }

  const profile = await getProfile(supabase, user.id);

  if (profile.role === "client") {
    return <ClientNav />;
  }

  if (profile.role === "cleaner") {
    return <CleanerNav />;
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="text-sm font-semibold tracking-tight text-foreground">
          CleanMatch
        </Link>
        <Button variant="ghost" size="sm" render={<Link href="/logout" />}>
          Log out
        </Button>
      </div>
    </header>
  );
}
