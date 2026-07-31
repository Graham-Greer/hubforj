"use client";

import { useState, useTransition } from "react";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/button/Button";
import FormMessage from "@/components/ui/form-message/FormMessage";
import Input from "@/components/ui/input/Input";
import { buildHubRuntimeHref } from "@/lib/domain/hub-runtime-paths";
import { getFirebaseClientAuth } from "@/lib/firebase/client";
import styles from "./MemberJoinForm.module.css";

function mapAdminInviteError(error) {
  const code = String(error?.code || "");

  if (code === "auth/email-already-in-use") {
    return "This invited email already has an account. Enter the same password to continue with admin setup.";
  }

  if (code === "auth/invalid-credential" || code === "auth/wrong-password" || code === "auth/user-not-found") {
    return "This invited email already has an account. Enter the correct password to continue with admin setup.";
  }

  if (code === "auth/weak-password") {
    return "Password must be stronger before the admin account can be created.";
  }

  return "Unable to complete admin onboarding right now.";
}

export default function AdminInviteAcceptanceForm({ hubSlug, routeMode = "path", inviteToken, invitedEmail }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");

    startTransition(async () => {
      let credential = null;
      let createdNewAccount = false;

      try {
        try {
          credential = await createUserWithEmailAndPassword(getFirebaseClientAuth(), email, password);
          createdNewAccount = true;
        } catch (authError) {
          if (String(authError?.code || "") !== "auth/email-already-in-use") {
            throw authError;
          }

          credential = await signInWithEmailAndPassword(getFirebaseClientAuth(), email, password);
        }

        const idToken = await credential.user.getIdToken(true);
        const response = await fetch("/api/auth/admin-invite/accept", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            hubSlug,
            inviteToken,
            name,
            idToken,
          }),
        });

        const result = await response.json();
        if (!response.ok) {
          if (createdNewAccount) {
            try {
              await credential.user.delete();
            } catch {
              await signOut(getFirebaseClientAuth()).catch(() => {});
            }
          } else {
            await signOut(getFirebaseClientAuth()).catch(() => {});
          }

          setError(String(result?.error || "Unable to complete admin onboarding."));
          return;
        }

        router.replace(String(result.redirectTo || buildHubRuntimeHref(hubSlug, "/admin", routeMode)));
        router.refresh();
      } catch (acceptError) {
        setError(mapAdminInviteError(acceptError));
      }
    });
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.fields}>
        <Input
          name="name"
          autoComplete="name"
          label="Full name"
          placeholder="Alex Morgan"
          hint="This is how your admin account will appear inside the operational workspace."
          required
        />
        <Input
          name="email"
          type="email"
          autoComplete="email"
          label="Invited email"
          defaultValue={invitedEmail}
          hint="Admin onboarding is locked to the email that was invited."
          readOnly
          required
        />
        <Input
          name="password"
          type="password"
          autoComplete="new-password"
          label="Password"
          placeholder="Create a password"
          hint="Use at least 6 characters. If this email already has an account elsewhere, enter the same password."
          required
        />
      </div>
      {error ? <FormMessage tone="danger">{error}</FormMessage> : null}
      <div className={styles.actions}>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Completing admin setup..." : "Complete admin setup"}
        </Button>
      </div>
    </form>
  );
}
