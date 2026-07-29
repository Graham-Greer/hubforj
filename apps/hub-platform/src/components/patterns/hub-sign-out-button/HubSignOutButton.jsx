"use client";

import { useState, useTransition } from "react";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/button/Button";
import FormMessage from "@/components/ui/form-message/FormMessage";
import { getFirebaseClientAuth } from "@/lib/firebase/client";
import styles from "./HubSignOutButton.module.css";

export default function HubSignOutButton({ hubSlug, redirectPath = `/${hubSlug}` }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSignOut() {
    setError("");

    startTransition(async () => {
      try {
        await signOut(getFirebaseClientAuth()).catch(() => {});

        const response = await fetch("/api/auth/member/session", {
          method: "DELETE",
        });

        if (!response.ok) {
          setError("Unable to sign out right now.");
          return;
        }

        router.replace(redirectPath);
        router.refresh();
      } catch {
        setError("Unable to sign out right now.");
      }
    });
  }

  return (
    <div className={styles.root}>
      <Button type="button" variant="secondary" disabled={isPending} onClick={handleSignOut}>
        {isPending ? "Signing out..." : "Sign out"}
      </Button>
      {error ? <FormMessage tone="danger" className={styles.message}>{error}</FormMessage> : null}
    </div>
  );
}
