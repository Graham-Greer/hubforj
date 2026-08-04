import { Suspense } from "react";
import Button from "@/components/ui/button/Button";
import { AdminWizardFormFallback } from "@/components/patterns/admin-route-fallbacks/AdminRouteFallbacks";
import PackageUpgradeNotice from "@/components/patterns/package-upgrade-notice/PackageUpgradeNotice";
import WorkflowGuidance from "@/components/patterns/workflow-guidance/WorkflowGuidance";
import WorkspaceSection from "@/components/patterns/workspace-section/WorkspaceSection";
import { countActiveUpcomingPublishedEventsByHub } from "@/lib/data/events";
import { requireHubBySlug, requireHubCoreBySlug } from "@/lib/data/hubs";
import { getHubPaymentConfigurationByHubId } from "@/lib/data/hub-payment-configurations";
import { listMediaFoldersByHubId } from "@/lib/data/media";
import { resolveHubPackageEntitlements } from "@/lib/domain/hub-package";
import { getHubPaymentSetupState } from "@/lib/domain/hub-payment-configuration";
import CreateEventForm from "./CreateEventForm";
import styles from "./page.module.css";

async function CreateEventWorkspace({ hubSlug }) {
  const hub = await requireHubBySlug(hubSlug);
  const entitlements = resolveHubPackageEntitlements(hub);
  const activeUpcomingEventsLimit = entitlements.limits?.activeUpcomingEvents;
  const activeUpcomingPublishedEventCount = await countActiveUpcomingPublishedEventsByHub(hub.id);
  const limitReached =
    Number.isFinite(activeUpcomingEventsLimit) && activeUpcomingPublishedEventCount >= activeUpcomingEventsLimit;

  if (limitReached) {
    return (
      <PackageUpgradeNotice
        title="Active event limit reached"
        description="This hub has filled its active upcoming event allowance. Upgrade to publish more events without waiting for existing ones to pass."
        currentUsage={activeUpcomingPublishedEventCount}
        limit={activeUpcomingEventsLimit}
        unlocks={[
          "Unlimited active upcoming events",
          "Paid event capability",
          "Access to broader monetisation features",
        ]}
      />
    );
  }

  const [mediaFolders, paymentConfiguration] = await Promise.all([
    listMediaFoldersByHubId(hub.id),
    getHubPaymentConfigurationByHubId(hub.id),
  ]);
  const paymentSetupState = getHubPaymentSetupState(hub, paymentConfiguration);

  return (
    <CreateEventForm hub={hub} mediaAssets={[]} mediaFolders={mediaFolders} paymentSetupState={paymentSetupState} />
  );
}

export default async function CreateEventPage({ params }) {
  const { hubSlug } = await params;
  const hub = await requireHubCoreBySlug(hubSlug);

  return (
    <div className={styles.layout}>
      <WorkspaceSection
        eyebrow="Events"
        title="Create event"
        description="Set the schedule, capacity, pricing, visibility, and registration rules before publishing."
        actions={
          <Button href={`/${hub.slug}/admin/events`} variant="secondary">
            Back to events
          </Button>
        }
      >
        <Suspense fallback={<AdminWizardFormFallback steps={4} fields={6} />}>
          <CreateEventWorkspace hubSlug={hubSlug} />
        </Suspense>
      </WorkspaceSection>
      <WorkflowGuidance
        eyebrow="Publishing guidance"
        title="What admins should decide before publishing"
        items={[
          {
            title: "Schedule first",
            body: "Start and end times define downstream operations: registrations, attendance, and member expectations all depend on them being right.",
            icon: "schedule",
          },
          {
            title: "Clarify pricing and eligibility",
            body: "Free vs paid and member-only vs public access are not cosmetic settings. They change the booking and payment path.",
            icon: "payments",
          },
          {
            title: "Publish intentionally",
            body: "Keep the event in draft until the title, timing, and participation rules are ready to publish.",
            icon: "publish",
          },
        ]}
      />
    </div>
  );
}
