"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import type { CleanType, IntakeEstimate } from "@/lib/intake-estimate";

type FormState = {
  bedrooms: string;
  bathrooms: string;
  cleanType: CleanType;
  hasPets: boolean;
};

const initialForm: FormState = {
  bedrooms: "2",
  bathrooms: "1",
  cleanType: "maintenance",
  hasPets: false,
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function BookPage() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [estimate, setEstimate] = useState<IntakeEstimate | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleGetEstimate(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    setEstimate(null);

    const bedrooms = Number(form.bedrooms);
    const bathrooms = Number(form.bathrooms);

    if (
      !Number.isFinite(bedrooms) ||
      bedrooms < 0 ||
      !Number.isFinite(bathrooms) ||
      bathrooms < 0
    ) {
      setError("Enter valid non-negative numbers for bedrooms and bathrooms.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bedrooms,
          bathrooms,
          cleanType: form.cleanType,
          hasPets: form.hasPets,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Failed to get estimate.");
        return;
      }

      setEstimate(data as IntakeEstimate);
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col gap-8 p-8">
      <div>
        <h1 className="text-2xl font-semibold">Book a Cleaner</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tell us about your home to see estimated hours and price range before
          you choose a cleaner.
        </p>
      </div>

      <form onSubmit={handleGetEstimate} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Bedrooms</span>
          <input
            type="number"
            min={0}
            step={1}
            required
            value={form.bedrooms}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, bedrooms: e.target.value }))
            }
            className="rounded-lg border border-input bg-background px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Bathrooms</span>
          <input
            type="number"
            min={0}
            step={0.5}
            required
            value={form.bathrooms}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, bathrooms: e.target.value }))
            }
            className="rounded-lg border border-input bg-background px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Clean type</span>
          <select
            value={form.cleanType}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                cleanType: e.target.value as CleanType,
              }))
            }
            className="rounded-lg border border-input bg-background px-3 py-2"
          >
            <option value="maintenance">Maintenance</option>
            <option value="deep">Deep clean</option>
            <option value="move-out">Move-out</option>
          </select>
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.hasPets}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, hasPets: e.target.checked }))
            }
            className="size-4 rounded border-input"
          />
          <span className="font-medium">Pets in the home</span>
        </label>

        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        <Button type="submit" disabled={loading}>
          {loading ? "Calculating…" : "Get estimate"}
        </Button>
      </form>

      {estimate ? (
        <section
          className="rounded-lg border border-border bg-muted/30 p-4"
          aria-live="polite"
        >
          <h2 className="text-lg font-semibold">Your estimate</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Estimated hours</dt>
              <dd className="font-medium">{estimate.estimated_hours}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Suggested price range</dt>
              <dd className="font-medium">
                {formatCurrency(estimate.suggested_price_min)} –{" "}
                {formatCurrency(estimate.suggested_price_max)}
              </dd>
            </div>
          </dl>
          <p className="mt-3 text-sm text-muted-foreground">
            {estimate.scope_summary}
          </p>
          <p className="mt-4 text-xs text-muted-foreground">
            Next: choose a cleaner (coming soon).
          </p>
        </section>
      ) : null}
    </main>
  );
}
