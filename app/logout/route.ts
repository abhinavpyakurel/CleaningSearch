import { createServerClient } from "@supabase/ssr";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import type { Database } from "@/lib/database.types";

export const dynamic = "force-dynamic";

function clearSupabaseAuthCookies(
  response: NextResponse,
  cookieNames: string[]
) {
  for (const name of cookieNames) {
    if (name.startsWith("sb-")) {
      response.cookies.delete(name);
    }
  }
}

async function performSignOut(response: NextResponse) {
  const cookieStore = cookies();
  const cookieNames = cookieStore.getAll().map((cookie) => cookie.name);

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
            try {
              cookieStore.set(name, value, options);
            } catch {
              // Route handlers may not always allow cookieStore writes.
            }
          });
        },
      },
    }
  );

  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error("Sign out failed:", error.message);
    return { error };
  }

  clearSupabaseAuthCookies(response, cookieNames);
  revalidatePath("/", "layout");

  return { error: null };
}

export async function POST() {
  const response = NextResponse.json({ ok: true });

  response.headers.set("Cache-Control", "no-store, max-age=0, must-revalidate");

  const { error } = await performSignOut(response);

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }

  return response;
}

export async function GET(request: Request) {
  const response = NextResponse.redirect(new URL("/", request.url), {
    status: 303,
  });

  response.headers.set("Cache-Control", "no-store, max-age=0, must-revalidate");

  const { error } = await performSignOut(response);

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }

  return response;
}
