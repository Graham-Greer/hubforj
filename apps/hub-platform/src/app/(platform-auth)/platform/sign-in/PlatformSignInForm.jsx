"use client";

import { useState, useTransition } from "react";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/button/Button";
import FormMessage from "@/components/ui/form-message/FormMessage";
import Input from "@/components/ui/input/Input";
import { getFirebaseClientAuth } from "@/lib/firebase/client";
import styles from "./PlatformSignInForm.module.css";

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

export default function PlatformSignInForm({ nextPath }) {
  const router = useRouter();
  const [error, setError] = useState("");
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
        const response = await fetch("/api/auth/platform/session", {
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
          setError(String(result?.error || "Unable to establish operator session."));
          return;
        }

        router.replace(String(result.redirectTo || "/platform"));
        router.refresh();
      } catch (authError) {
        setError(mapFirebaseAuthError(authError));
      }
    });
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.fields}>
        <Input
          name="email"
          type="email"
          autoComplete="email"
          label="Email"
          placeholder="operator@example.com"
          hint="Use the email attached to your superadmin account."
          required
        />
        <Input
          name="password"
          type="password"
          autoComplete="current-password"
          label="Password"
          placeholder="Enter your password"
          required
        />
      </div>
      {error ? <FormMessage tone="danger">{error}</FormMessage> : null}
      <div className={styles.actions}>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Signing in..." : "Sign in"}
        </Button>
      </div>
    </form>
  );
}
