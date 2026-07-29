"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { requestPasswordResetAction } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button type="submit" className="button-link" data-variant="primary" disabled={pending}>
      {pending ? "Sending reset email..." : "Send reset email"}
    </button>
  );
}

export default function ForgotPasswordForm({ defaultEmail = "" }) {
  const [state, formAction] = useActionState(requestPasswordResetAction, {
    status: "idle",
    message: "",
    values: { email: defaultEmail },
  });

  return (
    <form action={formAction} className="signup-form-shell">
      {state?.status === "error" ? <div className="form-message" data-tone="danger">{state.message}</div> : null}
      {state?.status === "success" || state?.status === "logged" ? (
        <div className="form-message" data-tone="success">{state.message}</div>
      ) : null}
      <div className="signup-form-grid">
        <label className="form-field">
          <span className="form-label">Email</span>
          <input
            className="form-input"
            name="email"
            type="email"
            autoComplete="email"
            defaultValue={state?.values?.email || defaultEmail}
            placeholder="you@yourcommunity.com"
            required
          />
          <span className="form-helper">We will send the reset link to the email address linked to your account.</span>
        </label>
      </div>
      <div className="form-actions">
        <SubmitButton />
      </div>
    </form>
  );
}
