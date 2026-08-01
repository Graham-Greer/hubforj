"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { getFirebaseClientAuth } from "@/lib/firebase/client";

function mapFirebaseAuthError(error) {
  const code = String(error?.code || "");

  if (code === "auth/invalid-credential" || code === "auth/wrong-password" || code === "auth/user-not-found") {
    return "Email or password is incorrect.";
  }

  if (code === "auth/too-many-requests") {
    return "Too many sign-in attempts. Please wait and try again.";
  }

  return "Unable to sign in right now.";
}

export default function SignInForm({ nextPath = "/account" }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");

    startTransition(async () => {
      try {
        const credential = await signInWithEmailAndPassword(getFirebaseClientAuth(), email, password);
        const idToken = await credential.user.getIdToken(true);
        const response = await fetch("/api/auth/commercial/session", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            idToken,
            nextPath,
          }),
        });
        const result = await response.json();

        if (!response.ok) {
          await signOut(getFirebaseClientAuth()).catch(() => {});
          setError(String(result?.error || "Unable to open your account right now."));
          return;
        }

        router.replace(String(result.redirectTo || "/account"));
        router.refresh();
      } catch (authError) {
        setError(mapFirebaseAuthError(authError));
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="signup-form-shell">
      {error ? <div className="form-message" data-tone="danger">{error}</div> : null}
      <div className="signup-form-grid">
        <label className="form-field">
          <span className="form-label">Email</span>
          <input
            className="form-input"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@yourcommunity.com"
            required
          />
          <span className="form-helper">Use the email you used when you created your community.</span>
        </label>
        <label className="form-field">
          <span className="form-label">Password</span>
          <input className="form-input" name="password" type="password" autoComplete="current-password" placeholder="Enter your password" required />
          <span className="form-helper">Use the password you created when you set up your account.</span>
        </label>
      </div>
      <div className="form-actions">
        <button type="submit" className="button-link" data-variant="primary" disabled={isPending}>
          {isPending ? "Signing in..." : "Sign in"}
        </button>
        <Link
          href={`/forgot-password${email ? `?email=${encodeURIComponent(email)}` : ""}`}
          prefetch={false}
          className="button-link"
          data-variant="secondary"
        >
          Forgot password
        </Link>
      </div>
    </form>
  );
}
