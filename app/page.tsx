import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { roleHomePath } from "@/lib/auth";
import { getProfileRole } from "@/lib/profiles";
import { createClient } from "@/lib/supabase/server";

const STEPS = [
  {
    title: "Browse cleaners",
    description: "See real profiles, ratings, and availability.",
  },
  {
    title: "Book directly",
    description: "Pick your cleaner and send a request.",
  },
  {
    title: "They confirm",
    description: "Your cleaner accepts and you're all set.",
  },
] as const;

export default async function LandingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { role } = await getProfileRole(supabase, user.id);
    if (role === "client" || role === "cleaner") {
      redirect(roleHomePath(role));
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/" className="text-sm font-semibold tracking-tight">
            CleanMatch
          </Link>
          <nav className="flex items-center gap-2">
            <Button variant="ghost" render={<Link href="/login" />}>
              Log in
            </Button>
            <Button render={<Link href="/register" />}>Sign up</Button>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
              Find trusted cleaners, book in minutes.
            </h1>
            <p className="mt-4 text-balance text-muted-foreground sm:text-lg">
              CleanMatch connects you with verified local cleaners. Browse
              profiles, pick your cleaner, and manage everything in one place.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button size="lg" render={<Link href="/register" />}>
                Find a cleaner
              </Button>
              <Button
                size="lg"
                variant="outline"
                render={<Link href="/register" />}
              >
                I&apos;m a cleaner — Join here
              </Button>
            </div>
          </div>
        </section>

        <section className="border-t border-border bg-muted/40">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <h2 className="text-center text-xl font-semibold">How it works</h2>
            <ol className="mt-10 grid gap-8 sm:grid-cols-3">
              {STEPS.map((step, index) => (
                <li key={step.title} className="flex flex-col gap-2 text-center">
                  <span className="mx-auto flex size-9 items-center justify-center rounded-full border border-border bg-background text-sm font-medium">
                    {index + 1}
                  </span>
                  <h3 className="font-medium">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {step.description}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-6">
        <p className="text-center text-sm text-muted-foreground">
          © 2026 CleanMatch
        </p>
      </footer>
    </div>
  );
}
