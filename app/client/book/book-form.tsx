"use client";

import { useMemo, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";

import {
  createBookingAction,
  type BookActionState,
} from "@/app/client/book/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  computeBookingPricing,
  formatHourlyRate,
  formatUsd,
  PLATFORM_SERVICE_FEE_RATE,
} from "@/lib/booking-price";

const initialState: BookActionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Submitting…" : "Request booking"}
    </Button>
  );
}

type BookFormProps = {
  cleanerId: string;
  cleanerName: string;
  hourlyRate: number | null;
};

export function BookForm({
  cleanerId,
  cleanerName,
  hourlyRate,
}: BookFormProps) {
  const [state, formAction] = useFormState(createBookingAction, initialState);
  const [durationRaw, setDurationRaw] = useState("");

  const pricing = useMemo(() => {
    const durationHours = Number(durationRaw);
    if (
      hourlyRate == null ||
      !Number.isFinite(hourlyRate) ||
      hourlyRate <= 0 ||
      !durationRaw ||
      !Number.isFinite(durationHours) ||
      durationHours <= 0
    ) {
      return null;
    }

    return computeBookingPricing(hourlyRate, durationHours);
  }, [hourlyRate, durationRaw]);

  const serviceFeePercent = Math.round(PLATFORM_SERVICE_FEE_RATE * 100);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl">Book a cleaning</CardTitle>
        <CardDescription>
          Booking with {cleanerName}. Enter where and when you need service.
        </CardDescription>
      </CardHeader>
      <form action={formAction} noValidate={false}>
        <input type="hidden" name="cleaner_id" value={cleanerId} />

        <CardContent className="flex flex-col gap-4">
          {state.error ? (
            <p
              role="alert"
              className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {state.error}
            </p>
          ) : null}

          <div className="rounded-lg border bg-muted/40 px-4 py-3 text-sm">
            <p className="font-medium text-foreground">Cleaner</p>
            <p className="mt-1 text-muted-foreground">{cleanerName}</p>
            <p className="mt-2 font-medium text-foreground">Hourly rate</p>
            <p className="mt-1 text-muted-foreground">
              {formatHourlyRate(hourlyRate)}
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="service_address">Service address</Label>
            <Input
              id="service_address"
              name="service_address"
              type="text"
              autoComplete="street-address"
              required
              placeholder="123 Main St, Austin, TX"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="date">Date</Label>
              <Input id="date" name="date" type="date" required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="time">Time</Label>
              <Input id="time" name="time" type="time" required />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="duration_hours">Duration (hours)</Label>
            <Input
              id="duration_hours"
              name="duration_hours"
              type="number"
              min={0.5}
              step={0.5}
              required
              placeholder="3"
              value={durationRaw}
              onChange={(event) => setDurationRaw(event.target.value)}
            />
          </div>

          {pricing ? (
            <div className="rounded-lg border border-[#00695C]/20 bg-[#00695C]/5 px-4 py-3 text-sm">
              <p className="font-semibold text-gray-900">Estimated total</p>
              <dl className="mt-2 space-y-1.5 text-muted-foreground">
                <div className="flex justify-between gap-4">
                  <dt>Cleaner labor</dt>
                  <dd className="text-foreground">
                    {formatUsd(pricing.base_price)}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt>Service fee ({serviceFeePercent}%)</dt>
                  <dd className="text-foreground">
                    {formatUsd(pricing.platform_fee)}
                  </dd>
                </div>
                <div className="flex justify-between gap-4 border-t border-[#00695C]/10 pt-2 font-semibold text-gray-900">
                  <dt>Total</dt>
                  <dd>{formatUsd(pricing.total_price)}</dd>
                </div>
              </dl>
            </div>
          ) : hourlyRate != null ? (
            <p className="text-sm text-muted-foreground">
              Enter a duration to see your total.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              This cleaner has not set an hourly rate yet.
            </p>
          )}

          <div className="flex flex-col gap-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              name="notes"
              rows={3}
              placeholder="Access instructions, pets, focus areas…"
            />
          </div>
        </CardContent>
        <CardFooter>
          <SubmitButton />
        </CardFooter>
      </form>
    </Card>
  );
}
