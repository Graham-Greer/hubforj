"use client";

import { useMemo, useState } from "react";
import Badge from "@/components/ui/badge/Badge";
import EmptyState from "@/components/patterns/empty-state/EmptyState";
import PaginationControls from "@/components/patterns/pagination-controls/PaginationControls";
import Surface from "@/components/primitives/surface/Surface";
import WorkspaceSection from "@/components/patterns/workspace-section/WorkspaceSection";
import {
  getCoursePaymentStatusLabel,
  getCoursePaymentStatusTone,
  getCourseRegistrationStatusLabel,
  getCourseRegistrationStatusTone,
} from "@/lib/domain/course-registrations";
import {
  getEventBookingPaymentStatusLabel,
  getEventBookingPaymentStatusTone,
  getEventBookingStatusLabel,
  getEventBookingStatusTone,
} from "@/lib/domain/event-bookings";
import styles from "./AdminMemberDetailWorkspace.module.css";

export default function MemberRegistrationsSection({
  eyebrow,
  title,
  description,
  emptyEyebrow,
  emptyTitle,
  emptyDescription,
  items = [],
}) {
  const [pageSize, setPageSize] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);

  function getTypeLabel(kind) {
    return kind === "course" ? "Course" : "Event";
  }

  function getStatusMeta(item) {
    if (item.kind === "course") {
      return {
        label: getCourseRegistrationStatusLabel(item.status),
        tone: getCourseRegistrationStatusTone(item.status),
      };
    }

    return {
      label: getEventBookingStatusLabel(item.status),
      tone: getEventBookingStatusTone(item.status),
    };
  }

  function getPaymentMeta(item) {
    if (item.paymentStatus === "not_required") {
      return null;
    }

    if (item.kind === "course") {
      return {
        label: getCoursePaymentStatusLabel(item.paymentStatus),
        tone: getCoursePaymentStatusTone(item.paymentStatus),
      };
    }

    return {
      label: getEventBookingPaymentStatusLabel(item.paymentStatus),
      tone: getEventBookingPaymentStatusTone(item.paymentStatus),
    };
  }

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const paginatedItems = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * pageSize;
    return items.slice(startIndex, startIndex + pageSize);
  }, [items, pageSize, safeCurrentPage]);

  return (
    <WorkspaceSection eyebrow={eyebrow} title={title} description={description}>
      {items.length ? (
        <div className={styles.sectionBody}>
          <PaginationControls
            totalCount={items.length}
            currentPage={safeCurrentPage}
            pageSize={pageSize}
            pageSizeOptions={[5, 10]}
            itemLabel="records"
            onPageChange={setCurrentPage}
            onPageSizeChange={(value) => {
              setPageSize(value);
              setCurrentPage(1);
            }}
          />

          <div className={styles.registrationList}>
            {paginatedItems.map((item) => {
              const status = getStatusMeta(item);
              const payment = getPaymentMeta(item);

              return (
                <Surface key={item.id} as="article" tone="muted" padding="md" className={styles.registrationCard}>
                  <div className={styles.registrationHeader}>
                    <div>
                      <h3 className={styles.cardTitle}>{item.title}</h3>
                      <p className={styles.cardBody}>
                        {item.date ? item.date.slice(0, 10) : "Date pending"}
                      </p>
                    </div>
                    <div className={styles.badges}>
                      <Badge tone="neutral">{getTypeLabel(item.kind)}</Badge>
                      <Badge tone={status.tone}>{status.label}</Badge>
                      {payment ? <Badge tone={payment.tone}>{payment.label}</Badge> : null}
                    </div>
                  </div>
                </Surface>
              );
            })}
          </div>
        </div>
      ) : (
        <EmptyState eyebrow={emptyEyebrow} title={emptyTitle} description={emptyDescription} />
      )}
    </WorkspaceSection>
  );
}
