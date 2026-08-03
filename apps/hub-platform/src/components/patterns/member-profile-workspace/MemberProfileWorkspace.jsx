"use client";

import { useState } from "react";
import Avatar from "@/components/ui/avatar/Avatar";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import Icon from "@/components/ui/icon/Icon";
import PageHeader from "@/components/patterns/page-header/PageHeader";
import Surface from "@/components/primitives/surface/Surface";
import {
  getFallbackRegionalMarket,
  resolveLaunchFormattingLocale,
} from "@/lib/domain/regional-markets";
import {
  getUserRoleLabel,
  getUserRoleTone,
  getUserStatusLabel,
  getUserStatusTone,
} from "@/lib/domain/users";
import styles from "./MemberProfileWorkspace.module.css";

const fallbackRegionalMarket = getFallbackRegionalMarket();

function formatAccountCreated(value, locale = fallbackRegionalMarket.defaultLocale) {
  const date = new Date(String(value || ""));
  const resolvedLocale = resolveLaunchFormattingLocale(locale);

  if (Number.isNaN(date.getTime())) {
    return "Recently created";
  }

  return new Intl.DateTimeFormat(resolvedLocale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function createInitials(member) {
  const label = String(member?.name || member?.email || "User").trim();

  return label
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "U";
}

function DetailRow({ label, value }) {
  return (
    <div className={styles.detailRow}>
      <dt className={styles.detailLabel}>{label}</dt>
      <dd className={styles.detailValue}>{value}</dd>
    </div>
  );
}

export default function MemberProfileWorkspace({ hub, member, avatarEditor = null, form = null, showHeader = true }) {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className={styles.root}>
      {showHeader ? (
        <PageHeader
          eyebrow="Member account"
          title="Profile"
          description="Review your account details and update the basics we currently support."
        />
      ) : null}

      <div className={styles.mainGrid}>
        <Surface className={styles.identityCard}>
          <div className={styles.identityHeader}>
            <div className={styles.identityMain}>
              <Avatar
                initials={createInitials(member)}
                imageUrl={member.avatarAsset?.publicUrl || ""}
                alt={member.avatarAlt || member.name || member.email || "Member profile"}
                size="lg"
                tone="accent"
                className={styles.avatar}
              />

              <div className={styles.identityCopy}>
                <h2 className={styles.identityTitle}>{member.name || `${hub.name} profile`}</h2>
              </div>
            </div>

            <Button type="button" variant="secondary" onClick={() => setIsEditing((current) => !current)}>
              <Icon name="edit" size="sm" decorative />
              {isEditing ? "Close editing" : "Edit profile"}
            </Button>
          </div>

          <div className={styles.metaRow}>
            <Badge tone={getUserRoleTone(member.role)}>{getUserRoleLabel(member.role)}</Badge>
            <Badge tone={getUserStatusTone(member.status)}>{getUserStatusLabel(member.status)}</Badge>
            <p className={styles.accountCreated}>Joined {formatAccountCreated(member.createdAt, resolveLaunchFormattingLocale(hub.locale, hub.country))}</p>
          </div>

          <dl className={styles.details}>
            <DetailRow label="Full name" value={member.name || "Name not provided"} />
            <DetailRow label="Email" value={member.email || "Email not provided"} />
          </dl>
        </Surface>

        {isEditing ? (
          <Surface className={styles.editCard}>
            <div className={styles.sectionCopy}>
              <h2 className={styles.sectionTitle}>Edit profile</h2>
              <p className={styles.sectionDescription}>
                Keep your profile name current so it appears correctly across bookings and your account.
              </p>
            </div>
            {avatarEditor}
            {form}
          </Surface>
        ) : null}
      </div>
    </div>
  );
}
