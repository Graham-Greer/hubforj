import LockedFeatureState from "@/components/patterns/locked-feature-state/LockedFeatureState";
import RegionalSetupRequiredState from "@/components/patterns/regional-setup-required-state/RegionalSetupRequiredState";
import { requireHubBySlug } from "@/lib/data/hubs";
import { isHubRegionalSetupComplete } from "@/lib/domain/hub-regional-setup";
import { hasHubCapability } from "@/lib/domain/package-guards";

export default async function CoursesAdminLayout({ children, params }) {
  const { hubSlug } = await params;
  const hub = await requireHubBySlug(hubSlug);

  if (!isHubRegionalSetupComplete(hub)) {
    return (
      <RegionalSetupRequiredState
        hub={hub}
        title="Complete regional setup before managing courses"
        description="Course scheduling, enrolment payments, and member-facing pricing depend on your community timezone and currency."
      />
    );
  }

  if (!hasHubCapability(hub, "coursesEnabled")) {
    return (
      <LockedFeatureState
        eyebrow="Growth feature"
        title="Courses are locked on your current package"
        description="Courses become available on Growth when you are ready to run structured programmes and monetised learning offers."
        unlocks={[
          "Create and publish courses",
          "Manage course registrations and attendance",
          "Offer paid course enrolment through Stripe",
        ]}
        secondaryAction={{ href: `/${hub.slug}/admin`, label: "Back to overview" }}
      />
    );
  }

  return children;
}
