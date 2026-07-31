import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import PageHeader from "@/components/patterns/page-header/PageHeader";
import Surface from "@/components/primitives/surface/Surface";
import WorkspaceSection from "@/components/patterns/workspace-section/WorkspaceSection";
import {
  formatPaymentAmount,
  getOperationalPaymentStatusLabel,
  getOperationalPaymentStatusTone,
} from "./hub-payments-helpers";
import { formatMembershipDate, getMembershipPaymentStatusLabel } from "@/lib/domain/memberships";
import {
  getFallbackRegionalMarket,
  resolveLaunchFormattingLocale,
} from "@/lib/domain/regional-markets";
import styles from "./PaymentDetailWorkspace.module.css";

const fallbackRegionalMarket = getFallbackRegionalMarket();

function formatDateTime(value, locale = fallbackRegionalMarket.defaultLocale) {
  const normalized = String(value || "").trim();
  const resolvedLocale = resolveLaunchFormattingLocale(locale);

  if (!normalized) {
    return "Not available";
  }

  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) {
    return normalized;
  }

  return new Intl.DateTimeFormat(resolvedLocale, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatSummaryValue(row, item, locale) {
  if (row.label === "Amount") {
    return formatPaymentAmount(item, locale);
  }

  if (row.label.toLowerCase().includes("date")) {
    return formatDateTime(row.value, locale);
  }

  if (row.label.toLowerCase().includes("state") || row.label.toLowerCase().includes("status")) {
    return getMembershipPaymentStatusLabel(row.value) !== "Unknown"
      ? getMembershipPaymentStatusLabel(row.value)
      : row.value.replace(/_/g, " ");
  }

  return row.value;
}

function normalizeToken(value) {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, "_");
}

function buildStatusBadges(item, detail) {
  const badges = [
    {
      tone: getOperationalPaymentStatusTone(item),
      label: getOperationalPaymentStatusLabel(item),
    },
    {
      tone: "neutral",
      label: item.kind === "membership" ? "Membership" : item.kind === "course" ? "Course" : "Event",
    },
  ];

  const primaryStatus = normalizeToken(getOperationalPaymentStatusLabel(item));
  const transactionStatus = normalizeToken(detail?.transactionStatusLabel);
  const refundStatus = normalizeToken(detail?.refundStatus);

  const isTransactionStatusRedundant =
    !transactionStatus ||
    transactionStatus === primaryStatus ||
    (transactionStatus === "payment_received" && primaryStatus === "paid") ||
    (transactionStatus === "payment_failed" && primaryStatus === "failed") ||
    ((refundStatus === "refunded" || refundStatus === "partially_refunded") && transactionStatus === "payment_received");

  if (!isTransactionStatusRedundant) {
    badges.push({
      tone: "neutral",
      label: detail.transactionStatusLabel,
    });
  }

  const isRefundStatusRedundant =
    !refundStatus ||
    refundStatus === primaryStatus;

  if (!isRefundStatusRedundant) {
    badges.push({
      tone: "neutral",
      label: detail.refundStatus.replace(/_/g, " "),
    });
  }

  return badges;
}

