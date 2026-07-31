"use client";

import { useState, useTransition } from "react";
import { signOut } from "firebase/auth";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Avatar from "@/components/ui/avatar/Avatar";
import CompactMenu from "@/components/ui/compact-menu/CompactMenu";
import FormMessage from "@/components/ui/form-message/FormMessage";
import { buildHubRuntimeHref } from "@/lib/domain/hub-runtime-paths";
import { getFirebaseClientAuth } from "@/lib/firebase/client";
import styles from "./PublicUtilityMenu.module.css";

export default function PublicUtilityMenu({ hubSlug, routeMode = "path", utility }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const avatar = utility?.avatar || null;
  const query = searchParams?.toString();
  const redirectPath = query ? `${pathname}?${query}` : pathname;

  if (!avatar) {
    return null;
  }

  const items = [
    ...(utility?.menuItems || []).map((item) => ({
      value: item.key,
      label: item.label,
      onSelect: () => {
        router.push(item.href);
      },
    })),
    ...(utility?.signOutEnabled
      ? [
          {
            value: "signOut",
            label: isPending ? "Signing out..." : "Sign out",
            disabled: isPending,
            onSelect: () => {
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

                  router.replace(redirectPath || buildHubRuntimeHref(hubSlug, "/", routeMode));
                  router.refresh();
                } catch {
                  setError("Unable to sign out right now.");
                }
              });
            },
          },
        ]
      : []),
  ];

  return (
    <div className={styles.root}>
      <CompactMenu
        items={items}
        align="end"
        triggerAriaLabel={`${avatar.fallbackLabel} menu`}
        triggerClassName={styles.trigger}
      >
        <Avatar
          initials={avatar.initials}
          imageUrl={avatar.imageUrl}
          alt={avatar.fallbackLabel}
          size="md"
          tone="accent"
        />
      </CompactMenu>
      {error ? <FormMessage tone="danger" className={styles.message}>{error}</FormMessage> : null}
    </div>
  );
}
