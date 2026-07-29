import Badge from "@/components/ui/badge/Badge";
import EmptyState from "@/components/patterns/empty-state/EmptyState";
import Surface from "@/components/primitives/surface/Surface";
import WorkspaceSection from "@/components/patterns/workspace-section/WorkspaceSection";
import {
  formatMembershipDate,
  formatMoney,
  getMembershipPaymentStatusLabel,
  getMembershipPaymentStatusTone,
} from "@/lib/domain/memberships";
import styles from "./AdminMemberDetailWorkspace.module.css";

function formatPaymentDate(value, locale) {
  return formatMembershipDate(value, locale);
}

function formatHistoryDetail(item, locale) {
  if (item.detailEndValue) {
    return `${formatPaymentDate(item.detailValue, locale)} - ${formatPaymentDate(item.detailEndValue, locale)}`;
  }

  return formatPaymentDate(item.detailValue, locale);
}

function renderAmountLabel(item, locale) {
  if (item.amountLabel) {
    return item.amountLabel;
  }

  if (
    item.pricingMode === "free" ||
    item.paymentStatus === "not_required" ||
    item.status === "not_required" ||
    String(item.amount || "") === "0" ||
    Number(item.amountMinor) === 0
  ) {
    return "Free";
  }

  if (item.amount) {
    return formatMoney(item.amount, item.currency, locale);
  }

  return "Amount to be confirmed";
}

export default function MemberPaymentHistorySection({
  hub,
  paymentItems = [],
  membershipPaymentHistory = [],
}) {
  const hasAnyHistory = paymentItems.length || membershipPaymentHistory.length;

  return (
    <WorkspaceSection
      eyebrow="Payments"
      title="Payment history"
      description="Review membership, event, and course payments alongside previous membership assignments and cycles."
    >
      {hasAnyHistory ? (
        <div className={styles.paymentList}>
          {paymentItems.map((item) => (
            <Surface key={item.id} as="article" tone="muted" padding="md" className={styles.paymentCard}>
              <div className={styles.paymentHeader}>
                <h3 className={styles.cardTitle}>{item.title}</h3>
                <div className={styles.badges}>
                  <Badge tone="neutral">{item.typeLabel || "Payment"}</Badge>
                  <Badge tone={getMembershipPaymentStatusTone(item.status)}>
                    {getMembershipPaymentStatusLabel(item.status)}
                  </Badge>
                </div>
              </div>
              <dl className={styles.paymentMeta}>
                <div className={styles.paymentMetaRow}>
                  <dt className={styles.paymentMetaLabel}>Payment amount</dt>
                  <dd className={styles.paymentMetaValue}>{renderAmountLabel(item, hub.locale)}</dd>
                </div>
                <div className={styles.paymentMetaRow}>
                  <dt className={styles.paymentMetaLabel}>{item.dateLabelPrefix || "Recorded date"}</dt>
                  <dd className={styles.paymentMetaValue}>{item.dateLabel || "To be confirmed"}</dd>
                </div>
                {item.detail ? (
                  <div className={styles.paymentMetaRow}>
                    <dt className={styles.paymentMetaLabel}>Details</dt>
                    <dd className={styles.paymentMetaValue}>{item.detail}</dd>
                  </div>
                ) : null}
              </dl>
            </Surface>
          ))}

          {membershipPaymentHistory.map((item) => (
            <Surface key={item.id} as="article" tone="muted" padding="md" className={styles.paymentCard}>
              <div className={styles.paymentHeader}>
                <h3 className={styles.cardTitle}>{item.title}</h3>
                <div className={styles.badges}>
                  {item.historyLabel ? <Badge tone={item.historyTone}>{item.historyLabel}</Badge> : null}
                  <Badge tone={getMembershipPaymentStatusTone(item.paymentStatus)}>
                    {getMembershipPaymentStatusLabel(item.paymentStatus)}
                  </Badge>
                </div>
              </div>
              <dl className={styles.paymentMeta}>
                <div className={styles.paymentMetaRow}>
                  <dt className={styles.paymentMetaLabel}>Payment amount</dt>
                  <dd className={styles.paymentMetaValue}>{renderAmountLabel(item, hub.locale)}</dd>
                </div>
                <div className={styles.paymentMetaRow}>
                  <dt className={styles.paymentMetaLabel}>{item.detailLabel || "Membership duration"}</dt>
                  <dd className={styles.paymentMetaValue}>{formatHistoryDetail(item, hub.locale)}</dd>
                </div>
              </dl>
            </Surface>
          ))}
        </div>
      ) : (
        <EmptyState
          eyebrow="No payment history"
          title="No payment records yet"
          description="Membership, event, and course payments will appear here once this member has recorded billing activity."
        />
      )}
    </WorkspaceSection>
  );
}
