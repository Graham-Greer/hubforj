"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import HorizontalScrollRail from "@/components/ui/horizontal-scroll-rail/HorizontalScrollRail";
import styles from "./MemberAccountShell.module.css";

function matchesPath(pathname, href) {
  if (!pathname || !href) {
    return false;
  }

  if (pathname === href) {
    return true;
  }

  return href !== "" && href !== "/" && pathname.startsWith(`${href}/`);
}

function getActiveHref(pathname, items) {
  if (!pathname) {
    return "";
  }

  const matches = items
    .map((item) => item.href)
    .filter((href) => matchesPath(pathname, href))
    .sort((left, right) => right.length - left.length);

  return matches[0] || "";
}

export default function MemberAccountNav({ items = [] }) {
  const pathname = usePathname();
  const activeHref = getActiveHref(pathname, items);

  return (
    <nav className={styles.nav} aria-label="Member account">
      <HorizontalScrollRail className={styles.navViewport} activeItemKey={activeHref}>
        <div className={styles.navList}>
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={[styles.navLink, activeHref === item.href ? styles.navLinkActive : ""].filter(Boolean).join(" ")}
              aria-current={activeHref === item.href ? "page" : undefined}
              data-active={activeHref === item.href ? "true" : undefined}
            >
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </HorizontalScrollRail>
    </nav>
  );
}
