import { Suspense } from "react";
import { headers } from "next/headers";
import Button from "@/components/ui/button/Button";
import { AdminWizardFormFallback } from "@/components/patterns/admin-route-fallbacks/AdminRouteFallbacks";
import WorkflowGuidance from "@/components/patterns/workflow-guidance/WorkflowGuidance";
import WorkspaceSection from "@/components/patterns/workspace-section/WorkspaceSection";
import { requireHubBySlug, requireHubCoreBySlug } from "@/lib/data/hubs";
import { getHubPaymentConfigurationByHubId } from "@/lib/data/hub-payment-configurations";
import { listMediaFoldersByHubId } from "@/lib/data/media";
import { getHubPaymentSetupState } from "@/lib/domain/hub-payment-configuration";
import { getRequestHostFromHeaders, resolveHubRuntimeRouteMode } from "@/lib/domain/hub-hosts";
import { buildHubRuntimeHref } from "@/lib/domain/hub-runtime-paths";
import CreateCourseForm from "./CreateCourseForm";
import styles from "./page.module.css";

async function CreateCourseWorkspace({ hubSlug }) {
  const hub = await requireHubBySlug(hubSlug);
  const [mediaFolders, paymentConfiguration] = await Promise.all([
    listMediaFoldersByHubId(hub.id),
    getHubPaymentConfigurationByHubId(hub.id),
  ]);
  const paymentSetupState = getHubPaymentSetupState(hub, paymentConfiguration);

  return (
    <CreateCourseForm hub={hub} mediaAssets={[]} mediaFolders={mediaFolders} paymentSetupState={paymentSetupState} />
  );
}

export default async function CreateCoursePage({ params }) {
  const { hubSlug } = await params;
  const headerStore = await headers();
  const routeMode = resolveHubRuntimeRouteMode(getRequestHostFromHeaders(headerStore));
  const hub = await requireHubCoreBySlug(hubSlug);

  return (
    <div className={styles.layout}>
      <WorkspaceSection
        eyebrow="Courses"
        title="Create course"
        description="Set the structure, commitment, pricing, and enrolment rules before opening the course to members."
        actions={
          <Button href={buildHubRuntimeHref(hub.slug, "/admin/courses", routeMode)} variant="secondary">
            Back to courses
          </Button>
        }
      >
        <Suspense fallback={<AdminWizardFormFallback steps={5} fields={6} />}>
          <CreateCourseWorkspace hubSlug={hubSlug} />
        </Suspense>
      </WorkspaceSection>
      <WorkflowGuidance
        eyebrow="Publishing guidance"
        title="What admins should resolve before enrolment opens"
        items={[
          {
            title: "Set the commitment clearly",
            body: "Timing, session count, delivery format, and capacity are part of the promise you are making to members.",
            icon: "school",
          },
          {
            title: "Treat pricing as operational",
            body: "Paid vs free changes the payment path, reminders, and what members expect at enrolment time.",
            icon: "payments",
          },
          {
            title: "Use draft to reduce mistakes",
            body: "Course detail tends to be denser than event detail. Keep it in draft until the offer is genuinely ready to be seen.",
            icon: "fact_check",
          },
        ]}
      />
    </div>
  );
}
