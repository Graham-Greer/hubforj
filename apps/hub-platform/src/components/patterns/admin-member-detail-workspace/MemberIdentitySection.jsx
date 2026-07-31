import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import PageHeader from "@/components/patterns/page-header/PageHeader";
import Surface from "@/components/primitives/surface/Surface";
import { getUserRoleLabel, getUserRoleTone, getUserStatusLabel, getUserStatusTone } from "@/lib/domain/users";
import { buildHubRuntimeHref } from "@/lib/domain/hub-runtime-paths";
import {
  getFallbackRegionalMarket,
  resolveLaunchFormattingLocale,
} from "@/lib/domain/regional-markets";
import { getMemberStatusAction } from "./admin-member-detail-helpers";
import DetailRow from "./DetailRow";
import MemberStatusActionButton from "./MemberStatusActionButton";
import styles from "./AdminMemberDetailWorkspace.module.css";

const fallbackRegionalMarket = getFallbackRegionalMarket();

function formatAdminDate(value, locale = fallbackRegionalMarket.defaultLocale, fallback = "Not available") {
  const normalizedValue = String(value || "").trim();
  const resolvedLocale = resolveLaunchFormattingLocale(locale);

  if (!normalizedValue) {
    return fallback;
  }

  const date = new Date(normalizedValue);

  if (Number.isNaN(date.getTime())) {
    return normalizedValue;
  }

  return new Intl.DateTimeFormat(resolvedLocale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export default function MemberIdentitySection({ hub, user, statusAction = null, membersQuery = "" }) {
  const locale = resolveLaunchFormattingLocale(hub.locale, hub.country);
  const statusMeta = getMemberStatusAction(user.status);
  const backHref = buildHubRuntimeHref(hub.slug, `/admin/members${membersQuery ? `?${membersQuery}` : ""}`, hub.routeMode);
  const actions = (
    <div className={styles.headerActions}>
      <Button href={backHref} prefetch={false}>Back to members</Button>
      {statusAction ? (
        <MemberStatusActionButton
          hubSlug={hub.slug}
          memberId={user.id}
          nextStatus={statusMeta.nextStatus}
          actionLabel={statusMeta.actionLabel}
          statusAction={statusAction}
          membersQuery={membersQuery}
          className={styles.headerActionForm}
        />
      ) : null}
    </div>
  );

  return (
    <div className={styles.identitySection}>
      <PageHeader
        eyebrow="Members"
        title={user.name || user.email || user.id}
        description="Review identity, membership, bookings, and payment context in one place."
        actions={actions}
      />
      <Surface
        as="section"
        tone="muted"
        padding="md"
        className={styles.summaryCard}
        data-onboarding="member-detail-summary"
      >
        <div className={styles.badges}>
          <Badge tone={getUserRoleTone(user.role)}>{getUserRoleLabel(user.role)}</Badge>
          <Badge tone={getUserStatusTone(user.status)}>{getUserStatusLabel(user.status)}</Badge>
        </div>
        <dl className={styles.detailList}>
          <DetailRow label="Email" value={user.email || "Email not available"} />
          <DetailRow label="Created" value={formatAdminDate(user.createdAt, locale, "Recently created")} />
          <DetailRow label="Last seen" value={formatAdminDate(user.lastSignedInAt, locale)} />
        </dl>
      </Surface>
    </div>
  );
}
