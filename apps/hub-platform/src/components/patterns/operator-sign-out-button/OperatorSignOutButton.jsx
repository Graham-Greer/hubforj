"use client";

import { useState, useTransition } from "react";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/button/Button";
import FormMessage from "@/components/ui/form-message/FormMessage";
import { getFirebaseClientAuth } from "@/lib/firebase/client";
import styles from "./OperatorSignOutButton.module.css";

export default function OperatorSignOutButton() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  async function handleSignOut() {
    setError("");

    startTransition(async () => {
      try {
        await fetch("/api/auth/platform/session", {
          method: "DELETE",
        });
        await signOut(getFirebaseClientAuth()).catch(() => {});
        router.replace("/platform/sign-in");
        router.refresh();
      } catch {
        setError("Unable to sign out right now.");
      }
    });
  }

  return (
    <div className={styles.root}>
      <Button type="button" variant="secondary" onClick={handleSignOut} disabled={isPending}>
        {isPending ? "Signing out..." : "Sign out"}
      </Button>
      {error ? <FormMessage tone="danger">{error}</FormMessage> : null}
    </div>
  );
}
