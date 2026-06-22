"use client";

import { useMemo, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { CheckCircle2 } from "lucide-react";

import {
  saveCleanerAvailabilityAction,
  type SaveCleanerAvailabilityState,
} from "@/app/cleaner/dashboard/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
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
    <Button type="submit" disabled={pending} className="gap-2">
      {pending ? "Saving…" : "Save availability"}
    </Button>
  );
}

function DayToggle({
  enabled,
  onToggle,
  label,
}: {
  enabled: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      role="switch"
      aria-checked={enabled}
      aria-label={`${label} availability`}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        enabled ? "bg-primary" : "bg-input"
      )}
    >
      <span
        className={cn(
          "pointer-events-none inline-block size-5 rounded-full bg-card shadow-sm ring-0 transition-transform",
          enabled ? "translate-x-5" : "translate-x-0"
        )}
      />
    </button>
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

      <div className="flex flex-col gap-1">
        {DAY_LABELS.map((label, dayOfWeek) => {
          const day = dayStates[dayOfWeek]!;

          return (
            <div key={label}>
              {dayOfWeek > 0 ? <Separator className="my-3" /> : null}
              <div className="flex items-center gap-4">
                <DayToggle
                  enabled={day.enabled}
                  label={label}
                  onToggle={() =>
                    updateDay(dayOfWeek, { enabled: !day.enabled })
                  }
                />

                <span
                  className={cn(
                    "w-24 text-sm font-medium",
                    day.enabled ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {label}
                </span>

                {day.enabled ? (
                  <>
                    <input
                      type="hidden"
                      name={`day_${dayOfWeek}_enabled`}
                      value="true"
                    />
                    <div className="flex flex-1 items-center gap-2">
                      <Input
                        id={`day_${dayOfWeek}_start`}
                        name={`day_${dayOfWeek}_start`}
                        type="time"
                        required
                        value={day.startTime}
                        onChange={(event) =>
                          updateDay(dayOfWeek, {
                            startTime: event.target.value,
                          })
                        }
                        className="h-9 w-auto text-sm"
                      />
                      <span className="text-sm text-muted-foreground">to</span>
                      <Input
                        id={`day_${dayOfWeek}_end`}
                        name={`day_${dayOfWeek}_end`}
                        type="time"
                        required
                        value={day.endTime}
                        onChange={(event) =>
                          updateDay(dayOfWeek, { endTime: event.target.value })
                        }
                        className="h-9 w-auto text-sm"
                      />
                    </div>
                  </>
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
                    <span className="text-sm italic text-muted-foreground/60">
                      Unavailable
                    </span>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {enabledCount === 0
            ? "No days enabled — save with at least one day to accept bookings."
            : `${enabledCount} day${enabledCount === 1 ? "" : "s"} enabled.`}
        </p>
        <div className="flex items-center gap-3">
          <SaveAvailabilityButton />
          {state.success ? (
            <div
              role="status"
              className="flex items-center gap-1.5 text-sm font-medium text-primary"
            >
              <CheckCircle2 className="size-4" />
              Saved
            </div>
          ) : null}
        </div>
      </div>
    </form>
  );
}
