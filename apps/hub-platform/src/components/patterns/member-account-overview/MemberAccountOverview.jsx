import Image from "next/image";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import EmptyState from "@/components/patterns/empty-state/EmptyState";
import StatCard from "@/components/ui/stat-card/StatCard";
import PageHeader from "@/components/patterns/page-header/PageHeader";
import Surface from "@/components/primitives/surface/Surface";
import { buildHubRuntimeHref } from "@/lib/domain/hub-runtime-paths";
import styles from "./MemberAccountOverview.module.css";

function BookingPreviewItem({ item }) {
  return (
    <div className={styles.previewItem}>
      <div className={styles.previewHeader}>
        <div className={styles.previewLead}>
          {item.imageUrl ? (
            <div className={styles.previewImageWrap}>
              <Image
                src={item.imageUrl}
                alt={item.imageAlt || item.title}
                fill
                sizes="76px"
                className={styles.previewImage}
              />
            </div>
          ) : null}

          <div className={styles.previewCopy}>
            <h3 className={styles.previewTitle}>{item.title}</h3>
            <p className={styles.previewMeta}>{item.dateLabel}</p>
            <p className={styles.previewMeta}>{item.locationLabel}</p>
          </div>
        </div>
        <div className={styles.badges}>
          <Badge tone="neutral">{item.typeLabel}</Badge>
          <Badge tone={item.statusTone}>{item.statusLabel}</Badge>
          {item.showPaymentBadge ? (
            <Badge tone={item.paymentStatusTone}>{item.paymentStatusLabel}</Badge>
          ) : null}
          {item.showAttendanceBadge ? (
            <Badge tone={item.attendanceStatusTone}>{item.attendanceStatusLabel}</Badge>
          ) : null}
          {item.waitlistStatusLabel ? <Badge tone={item.waitlistStatusTone}>{item.waitlistStatusLabel}</Badge> : null}
        </div>
      </div>
      {item.statusHelpText ? <p className={styles.previewSupport}>{item.statusHelpText}</p> : null}
      <div className={styles.previewActions}>
        <Button href={item.primaryAction.href} variant="ghost">{item.primaryAction.label}</Button>
      </div>
    </div>
  );
}

function BillingPreviewItem({ item }) {
  return (
    <div className={styles.previewItem}>
      <div className={styles.previewHeader}>
        <div className={styles.previewCopy}>
          <h3 className={styles.previewTitle}>{item.title}</h3>
          <p className={styles.previewMeta}>
            {item.dateLabelPrefix ? `${item.dateLabelPrefix}: ` : ""}
            {item.dateLabel}
          </p>
          <p className={styles.previewMeta}>{item.amountLabel}</p>
        </div>
        <Badge tone="neutral">{item.typeLabel}</Badge>
      </div>
      <div className={styles.badges}>
        <Badge tone={item.statusTone}>{item.statusLabel}</Badge>
      </div>
    </div>
  );
}

export default function MemberAccountOverview({ hub, overview }) {
  const membership = overview?.membership || null;
  const upcomingBookings = overview?.upcomingBookings || [];
  const recentBilling = overview?.recentBilling || [];
  const routeMode = hub?.routeMode || "path";

  return (
    <div className={styles.root}>
      <PageHeader
        eyebrow="Member account"
        title="Overview"
        description={`Manage your membership, bookings, billing, and account details for ${hub.name}.`}
      />

      <div className={styles.stats}>
        <StatCard label="Membership" value={overview?.summary?.membershipState || "None"} detail="Latest plan state." />
        <StatCard label="Upcoming bookings" value={String(overview?.summary?.upcomingBookingsCount || 0)} detail="Events and courses still ahead." />
        <StatCard label="Payment attention" value={String(overview?.summary?.paymentAttentionCount || 0)} detail="Items still unpaid or requiring follow-up." />
      </div>

      <Surface className={styles.membershipSurface}>
        {membership ? (
          <div className={styles.membershipSummary}>
            <div className={styles.membershipSummaryHeader}>
              <p className={styles.sectionEyebrow}>Membership</p>
              <div className={styles.badges}>
                <Badge tone={membership.statusTone}>{membership.statusLabel}</Badge>
                <Badge tone={membership.paymentStatusTone}>{membership.paymentStatusLabel}</Badge>
              </div>
            </div>
            <div className={styles.membershipCopyWrap}>
              <h2 className={styles.membershipTitle}>{membership.planTitle}</h2>
              <p className={styles.membershipCopy}>Renews {membership.renewalLabel}</p>
            </div>
            <div className={styles.sectionActions}>
              <Button href={membership.href} variant="secondary">View membership</Button>
            </div>
          </div>
        ) : (
          <div className={styles.membershipLayout}>
            <EmptyState
              eyebrow="No membership yet"
              title="Membership has not been set up"
              description="When a membership is added to your account, the latest plan and renewal details will appear here."
              primaryAction={{ href: buildHubRuntimeHref(hub.slug, "/account/membership", routeMode), label: "Open membership" }}
            />
          </div>
        )}
      </Surface>

      <div className={styles.previewGrid}>
        <Surface className={styles.summaryCard}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionCopy}>
              <p className={styles.sectionEyebrow}>Upcoming</p>
              <h2 className={styles.sectionTitle}>Bookings</h2>
              <p className={styles.sectionDescription}>See what you have coming up next.</p>
            </div>
            <div className={styles.sectionActions}>
              <Button href={buildHubRuntimeHref(hub.slug, "/account/bookings", routeMode)} variant="secondary">Open bookings</Button>
            </div>
          </div>
          {upcomingBookings.length ? (
            <div className={styles.previewList}>
              {upcomingBookings.map((item) => (
                <BookingPreviewItem key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <EmptyState
              eyebrow="No upcoming bookings"
              title="Nothing is scheduled right now"
              description="Event and course bookings will appear here as soon as you book them."
              primaryAction={{ href: buildHubRuntimeHref(hub.slug, "/events", routeMode), label: "Browse events" }}
            />
          )}
        </Surface>

        <Surface className={styles.summaryCard}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionCopy}>
              <p className={styles.sectionEyebrow}>Recent</p>
              <h2 className={styles.sectionTitle}>Billing</h2>
              <p className={styles.sectionDescription}>Review the latest payment activity on your account.</p>
            </div>
            <div className={styles.sectionActions}>
              <Button href={buildHubRuntimeHref(hub.slug, "/account/billing", routeMode)} variant="secondary">Open billing</Button>
            </div>
          </div>
          {recentBilling.length ? (
            <div className={styles.previewList}>
              {recentBilling.map((item) => (
                <BillingPreviewItem key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <EmptyState
              eyebrow="No billing activity"
              title="Payments will appear here"
              description="Membership, event, and course payment records will show up once they exist on your account."
              primaryAction={{ href: buildHubRuntimeHref(hub.slug, "/account/billing", routeMode), label: "Open billing" }}
            />
          )}
        </Surface>
      </div>
    </div>
  );
}
