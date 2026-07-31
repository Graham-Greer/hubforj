"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { signOut } from "firebase/auth";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Button from "@/components/ui/button/Button";
import FormMessage from "@/components/ui/form-message/FormMessage";
import { buildHubAuthHref } from "@/lib/auth/hub-auth-redirects";
import { buildHubRuntimeHref } from "@/lib/domain/hub-runtime-paths";
import { getFirebaseClientAuth } from "@/lib/firebase/client";
import styles from "./PublicMobileNav.module.css";

function isActive(pathname, href) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function PublicMobileNav({
  id,
  hubSlug,
  routeMode = "path",
  navItems = [],
  utility,
  cta = null,
  drawerSurface = "integrated",
  open = false,
  onClose,
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const query = searchParams?.toString();
  const nextPath = query ? `${pathname}?${query}` : pathname;
  const redirectPath = nextPath || buildHubRuntimeHref(hubSlug, "/", routeMode);

  const utilityItems = [
    ...(utility?.menuItems || []),
    ...(utility?.viewerState === "anonymous"
      ? [
          ...(utility?.primaryAction?.href ? [{ key: "join", label: utility.primaryAction.label, href: buildHubAuthHref(hubSlug, "join", nextPath, routeMode) }] : []),
          ...(utility?.secondaryAction?.href ? [{ key: "signIn", label: utility.secondaryAction.label, href: buildHubAuthHref(hubSlug, "sign-in", nextPath, routeMode) }] : []),
        ]
      : []),
  ];
  const mobileCtaHref = cta?.kind === "auth"
    ? buildHubAuthHref(hubSlug, cta.route, nextPath, routeMode)
    : cta?.href || "";

  useEffect(() => {
    onClose?.();
  }, [onClose, pathname, query]);

  return (
    <>
      <div
        className={[styles.overlay, open ? styles.overlayOpen : ""].filter(Boolean).join(" ")}
        aria-hidden={!open}
        onClick={() => onClose?.()}
      />
      <div
        id={id}
        className={[
          styles.panel,
          drawerSurface === "panel" ? styles.surfacePanel : styles.surfaceIntegrated,
          open ? styles.panelOpen : "",
        ].filter(Boolean).join(" ")}
        aria-label="Mobile main navigation panel"
        aria-hidden={!open}
      >
        <div className={styles.panelInner}>
          <nav className={styles.nav} aria-label="Mobile main navigation">
            {navItems.map((item) => (
              <Link
                key={`${item.label}-${item.href}`}
                href={item.href}
                prefetch={false}
                className={[styles.link, isActive(pathname, item.href) ? styles.linkActive : ""].filter(Boolean).join(" ")}
                aria-current={isActive(pathname, item.href) ? "page" : undefined}
                onClick={() => onClose?.()}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {cta?.label && mobileCtaHref ? (
            <div className={styles.ctaSection}>
              <Button
                href={mobileCtaHref}
                prefetch={false}
                className={styles.ctaButton}
                onClick={() => onClose?.()}
              >
                {cta.label}
              </Button>
            </div>
          ) : null}

          {utilityItems.length > 0 || utility?.signOutEnabled ? (
            <div className={styles.utilitySection}>
              <p className={styles.utilityLabel}>Account</p>
              <div className={styles.utilityList}>
                {utilityItems.map((item) => (
                  <Link
                    key={item.key}
                    href={item.href}
                    prefetch={false}
                    className={styles.utilityLink}
                    onClick={() => onClose?.()}
                  >
                    {item.label}
                  </Link>
                ))}
                {utility?.signOutEnabled ? (
                  <button
                    type="button"
                    className={styles.utilityButton}
                    disabled={isPending}
                    onClick={() => {
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

                          onClose?.();
                          router.replace(redirectPath);
                          router.refresh();
                        } catch {
                          setError("Unable to sign out right now.");
                        }
                      });
                    }}
                  >
                    {isPending ? "Signing out..." : "Sign out"}
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}

          {error ? <FormMessage tone="danger" className={styles.message}>{error}</FormMessage> : null}
        </div>
      </div>
    </>
  );
}
