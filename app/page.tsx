import Link from "next/link";

const routes = [
  { href: "/login", label: "Login" },
  { href: "/register", label: "Register" },
  { href: "/home", label: "Client Home" },
  { href: "/book", label: "Book" },
  { href: "/bookings", label: "Bookings" },
  { href: "/dashboard", label: "Cleaner Dashboard" },
];

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-3xl font-semibold">CleanMatch</h1>
      <p className="text-muted-foreground text-center max-w-md">
        Connect with trusted cleaners in your area.
      </p>
      <nav className="flex flex-wrap justify-center gap-3">
        {routes.map((route) => (
          <Link
            key={route.href}
            href={route.href}
            className="rounded-md border px-4 py-2 text-sm hover:bg-accent"
          >
            {route.label}
          </Link>
        ))}
      </nav>
    </main>
  );
}
