"use client";

import { useState, useTransition } from "react";

import { updateCleanerAvailability } from "@/app/cleaner/dashboard/actions";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

type AvailabilityToggleProps = {
  initialAvailable: boolean;
};

export function AvailabilityToggle({ initialAvailable }: AvailabilityToggleProps) {
  const [available, setAvailable] = useState(initialAvailable);
  const [pending, startTransition] = useTransition();

  function handleCheckedChange(checked: boolean) {
    const previous = available;
    setAvailable(checked);
    startTransition(async () => {
      const { error } = await updateCleanerAvailability(checked);
      if (error) {
        setAvailable(previous);
      }
    });
  }

  return (
    <div className="flex w-full items-center justify-between gap-4">
      <Label htmlFor="availability">Available for jobs</Label>
      <Switch
        id="availability"
        checked={available}
        onCheckedChange={handleCheckedChange}
        disabled={pending}
      />
    </div>
  );
}
