"use client";

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

const initialState: BookActionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Submitting…" : "Request booking"}
    </Button>
  );
}

export function BookForm() {
  const [state, formAction] = useFormState(createBookingAction, initialState);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl">Book a cleaning</CardTitle>
        <CardDescription>
          Enter where and when you need service. We will match you with a
          cleaner next.
        </CardDescription>
      </CardHeader>
      <form action={formAction} noValidate={false}>
        <CardContent className="flex flex-col gap-4">
          {state.error ? (
            <p
              role="alert"
              className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {state.error}
            </p>
          ) : null}

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
            />
          </div>

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
