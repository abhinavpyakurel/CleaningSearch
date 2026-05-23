import { NextResponse, type NextRequest } from "next/server";

import { roleHomePath } from "@/lib/auth";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { supabase, supabaseResponse, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  const isClientRoute = pathname.startsWith("/client");
  const isCleanerRoute = pathname.startsWith("/cleaner");

  if (!isClientRoute && !isCleanerRoute) {
    return supabaseResponse;
  }

  if (!user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    return NextResponse.redirect(loginUrl);
  }

  if (isClientRoute && profile.role !== "client") {
    return NextResponse.redirect(
      new URL(roleHomePath(profile.role), request.url)
    );
  }

  if (isCleanerRoute && profile.role !== "cleaner") {
    return NextResponse.redirect(
      new URL(roleHomePath(profile.role), request.url)
    );
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