function DetailList({ rows, item, locale, valueFormatter = null, className = "" }) {
  return (
    <dl className={[styles.details, className].filter(Boolean).join(" ")}>
      {rows.map((row) => (
        <div key={row.label} className={styles.detailRow}>
          <dt className={styles.detailLabel}>{row.label}</dt>
          <dd className={styles.detailValue}>
            {valueFormatter ? valueFormatter(row, item, locale) : row.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function formatEventComparisonValue(row, _item, locale = fallbackRegionalMarket.defaultLocale) {
  if (row.label.toLowerCase().includes("start")) {
    return formatDateTime(row.value, locale);
  }

  return row.value;
}

export default function PaymentDetailWorkspace({ hub, item, detail, paymentsHref = "" }) {
  const linkedRecord = detail?.linkedRecord || null;
  const comparisonRows = linkedRecord?.comparisonRows || [];
  const hasSnapshotDrift = linkedRecord?.snapshotDrift === true;
  const lifecycleRows = (detail?.lifecycleRows || []).map((row) => ({
    ...row,
    value: formatDateTime(row.value, hub.locale),
  }));
  const amountText = formatPaymentAmount(item, hub.locale);
  const statusBadges = buildStatusBadges(item, detail);
  const shouldShowSummaryBody = item?.kind === "membership";

  return (
    <div className={styles.root}>
      <PageHeader
        eyebrow="Payments"
        title="Payment details"
        description="Check what happened with this payment, who it belongs to, and where to go next if you need to follow up."
        actions={
          <div className={styles.headerActions}>
            <Button href={paymentsHref || `/${hub.slug}/admin/payments?view=payments`} prefetch={false} variant="secondary">
              Back to payments
            </Button>
          </div>
        }
      />

      <Surface className={styles.summaryCard}>
        <div className={styles.summaryHero}>
          <div className={styles.summaryHeader}>
            <h2 className={styles.summaryTitle}>Payment summary</h2>
            {shouldShowSummaryBody ? (
              <p className={styles.summaryBody}>
                {item.detail || "This payment record shows the current outcome."}
              </p>
            ) : null}
            <p className={styles.ownerText}>
              For {detail.member?.name || "Former member"}
              {detail.member?.email ? ` · ${detail.member.email}` : ""}
            </p>
          </div>

          <div className={styles.heroMetric}>
            <p className={styles.heroLabel}>Amount</p>
            <p className={styles.heroValue}>{amountText}</p>
          </div>
        </div>

        <div className={styles.badgeRow}>
          {statusBadges.map((badge) => (
            <Badge key={`${badge.tone}:${badge.label}`} tone={badge.tone}>
              {badge.label}
            </Badge>
          ))}
        </div>

        <DetailList
          rows={detail.summaryRows || []}
          item={item}
          locale={hub.locale}
          valueFormatter={formatSummaryValue}
          className={styles.factGrid}
        />

        {detail.nextAction ? (
          <div className={styles.contextActions}>
            <Button href={detail.nextAction.href} prefetch={false}>{detail.nextAction.label}</Button>
          </div>
        ) : null}
      </Surface>

      <WorkspaceSection
        eyebrow="Context"
        title="Member and linked record"
        description="Review the member and the membership, event, or course linked to this payment."
      >
        <div className={styles.contextGrid}>
          <Surface as="article" padding="md" className={`${styles.contextCard} ${styles.memberCard}`}>
            <div className={styles.contextHeader}>
              <h3 className={styles.contextTitle}>Member</h3>
              <p className={styles.contextBody}>The member linked to this payment.</p>
            </div>
            <DetailList rows={detail.member?.rows || []} item={item} locale={hub.locale} className={styles.factGrid} />
            {detail.member?.href ? (
              <div className={styles.contextActions}>
                <Button href={detail.member.href} prefetch={false} variant="ghost">Open member record</Button>
              </div>
            ) : null}
          </Surface>

          <Surface as="article" padding="md" className={`${styles.contextCard} ${styles.linkedRecordCard}`}>
            <div className={styles.contextHeader}>
              <h3 className={styles.contextTitle}>{linkedRecord?.label || "Linked record"}</h3>
              <p className={styles.contextBody}>The membership, event, or course this payment is tied to.</p>
            </div>
            <DetailList
              rows={[
                { label: "Title", value: linkedRecord?.title || "Related record" },
                { label: "Status", value: linkedRecord?.stateLabel || "Not available" },
                { label: "Details", value: linkedRecord?.supportingText || "No extra details available." },
              ]}
              item={item}
              locale={hub.locale}
              className={styles.factGrid}
              valueFormatter={(row) =>
                row.label === "Status"
                  ? row.value.replace(/_/g, " ")
                  : row.value
              }
            />
            {comparisonRows.length && hasSnapshotDrift ? (
              <>
                <div className={styles.contextHeader}>
                  <h3 className={styles.contextTitle}>Booked snapshot and live event</h3>
                  <p className={styles.contextBody}>
                    This event has changed since the booking was placed.
                  </p>
                </div>
                <DetailList
                  rows={comparisonRows}
                  item={item}
                  locale={hub.locale}
                  className={styles.factGrid}
                  valueFormatter={formatEventComparisonValue}
                />
              </>
            ) : comparisonRows.length ? (
              <div className={styles.contextHeader}>
                <h3 className={styles.contextTitle}>Booked snapshot and live event</h3>
                <p className={styles.contextBody}>Event details still match the booked snapshot.</p>
              </div>
            ) : null}
          </Surface>
        </div>
      </WorkspaceSection>

      <WorkspaceSection
        eyebrow="Activity"
        title="Payment timeline"
        description="This shows the key payment updates we have recorded, including payment, cancellation, and refund updates where available."
      >
        <Surface className={styles.timelineCard}>
          <h2 className={styles.timelineTitle}>Timeline</h2>
          {lifecycleRows.length ? (
            <DetailList rows={lifecycleRows} item={item} locale={hub.locale} className={styles.auditGrid} />
          ) : (
            <p className={styles.timelineBody}>No further updates have been recorded for this payment yet.</p>
          )}
        </Surface>
      </WorkspaceSection>
    </div>
  );
}
