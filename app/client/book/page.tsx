import { redirect } from "next/navigation";

import { BookForm } from "@/app/client/book/book-form";
import { createClient } from "@/lib/supabase/server";

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

  const cleanerId = searchParams?.cleaner_id ?? null;


  if (!cleanerId) {
    redirect("/client/cleaners");
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col gap-6 p-4 sm:p-8">
      <BookForm cleanerId={cleanerId} />
    </main>
  );
}