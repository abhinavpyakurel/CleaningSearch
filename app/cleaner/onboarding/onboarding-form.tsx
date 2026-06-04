"use client";

import { useFormState, useFormStatus } from "react-dom";

import {
  onboardingAction,
  type OnboardingActionState,
} from "@/app/cleaner/onboarding/actions";
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
import { ProfilePhotoUrlField } from "@/app/cleaner/onboarding/profile-photo-url-field";
import { Textarea } from "@/components/ui/textarea";

const initialState: OnboardingActionState = {};

type OnboardingFormProps = {
  defaultFullName: string;
  defaultBio: string;
  defaultHourlyRate: string;
  defaultServiceRadius: string;
  defaultYearsExperience: string;
  defaultProfilePhotoUrl: string;
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Saving…" : "Save and continue"}
    </Button>
  );
}

export function OnboardingForm({
  defaultFullName,
  defaultBio,
  defaultHourlyRate,
  defaultServiceRadius,
  defaultYearsExperience,
  defaultProfilePhotoUrl,
}: OnboardingFormProps) {
  const [state, formAction] = useFormState(onboardingAction, initialState);

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle className="text-2xl">Cleaner onboarding</CardTitle>
        <CardDescription>
          Tell clients about your experience and service area.
        </CardDescription>
      </CardHeader>
      <form action={formAction}>
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
            <Label htmlFor="full_name">Full name</Label>
            <Input
              id="full_name"
              name="full_name"
              type="text"
              autoComplete="name"
              required
              defaultValue={defaultFullName}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              name="bio"
              rows={4}
              placeholder="Describe your cleaning experience and specialties."
              defaultValue={defaultBio}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="hourly_rate">Hourly rate ($)</Label>
            <Input
              id="hourly_rate"
              name="hourly_rate"
              type="number"
              min={1}
              step={0.01}
              required
              defaultValue={defaultHourlyRate}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="service_radius_miles">Service radius (miles)</Label>
            <Input
              id="service_radius_miles"
              name="service_radius_miles"
              type="number"
              min={1}
              step={1}
              required
              defaultValue={defaultServiceRadius}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="years_experience">Years of experience</Label>
            <Input
              id="years_experience"
              name="years_experience"
              type="number"
              min={0}
              step={1}
              required
              defaultValue={defaultYearsExperience}
            />
          </div>
          <ProfilePhotoUrlField defaultValue={defaultProfilePhotoUrl} />
        </CardContent>
        <CardFooter>
          <SubmitButton />
        </CardFooter>
      </form>
    </Card>
  );
}
