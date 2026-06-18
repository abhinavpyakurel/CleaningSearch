import Link from "next/link";
import { headers } from "next/headers";

import { CleanerNav } from "@/components/cleaner-nav";
import { ClientNav } from "@/components/client-nav";
import { LogoutButton } from "@/components/logout-button";
import { getProfile } from "@/lib/profiles";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const HIDDEN_PATHS = new Set(["/", "/login", "/register"]);

function shouldHideHeader(pathname: string): boolean {
  if (!pathname || HIDDEN_PATHS.has(pathname)) {
    return true;
  }

  return false;
}

export async function SiteHeader() {
  const pathname = headers().get("x-pathname") ?? "";

  if (shouldHideHeader(pathname)) {
    return null;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
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
        <LogoutButton variant="button" />
      </div>
    </header>
  );
}
