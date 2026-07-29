import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import EmptyState from "@/components/patterns/empty-state/EmptyState";
import Surface from "@/components/primitives/surface/Surface";
import WorkspaceSection from "@/components/patterns/workspace-section/WorkspaceSection";
import {
  getAttendanceStatusLabel,
  getAttendanceStatusTone,
  getPaymentStatusLabel,
  getPaymentStatusTone,
  getRegistrationStatusLabel,
  getRegistrationStatusTone,
  splitRegistrationsByTimeline,
} from "@/lib/domain/registrations";
import { formatEventDateRange } from "@/lib/domain/events";
import styles from "./MemberRegistrationWorkspace.module.css";

function RegistrationGroup({ rows, emptyTitle, emptyDescription, locale }) {
  if (!rows.length) {
    return (
      <div className={styles.emptyBlock}>
        <h3 className={styles.emptyTitle}>{emptyTitle}</h3>
        <p className={styles.emptyDescription}>{emptyDescription}</p>
      </div>
    );
  }

  return (
    <div className={styles.list}>
      {rows.map((registration) => (
        <Surface key={registration.id} as="article" tone="muted" padding="none" className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.copy}>
              <h3 className={styles.eventTitle}>{registration.eventTitle || "Event"}</h3>
              <p className={styles.eventMeta}>
                {formatEventDateRange(
                  {
                    startDate: registration.eventStartDate,
                    endDate: registration.eventEndDate,
                    startTime: registration.eventStartTime,
                    endTime: registration.eventEndTime,
                    startAt: registration.eventStartAt,
                    endAt: registration.eventEndAt,
                  },
                  locale
                )}
              </p>
              {registration.eventLocation ? <p className={styles.eventMeta}>{registration.eventLocation}</p> : null}
            </div>
            {registration.eventSlug ? (
              <Button href={`/${registration.hubSlug}/events/${registration.eventSlug}`} variant="ghost">
                View event
              </Button>
            ) : null}
          </div>
          <div className={styles.badges}>
            <Badge tone={getRegistrationStatusTone(registration.status)}>
              {getRegistrationStatusLabel(registration.status)}
            </Badge>
            <Badge tone={getPaymentStatusTone(registration.paymentStatus)}>
              {getPaymentStatusLabel(registration.paymentStatus)}
            </Badge>
            <Badge tone={getAttendanceStatusTone(registration.attendanceStatus)}>
              {getAttendanceStatusLabel(registration.attendanceStatus)}
            </Badge>
          </div>
          {registration.notes ? <p className={styles.notes}>{registration.notes}</p> : null}
        </Surface>
      ))}
    </div>
  );
}

export default function MemberRegistrationWorkspace({ hub, registrations, memberName = "" }) {
  const { upcoming, history } = splitRegistrationsByTimeline(registrations);

  if (!registrations.length) {
    return (
      <EmptyState
        eyebrow="Registrations"
        title="No registrations yet"
        description="As soon as you book onto an event, it will appear here with booking, payment, and attendance status."
        primaryAction={{ href: `/${hub.slug}/events`, label: "Browse events" }}
        secondaryAction={{ href: `/${hub.slug}/account`, label: "Back to account" }}
      />
    );
  }

  return (
    <div className={styles.root}>
      <WorkspaceSection
        eyebrow="Registrations"
        title="Registrations"
        description="Members should be able to quickly understand what is coming up, what has happened already, and whether any payment or attendance follow-up is still needed."
        actions={<Button href={`/${hub.slug}/events`}>Browse events</Button>}
      >
        <RegistrationGroup
          rows={upcoming}
          emptyTitle="No upcoming bookings"
          emptyDescription="New event bookings will appear here first."
          locale={hub.locale}
        />
      </WorkspaceSection>

      <WorkspaceSection
        eyebrow="History"
        title="Past registrations"
        description="Historical bookings remain visible so members can confirm attendance outcomes and previous payment states without needing staff help."
      >
        <RegistrationGroup
          rows={history}
          emptyTitle="No booking history yet"
          emptyDescription="Once you attend or complete bookings, the history will remain available here."
          locale={hub.locale}
        />
      </WorkspaceSection>
    </div>
  );
}
