"use client";

import { useState, useTransition } from "react";
import Field from "@/components/ui/form/field/Field";
import Input from "@/components/ui/form/input/Input";
import Button from "@/components/ui/button/Button";
import ErrorState from "@/components/ui/error-state/ErrorState";
import { establishSessionFromCustomToken } from "@/lib/auth/client-session";

export default function MemberSignInClient({
  signInAction,
  hubSlug = "",
  joinHref,
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
        const result = await signInAction(formData);
        if (!result?.ok) {
          setError(result?.message || "Unable to sign in.");
          return;
        }

        await establishSessionFromCustomToken(result.customToken);
        window.location.assign(result.redirectTo || (hubSlug ? `/${hubSlug}/account` : "/account"));
      } catch {
        setError("Unable to sign in.");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className={className}>
      {hubSlug ? <input type="hidden" name="hubSlug" value={hubSlug} /> : null}
      {error ? <ErrorState title="Sign-in failed" body={error} variant="compact" /> : null}
      <Field id="email" label="Email address" required>
        <Input id="email" name="email" type="email" required autoComplete="email" />
      </Field>
      <Button type="submit" disabled={pending}>{pending ? "Signing in..." : "Sign in"}</Button>
      <Button href={joinHref} variant="tertiary">Need an account? Join now</Button>
    </form>
  );
}
