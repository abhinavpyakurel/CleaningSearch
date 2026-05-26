"use client";

import { useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";

import {
  updateCleanerProfileAction,
  type UpdateCleanerProfileState,
} from "@/app/cleaner/dashboard/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const initialState: UpdateCleanerProfileState = {};

type CleanerStatsCardProps = {
  hourlyRate: number | null;
  serviceRadiusMiles: number | null;
  bio: string | null;
  totalJobs: number;
  avgRating: number;
};

function SaveButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : "Save changes"}
    </Button>
  );
}

export function CleanerStatsCard({
  hourlyRate,
  serviceRadiusMiles,
  bio,
  totalJobs,
  avgRating,
}: CleanerStatsCardProps) {
  const [editing, setEditing] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [state, formAction] = useFormState(
    updateCleanerProfileAction,
    initialState
  );

  useEffect(() => {
    if (state.success) {
      setEditing(false);
    }
  }, [state.success]);

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
      <div className="flex items-start justify-between">
        <h2 className="text-xl font-bold text-gray-900">Your stats</h2>
        {!editing ? (
          <button
            type="button"
            className="rounded-lg border border-gray-200 px-4 py-1.5 text-sm text-gray-600 transition-all hover:border-[#00695C] hover:text-[#00695C]"
            onClick={() => {
              setFormKey((key) => key + 1);
              setEditing(true);
            }}
          >
            Edit profile
          </button>
        ) : null}
      </div>

      {editing ? (
        <form
          key={formKey}
          action={formAction}
          className="mt-6 flex flex-col gap-4"
        >
          {state.error ? (
            <p
              role="alert"
              className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {state.error}
            </p>
          ) : null}
          <div className="flex flex-col gap-2">
            <Label htmlFor="edit_hourly_rate">Hourly rate ($)</Label>
            <Input
              id="edit_hourly_rate"
              name="hourly_rate"
              type="number"
              min={0.01}
              step={0.01}
              required
              defaultValue={
                hourlyRate != null ? String(hourlyRate) : undefined
              }
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="edit_service_radius_miles">
              Service radius (miles)
            </Label>
            <Input
              id="edit_service_radius_miles"
              name="service_radius_miles"
              type="number"
              min={1}
              step={1}
              required
              defaultValue={
                serviceRadiusMiles != null
                  ? String(serviceRadiusMiles)
                  : undefined
              }
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="edit_bio">Bio</Label>
            <Textarea
              id="edit_bio"
              name="bio"
              rows={4}
              maxLength={300}
              placeholder="Describe your cleaning experience and specialties."
              defaultValue={bio ?? ""}
            />
            <p className="text-xs text-gray-400">
              Optional. Up to 300 characters.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <SaveButton />
            <Button
              type="button"
              variant="ghost"
              onClick={() => setEditing(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="rounded-xl bg-gray-50 p-4">
            <p className="text-xs uppercase tracking-wide text-gray-400">
              Hourly Rate
            </p>
            <p className="mt-1 text-xl font-bold text-gray-900">
              {hourlyRate != null ? `$${hourlyRate}/hr` : "Not set"}
            </p>
          </div>
          <div className="rounded-xl bg-gray-50 p-4">
            <p className="text-xs uppercase tracking-wide text-gray-400">
              Service Radius
            </p>
            <p className="mt-1 text-xl font-bold text-gray-900">
              {serviceRadiusMiles != null
                ? `${serviceRadiusMiles} mi`
                : "Not set"}
            </p>
          </div>
          <div className="rounded-xl bg-gray-50 p-4">
            <p className="text-xs uppercase tracking-wide text-gray-400">
              Total Jobs
            </p>
            <p className="mt-1 text-xl font-bold text-gray-900">{totalJobs}</p>
          </div>
          <div className="rounded-xl bg-gray-50 p-4">
            <p className="text-xs uppercase tracking-wide text-gray-400">
              Avg Rating
            </p>
            <p className="mt-1 text-xl font-bold text-gray-900">
              {avgRating.toFixed(1)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
