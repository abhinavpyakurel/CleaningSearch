import { NextResponse, type NextRequest } from "next/server";

import { roleHomePath } from "@/lib/auth";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const { supabase, supabaseResponse, user } = await updateSession(request);

  const isProtectedRoute =
    pathname.startsWith("/client") || pathname.startsWith("/cleaner");

  if (!isProtectedRoute) {
    return supabaseResponse;
  }

  if (!user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile?.role) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith("/client") && profile.role !== "client") {
    return NextResponse.redirect(
      new URL(roleHomePath(profile.role), request.url)
    );
  }

  if (pathname.startsWith("/cleaner") && profile.role !== "cleaner") {
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
