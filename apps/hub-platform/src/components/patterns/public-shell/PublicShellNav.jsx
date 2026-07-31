"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./PublicShellNav.module.css";

function isActive(pathname, href) {
  if (pathname === href) {
    return true;
  }

  if (href.split("/").filter(Boolean).length === 1) {
    return false;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function PublicShellNav({ items, align = "start" }) {
  const pathname = usePathname();

  return (
    <nav
      className={[
        styles.root,
        align === "center" ? styles.alignCenter : styles.alignStart,
      ].filter(Boolean).join(" ")}
      aria-label="Public navigation"
    >
      {items.map((item) => (
        <Link
          key={`${item.label}-${item.href}`}
          href={item.href}
          prefetch={false}
          className={[styles.link, isActive(pathname, item.href) ? styles.active : ""].filter(Boolean).join(" ")}
          aria-current={isActive(pathname, item.href) ? "page" : undefined}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
