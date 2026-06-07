"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";

import {
  submitCounterOfferAction,
  type CounterOfferActionState,
} from "@/app/cleaner/requests/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  formatUsdFromCents,
  formatHourlyRate,
} from "@/lib/booking-price";
import type { CounterEditableField } from "@/lib/counter-offer";
import {
  EXTRA_TASKS,
  getExtraTaskLabel,
  type ExtraTask,
} from "@/lib/intake-estimate";

const initialState: CounterOfferActionState = { error: null };

type CounterOfferFormProps = {
  bookingId: string;
  editableFields: CounterEditableField[];
  currentExtraTasks: ExtraTask[];
  minimumHours: number;
  maximumHours: number;
  recommendedHours: number;
  clientRequestedHours: number;
  totalPriceCents: number | null;
  hourlyRateSnapshot: number | null;
};

function SubmitCounterButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" variant="secondary" disabled={pending}>
      {pending ? "Sending…" : "Send counter offer"}
    </Button>
  );
}

function formatHours(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export function CounterOfferForm({
  bookingId,
  editableFields,
  currentExtraTasks,
  minimumHours,
  maximumHours,
  recommendedHours,
  clientRequestedHours,
  totalPriceCents,
  hourlyRateSnapshot,
}: CounterOfferFormProps) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useFormState(
    submitCounterOfferAction,
    initialState
  );
  const [requestedHours, setRequestedHours] = useState(clientRequestedHours);
  const [extraTasks, setExtraTasks] = useState<ExtraTask[]>(currentExtraTasks);

  function toggleExtraTask(task: ExtraTask) {
    setExtraTasks((current) =>
      current.includes(task)
        ? current.filter((item) => item !== task)
        : [...current, task]
    );
  }

  if (!open) {
    return (
      <Button type="button" variant="outline" onClick={() => setOpen(true)}>
        Suggest adjustment
      </Button>
    );
  }

  return (
    <form
      action={formAction}
      className="mt-4 w-full space-y-4 rounded-lg border border-dashed border-border p-4"
    >
      <input type="hidden" name="booking_id" value={bookingId} />

      <div>
        <p className="text-sm font-medium">Suggest a structured adjustment</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Adjust only measurable scope details the client already selected.
          Recommended: {formatHours(recommendedHours)} hrs · Current request:{" "}
          {formatHours(clientRequestedHours)} hrs · Price:{" "}
          {formatUsdFromCents(totalPriceCents)} · Rate:{" "}
          {formatHourlyRate(hourlyRateSnapshot)}
        </p>
      </div>

      <div className="grid gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor={`${bookingId}-requested-hours`}>Requested hours</Label>
          <input
            id={`${bookingId}-requested-hours`}
            name="counter_requested_hours"
            type="number"
            step="0.5"
            min={minimumHours}
            max={maximumHours}
            value={requestedHours}
            onChange={(event) => setRequestedHours(Number(event.target.value))}
            className="h-10 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
          <p className="text-xs text-muted-foreground">
            Allowed range for adjusted scope: {formatHours(minimumHours)}–
            {formatHours(maximumHours)} hours
          </p>
        </div>

        {editableFields
          .filter((field) => field.field !== "requested_hours")
          .map((field) => (
            <div key={field.field} className="grid gap-1.5">
              <Label htmlFor={`${bookingId}-${field.field}`}>{field.label}</Label>
              <select
                id={`${bookingId}-${field.field}`}
                name={`counter_${field.field}`}
                defaultValue={field.currentValue}
                className="h-10 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {field.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          ))}

        <div className="grid gap-2">
          <Label>Extra tasks</Label>
          <div className="flex flex-wrap gap-2">
            {EXTRA_TASKS.map((task) => {
              const selected = extraTasks.includes(task);
              return (
                <label
                  key={task}
                  className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs font-medium ${
                    selected
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground"
                  }`}
                >
                  <input
                    type="checkbox"
                    name="counter_extra_tasks"
                    value={task}
                    checked={selected}
                    onChange={() => toggleExtraTask(task)}
                    className="sr-only"
                  />
                  {getExtraTaskLabel(task)}
                </label>
              );
            })}
          </div>
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor={`${bookingId}-counter-reason`}>Reason</Label>
          <Textarea
            id={`${bookingId}-counter-reason`}
            name="counter_reason"
            required
            rows={3}
            placeholder="Explain why this adjustment is needed, e.g. kitchen has heavier buildup or selected time is too low."
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <SubmitCounterButton />
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>

      {state.error ? (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
