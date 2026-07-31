"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Button from "@/components/ui/button/Button";
import NavGroup from "@/components/ui/nav-group/NavGroup";
import NavItem from "@/components/ui/nav-item/NavItem";
import OperatorSignOutButton from "@/components/patterns/operator-sign-out-button/OperatorSignOutButton";
import HubSignOutButton from "@/components/patterns/hub-sign-out-button/HubSignOutButton";
import WorkspaceThemeToggle from "@/components/patterns/workspace-theme-toggle/WorkspaceThemeToggle";
import styles from "./AdminMobileNav.module.css";

function isActive(pathname, searchParams, item) {
  const baseHref = item.href.split("?")[0];
  const matchesActivePrefix = (item.activeMatchPrefixes || []).some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
  const pathMatches = item.exactMatch
    ? pathname === baseHref || matchesActivePrefix
    : pathname === item.href || pathname.startsWith(`${baseHref}/`) || pathname === baseHref || matchesActivePrefix;

  if (!pathMatches) {
    return false;
  }

  if (!item.queryKey) {
    return true;
  }

  const currentValue = searchParams.get(item.queryKey);
  return currentValue === item.queryValue;
}

function getActiveHref(pathname, searchParams, groups) {
  const matches = groups
    .flatMap((group) => group.items)
    .filter((item) => isActive(pathname, searchParams, item))
    .map((item) => item.href)
    .sort((left, right) => right.length - left.length);

  return matches[0] || "";
}

export default function AdminMobileNav({
  id,
  hubSlug,
  publicSiteHref = "/",
  title,
  groups,
  open = false,
  onClose,
  topOffset = 0,
  operatorTheme,
  operatorSession = null,
  adminSession = null,
  supportMode = null,
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeHref = getActiveHref(pathname, searchParams, groups);
  const query = searchParams?.toString() || "";
  const previousLocationRef = useRef({ pathname, query });
  const panelInnerRef = useRef(null);

  useEffect(() => {
    const previousLocation = previousLocationRef.current;

    if (previousLocation.pathname !== pathname || previousLocation.query !== query) {
      onClose?.();
    }

    previousLocationRef.current = { pathname, query };
  }, [onClose, pathname, query]);

  useEffect(() => {
    if (!open) {
      document.body.style.removeProperty("overflow");
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    panelInnerRef.current?.scrollTo?.({
      top: 0,
      behavior: "auto",
    });
  }, [open]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onClose?.();
      }
    }

    const desktopMediaQuery = window.matchMedia("(min-width: 64.001rem)");

    function handleDesktopChange(event) {
      if (event.matches) {
        onClose?.();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    desktopMediaQuery.addEventListener("change", handleDesktopChange);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      desktopMediaQuery.removeEventListener("change", handleDesktopChange);
    };
  }, [onClose, open]);

  return (
    <>
      <div
        className={[styles.overlay, open ? styles.overlayOpen : ""].filter(Boolean).join(" ")}
        aria-hidden={!open}
        style={{ top: `${topOffset}px` }}
        onClick={() => onClose?.()}
      />
      <aside
        id={id}
        className={[styles.panel, open ? styles.panelOpen : ""].filter(Boolean).join(" ")}
        aria-label={`${title} mobile navigation`}
        aria-hidden={!open}
        style={{ top: `${topOffset}px` }}
      >
        <div ref={panelInnerRef} className={styles.panelInner}>
          <nav className={styles.nav} aria-label={`${title} navigation`}>
            {groups.map((group) => (
              <NavGroup key={group.title} title={group.title}>
                {group.items.map((item) => (
                  <NavItem
                    key={item.href}
                    href={item.href}
                    label={item.label}
                    shortLabel={item.shortLabel}
                    iconName={item.iconName}
                    active={activeHref === item.href}
                    locked={item.locked}
                    onboardingKey={item.onboardingKey}
                    prefetch={item.prefetch}
                  />
                ))}
              </NavGroup>
            ))}
          </nav>
          <div className={styles.utilitySection}>
            <p className={styles.utilityLabel}>Workspace</p>
            <div className={styles.utilityList}>
              <Button
                href={publicSiteHref}
                prefetch={false}
                variant="secondary"
                target="_blank"
                rel="noreferrer"
                onClick={() => onClose?.()}
              >
                View public site
              </Button>
              <WorkspaceThemeToggle currentTheme={operatorTheme} />
              {operatorSession && !supportMode ? (
                <Button href="/platform/hubs" variant="secondary" onClick={() => onClose?.()}>
                  Back to platform
                </Button>
              ) : null}
              {operatorSession ? <OperatorSignOutButton /> : null}
              {!operatorSession && adminSession ? (
                <HubSignOutButton hubSlug={hubSlug} redirectPath={`/${hubSlug}/sign-in`} />
              ) : null}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
