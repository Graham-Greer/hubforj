"use client";

import Link from "next/link";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import Icon from "@/components/ui/icon/Icon";
import Surface from "@/components/primitives/surface/Surface";
import {
  formatPaymentAmount,
  getOperationalPaymentStatusLabel,
  getOperationalPaymentStatusTone,
  getItemLabel,
} from "./hub-payments-helpers";
import { formatMembershipDate } from "@/lib/domain/memberships";
import styles from "./HubPaymentsWorkspace.module.css";

export default function PaymentItemsTable({ hub, items = [] }) {
  return (
    <div className={styles.tableWrap}>
      <div className={styles.tableHeader} role="row">
        <span>Member</span>
        <span>Plan / title</span>
        <span>Amount</span>
        <span>Type</span>
        <span>Status</span>
        <span>Paid date</span>
        <span className={styles.tableActionHeader}>View</span>
      </div>
      <div className={styles.tableBody}>
        {items.map((item) => {
          const memberName = item.userName || item.userEmail || "Former member";
          const hasMemberRecord = item.memberRecordAvailable !== false;

          return (
            <Surface key={item.id} as="div" tone="default" padding="md" className={styles.tableRow} role="row">
              <div className={styles.memberCell}>
                {item.userId && hasMemberRecord ? (
                  <Link href={`/${hub.slug}/admin/members/${item.userId}`} className={styles.memberLink}>
                    {memberName}
                  </Link>
                ) : (
                  <p className={styles.primaryValue}>{memberName}</p>
                )}
              </div>
              <div>
                <p className={styles.primaryValue}>{getItemLabel(item)}</p>
                {item.operationalLabel ? (
                  <div className={styles.badges}>
                    <Badge tone="neutral" size="sm">
                      {item.operationalLabel}
                    </Badge>
                  </div>
                ) : null}
              </div>
              <p className={styles.primaryValue}>{formatPaymentAmount(item, hub.locale)}</p>
              <p className={styles.primaryValue}>
                {item.kind === "membership" ? "Membership" : item.kind === "course" ? "Course" : "Event"}
              </p>
              <div>
                <div className={styles.badges}>
                  <Badge tone={getOperationalPaymentStatusTone(item)} size="sm">
                    {getOperationalPaymentStatusLabel(item)}
                  </Badge>
                </div>
              </div>
              <p className={styles.primaryValue}>{formatMembershipDate(item.lifecycleDate || item.dueDate, hub.locale)}</p>
              <div className={styles.viewCell}>
                {item.detailHref ? (
                  <Button href={item.detailHref} variant="ghost" iconOnly aria-label="View payment record">
                    <Icon name="open_in_new" size="sm" decorative />
                  </Button>
                ) : null}
              </div>
            </Surface>
          );
        })}
      </div>
    </div>
  );
}
