"use client";

import { useState, useTransition } from "react";
import Button from "@/components/ui/button/Button";
import ErrorState from "@/components/ui/error-state/ErrorState";
import { establishSessionFromCustomToken } from "@/lib/auth/client-session";

export default function PlatformSignInClient({ signInAction }) {
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
        window.location.assign(result.redirectTo || "/platform/hubs");
      } catch {
        setError("Unable to sign in.");
      }
    });
  }

  return (
    <form onSubmit={onSubmit}>
      {error ? <ErrorState title="Sign-in failed" body={error} variant="compact" /> : null}
      <Button intent="brand" type="submit" disabled={pending}>
        {pending ? "Signing in..." : "Sign in as Superadmin"}
      </Button>
    </form>
  );
}
