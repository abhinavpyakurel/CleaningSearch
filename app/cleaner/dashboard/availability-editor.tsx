"use client";

import { useMemo, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";

import {
  saveCleanerAvailabilityAction,
  type SaveCleanerAvailabilityState,
} from "@/app/cleaner/dashboard/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DAY_LABELS,
  type CleanerAvailabilityWindow,
  type DayAvailabilityState,
  windowsToDayStates,
} from "@/lib/cleaner-availability";
import { cn } from "@/lib/utils";

const initialState: SaveCleanerAvailabilityState = {};

type AvailabilityEditorProps = {
  initialWindows: CleanerAvailabilityWindow[];
};

function SaveAvailabilityButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : "Save availability"}
    </Button>
  );
}

export function AvailabilityEditor({ initialWindows }: AvailabilityEditorProps) {
  const [state, formAction] = useFormState(
    saveCleanerAvailabilityAction,
    initialState
  );
  const [dayStates, setDayStates] = useState<DayAvailabilityState[]>(() =>
    windowsToDayStates(initialWindows)
  );

  const enabledCount = useMemo(
    () => dayStates.filter((day) => day.enabled).length,
    [dayStates]
  );

  function updateDay(
    dayOfWeek: number,
    patch: Partial<DayAvailabilityState>
  ) {
    setDayStates((current) =>
      current.map((day, index) =>
        index === dayOfWeek ? { ...day, ...patch } : day
      )
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.error ? (
        <p
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {state.error}
        </p>
      ) : null}

      {state.success ? (
        <p
          role="status"
          className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800"
        >
          Availability saved.
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {DAY_LABELS.map((label, dayOfWeek) => {
          const day = dayStates[dayOfWeek]!;
          return (
            <div
              key={label}
              className={cn(
                "rounded-xl border p-4 transition-colors",
                day.enabled
                  ? "border-[#00695C]/30 bg-[#00695C]/5"
                  : "border-gray-100 bg-gray-50/50"
              )}
            >
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  name={`day_${dayOfWeek}_enabled`}
                  value="true"
                  checked={day.enabled}
                  onChange={(event) =>
                    updateDay(dayOfWeek, { enabled: event.target.checked })
                  }
                  className="size-4 rounded border-input"
                />
                <span className="text-sm font-semibold text-gray-900">
                  {label}
                </span>
              </label>

              {day.enabled ? (
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor={`day_${dayOfWeek}_start`} className="text-xs">
                      Start
                    </Label>
                    <Input
                      id={`day_${dayOfWeek}_start`}
                      name={`day_${dayOfWeek}_start`}
                      type="time"
                      required
                      value={day.startTime}
                      onChange={(event) =>
                        updateDay(dayOfWeek, { startTime: event.target.value })
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor={`day_${dayOfWeek}_end`} className="text-xs">
                      End
                    </Label>
                    <Input
                      id={`day_${dayOfWeek}_end`}
                      name={`day_${dayOfWeek}_end`}
                      type="time"
                      required
                      value={day.endTime}
                      onChange={(event) =>
                        updateDay(dayOfWeek, { endTime: event.target.value })
                      }
                    />
                  </div>
                </div>
              ) : (
                <>
                  <input
                    type="hidden"
                    name={`day_${dayOfWeek}_start`}
                    value={day.startTime}
                  />
                  <input
                    type="hidden"
                    name={`day_${dayOfWeek}_end`}
                    value={day.endTime}
                  />
                </>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-gray-500">
          {enabledCount === 0
            ? "No days selected — clients cannot book you until you add availability."
            : `${enabledCount} day${enabledCount === 1 ? "" : "s"} selected.`}
        </p>
        <SaveAvailabilityButton />
      </div>
    </form>
  );
}
