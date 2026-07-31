"use client";

import { usePathname, useSearchParams } from "next/navigation";
import NavGroup from "@/components/ui/nav-group/NavGroup";
import NavItem from "@/components/ui/nav-item/NavItem";
import styles from "./PlatformSidebar.module.css";

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

export default function PlatformSidebar({ title, groups }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeHref = getActiveHref(pathname, searchParams, groups);

  return (
    <aside className={styles.root}>
      <div className={styles.brand}>
        <span className={styles.brandMark}>HP</span>
        <div className={styles.brandCopy}>
          <strong>{title}</strong>
          <span>Operations platform</span>
        </div>
      </div>
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
    </aside>
  );
}
