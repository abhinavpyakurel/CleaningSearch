"use client";

import Link from "next/link";
import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";

import type { AuthActionState, registerAction } from "@/app/register/actions";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const initialState: AuthActionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Creating account…" : "Create account"}
    </Button>
  );
}

export function RegisterForm({
  action,
}: {
  action: typeof registerAction;
}) {
  const [role, setRole] = useState("client");
  const [state, formAction] = useFormState(action, initialState);

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl">Create an account</CardTitle>
        <CardDescription>
          Join CleanMatch as a client or a cleaner
        </CardDescription>
      </CardHeader>
      <form action={formAction}>
        <input type="hidden" name="role" value={role} />
        <CardContent className="flex flex-col gap-4">
          {state.error ? (
            <p
              role="alert"
              className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
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
            <RadioGroup
              value={role}
              onValueChange={(value) => setRole(value ?? "client")}
              className="gap-2"
            >
              <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 has-[[data-checked]]:border-primary has-[[data-checked]]:bg-primary/5 has-[[data-checked]]:ring-1 has-[[data-checked]]:ring-primary">
                <RadioGroupItem value="client" id="role-client" />
                <span className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium">I need cleaning</span>
                  <span className="text-xs text-muted-foreground">
                    Book trusted cleaners for your home
                  </span>
                </span>
              </label>
              <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 has-[[data-checked]]:border-primary has-[[data-checked]]:bg-primary/5 has-[[data-checked]]:ring-1 has-[[data-checked]]:ring-primary">
                <RadioGroupItem value="cleaner" id="role-cleaner" />
                <span className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium">I&apos;m a cleaner</span>
                  <span className="text-xs text-muted-foreground">
                    Offer services and manage your jobs
                  </span>
                </span>
              </label>
            </RadioGroup>
          </fieldset>
          <div className="flex flex-col gap-2">
            <Label htmlFor="full_name">Full name</Label>
            <Input
              id="full_name"
              name="full_name"
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
            <Link
              href="/login"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
