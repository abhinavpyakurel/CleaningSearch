"use client";

import Link from "next/link";
import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";

import { register, type AuthActionState } from "@/app/(auth)/actions";
import type { ProfileRole } from "@/lib/auth";
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
import { cn } from "@/lib/utils";

const initialState: AuthActionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Creating account…" : "Create account"}
    </Button>
  );
}

function RoleOption({
  id,
  label,
  description,
  value,
  selected,
  onSelect,
}: {
  id: string;
  label: string;
  description: string;
  value: ProfileRole;
  selected: boolean;
  onSelect: (role: ProfileRole) => void;
}) {
  return (
    <label
      htmlFor={id}
      className={cn(
        "flex cursor-pointer flex-col gap-1 rounded-lg border p-3 transition-colors",
        selected
          ? "border-primary bg-primary/5 ring-1 ring-primary"
          : "border-border hover:bg-muted/50"
      )}
    >
      <div className="flex items-center gap-2">
        <input
          id={id}
          type="radio"
          name="role"
          value={value}
          checked={selected}
          onChange={() => onSelect(value)}
          className="size-4 accent-primary"
        />
        <span className="text-sm font-medium">{label}</span>
      </div>
      <span className="pl-6 text-xs text-muted-foreground">{description}</span>
    </label>
  );
}

export function RegisterForm() {
  const [role, setRole] = useState<ProfileRole>("client");
  const [state, formAction] = useFormState(register, initialState);

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl">Create an account</CardTitle>
        <CardDescription>
          Join CleanMatch as a client or a cleaner
        </CardDescription>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="flex flex-col gap-4">
          {state.error ? (
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {state.error}
            </p>
          ) : null}
          {state.message ? (
            <p className="rounded-lg border border-border bg-muted px-3 py-2 text-sm text-muted-foreground">
              {state.message}
            </p>
          ) : null}
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-sm font-medium">I am signing up as</legend>
            <div className="grid gap-2">
              <RoleOption
                id="role-client"
                label="I need cleaning"
                description="Book trusted cleaners for your home"
                value="client"
                selected={role === "client"}
                onSelect={setRole}
              />
              <RoleOption
                id="role-cleaner"
                label="I'm a cleaner"
                description="Offer services and manage your jobs"
                value="cleaner"
                selected={role === "cleaner"}
                onSelect={setRole}
              />
            </div>
          </fieldset>
          <div className="flex flex-col gap-2">
            <Label htmlFor="fullName">Full name</Label>
            <Input
              id="fullName"
              name="fullName"
              type="text"
              autoComplete="name"
              placeholder="Jane Doe"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="you@example.com"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <SubmitButton />
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
