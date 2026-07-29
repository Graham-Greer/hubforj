"use client";

import { useState, useTransition } from "react";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/button/Button";
import PackageUpgradeNotice from "@/components/patterns/package-upgrade-notice/PackageUpgradeNotice";
import FormMessage from "@/components/ui/form-message/FormMessage";
import Input from "@/components/ui/input/Input";
import { getFirebaseClientAuth } from "@/lib/firebase/client";
import styles from "./MemberJoinForm.module.css";

function mapJoinError(error, usedExistingAccount = false) {
  const code = String(error?.code || "");

  if (code === "auth/email-already-in-use") {
    return "This email already has an account. Enter the same password to join this community.";
  }

  if (usedExistingAccount && (code === "auth/invalid-credential" || code === "auth/wrong-password" || code === "auth/user-not-found")) {
    return "This email already has an account. Enter the correct password to join this community.";
  }

  if (code === "auth/weak-password") {
    return "Password must be stronger before the account can be created.";
  }

  return "Unable to create your account right now.";
}

export default function MemberJoinForm({ hubSlug, nextPath, routeMode = "path" }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [upgradeNotice, setUpgradeNotice] = useState(null);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setUpgradeNotice(null);

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");

    startTransition(async () => {
      let credential = null;
      let createdNewAccount = false;
      let usedExistingAccount = false;

      try {
        try {
          credential = await createUserWithEmailAndPassword(getFirebaseClientAuth(), email, password);
          createdNewAccount = true;
        } catch (authError) {
          if (String(authError?.code || "") !== "auth/email-already-in-use") {
            throw authError;
          }

          credential = await signInWithEmailAndPassword(getFirebaseClientAuth(), email, password);
          usedExistingAccount = true;
        }

        const idToken = await credential.user.getIdToken(true);
        const response = await fetch("/api/auth/member/join", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            hubSlug,
            idToken,
            name,
            nextPath,
            routeMode,
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

          setError(String(result?.error || "Unable to complete account setup."));
          setUpgradeNotice(result?.upgradeNotice || null);
          return;
        }

        router.replace(String(result.redirectTo || (routeMode === "host" ? "/" : `/${hubSlug}`)));
        router.refresh();
      } catch (joinError) {
        setError(mapJoinError(joinError, usedExistingAccount));
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
          hint="Use the name you would like shown on your account."
          required
        />
        <Input
          name="email"
          type="email"
          autoComplete="email"
          label="Email"
          placeholder="you@example.com"
          required
        />
        <Input
          name="password"
          type="password"
          autoComplete="new-password"
          label="Password"
          placeholder="Create a password"
          hint="Use at least 6 characters. If you already use this email in another community, enter the same password."
          required
        />
      </div>
      {error ? <FormMessage tone="danger">{error}</FormMessage> : null}
      {upgradeNotice ? (
        <PackageUpgradeNotice
          title={upgradeNotice.title}
          description={upgradeNotice.description}
          currentUsage={upgradeNotice.currentUsage}
          limit={upgradeNotice.limit}
          unlocks={upgradeNotice.unlocks}
        />
      ) : null}
      <div className={styles.actions}>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Joining..." : "Join community"}
        </Button>
      </div>
    </form>
  );
}
