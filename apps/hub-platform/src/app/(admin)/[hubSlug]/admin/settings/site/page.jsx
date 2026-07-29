import Link from "next/link";
import FormMessage from "@/components/ui/form-message/FormMessage";
import SiteSettingsForm from "./SiteSettingsForm";
import AdminDirtyAwareBackButton from "@/components/patterns/admin-form-runtime/AdminDirtyAwareBackButton";
import { AdminFormRuntimeProvider } from "@/components/patterns/admin-form-runtime/AdminFormRuntime";
import WorkspaceSection from "@/components/patterns/workspace-section/WorkspaceSection";
import { requireHubBySlug } from "@/lib/data/hubs";
import { getHubPaymentConfigurationByHubId } from "@/lib/data/hub-payment-configurations";
import { getSiteSettingsFormValuesByHub } from "@/lib/data/site-settings";
import { getHubPaymentSetupState, hubUsesInternalNativePayments } from "@/lib/domain/hub-payment-configuration";
import styles from "../settings.module.css";

export default async function SiteSettingsPage({ params }) {
  const { hubSlug } = await params;
  const hub = await requireHubBySlug(hubSlug);
  const [siteSettingsFormValues, paymentConfiguration] = await Promise.all([
    getSiteSettingsFormValuesByHub(hub),
    getHubPaymentConfigurationByHubId(hub.id),
  ]);
  const countryLocked = Boolean(paymentConfiguration?.onboardingStartedAt || paymentConfiguration?.stripeAccountId);
  const paymentSetupState = getHubPaymentSetupState(hub, paymentConfiguration);
  const showStripeSetupNotice = hubUsesInternalNativePayments(hub) && paymentSetupState.key !== "ready";

  return (
    <AdminFormRuntimeProvider>
      <div className={styles.layout}>
        <WorkspaceSection
          eyebrow="Settings"
          title="Site details"
          description="Update shared site defaults here so contact details, homepage hero content, and SEO settings stay consistent."
          actions={
            <AdminDirtyAwareBackButton
              href={`/${hub.slug}/admin/settings`}
              label="Back to settings"
            />
          }
        >
          {showStripeSetupNotice ? (
            <FormMessage tone="info">
              Stripe setup is still incomplete for this Growth hub. Finish it in{" "}
              <Link href={`/${hub.slug}/admin/payments?view=setup`}>Payments</Link>{" "}
              before charging members through paid events, courses, or membership plans.
            </FormMessage>
          ) : null}
          <SiteSettingsForm hub={hub} initialValues={siteSettingsFormValues} countryLocked={countryLocked} />
        </WorkspaceSection>
      </div>
    </AdminFormRuntimeProvider>
  );
}
