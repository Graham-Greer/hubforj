"use client";

import { useState, useTransition } from "react";
import Field from "@/components/ui/form/field/Field";
import Input from "@/components/ui/form/input/Input";
import Select from "@/components/ui/form/select/Select";
import Button from "@/components/ui/button/Button";
import ErrorState from "@/components/ui/error-state/ErrorState";
import { establishSessionFromCustomToken } from "@/lib/auth/client-session";

export default function MemberJoinClient({
  joinAction,
  hubSlug = "",
  plans = [],
  signInHref,
  className = "",
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function onSubmit(event) {
    event.preventDefault();
    setError("");

    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      try {
        const result = await joinAction(formData);
        if (!result?.ok) {
          setError(result?.message || "Unable to create account.");
          return;
        }

        await establishSessionFromCustomToken(result.customToken);
        window.location.assign(result.redirectTo || (hubSlug ? `/${hubSlug}/account` : "/account"));
      } catch {
        setError("Unable to create account.");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className={className}>
      {hubSlug ? <input type="hidden" name="hubSlug" value={hubSlug} /> : null}
      {error ? <ErrorState title="Could not complete onboarding" body={error} variant="compact" /> : null}

      <Field id="name" label="Full name" required>
        <Input id="name" name="name" required autoComplete="name" />
      </Field>

      <Field id="email" label="Email address" required>
        <Input id="email" name="email" type="email" required autoComplete="email" />
      </Field>

      <Field id="planId" label="Membership plan" required>
        <Select
          id="planId"
          name="planId"
          required
          options={plans.map((plan) => ({
            value: plan.id,
            label: `${plan.title} • $${Number(plan.price || 0).toFixed(2)}`,
          }))}
          placeholder="Select a plan"
        />
      </Field>

      <Button type="submit" disabled={pending}>{pending ? "Creating account..." : "Create account"}</Button>
      <Button href={signInHref} variant="tertiary">Already have an account? Sign in</Button>
    </form>
  );
}
