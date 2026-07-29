"use client";

import Link from "next/link";
import Icon from "@/components/ui/icon/Icon";
import styles from "./NavItem.module.css";

export default function NavItem({ href, label, shortLabel, iconName = "", active = false, locked = false, onboardingKey = "" }) {
  return (
    <Link
      href={href}
      className={[styles.root, active ? styles.active : "", locked ? styles.locked : ""].filter(Boolean).join(" ")}
      aria-current={active ? "page" : undefined}
      aria-label={locked ? `${label} (locked)` : label}
      data-onboarding={onboardingKey || undefined}
    >
      <span className={styles.identity}>
        <span className={styles.badge} aria-hidden="true">
          {iconName ? <Icon name={iconName} size="sm" tone="accent" decorative /> : shortLabel}
        </span>
        <span className={styles.label}>{label}</span>
      </span>
      {locked ? (
        <span className={styles.lockIcon} aria-hidden="true">
          <Icon name="lock" size="sm" decorative />
        </span>
      ) : null}
    </Link>
  );
}
