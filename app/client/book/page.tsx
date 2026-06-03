import { redirect } from "next/navigation";

import { BookForm } from "@/app/client/book/book-form";
import type { Tables } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/server";

type BookCleaner = Pick<Tables<"cleaner_profiles">, "hourly_rate"> & {
  profiles: Pick<Tables<"profiles">, "full_name"> | null;
};

type ClientBookPageProps = {
  searchParams: {
    cleaner_id?: string;
  };
};

export default async function ClientBookPage({ searchParams }: ClientBookPageProps) {
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

  if (!profile || profile.role !== "client") {
    redirect("/cleaner/dashboard");
  }

  const cleanerId = searchParams?.cleaner_id?.trim() ?? null;

  if (!cleanerId) {
    redirect("/client/cleaners");
  }

  const { data: cleaner, error: cleanerError } = await supabase
    .from("cleaner_profiles")
    .select(
      `
      hourly_rate,
      profiles ( full_name )
    `
    )
    .eq("user_id", cleanerId)
    .maybeSingle();

  if (cleanerError) {
    throw new Error(cleanerError.message);
  }

  if (!cleaner) {
    redirect("/client/cleaners");
  }

  const detail = cleaner as BookCleaner;
  const cleanerName = detail.profiles?.full_name?.trim() || "Cleaner";

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col gap-6 p-4 sm:p-8">
      <BookForm
        cleanerId={cleanerId}
        cleanerName={cleanerName}
        hourlyRate={detail.hourly_rate}
      />
    </main>
  );
}