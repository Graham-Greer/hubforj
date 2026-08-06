import { Suspense } from "react";
import { headers } from "next/headers";
import MemberPaymentsWorkspace from "@/components/patterns/member-payments-workspace/MemberPaymentsWorkspace";
import { MemberBillingFallback } from "@/components/patterns/member-account-fallbacks";
import PageHeader from "@/components/patterns/page-header/PageHeader";
import { requireCurrentMemberSessionForHub } from "@/lib/auth/member-session";
import { requireHubCoreBySlug } from "@/lib/data/hubs";
import { listMemberPaymentItems } from "@/lib/data/member-payments";
import { buildMemberBillingItems } from "@/lib/domain/member-account";
import { getRequestHostFromHeaders, resolveHubRuntimeRouteMode } from "@/lib/domain/hub-hosts";
import styles from "../accountRoute.module.css";

async function BillingContent({ hub, routeMode }) {
  const memberSession = await requireCurrentMemberSessionForHub(hub, `/${hub.slug}/account/billing`);
  const items = await listMemberPaymentItems(hub.id, memberSession.user.id);
  const billingItems = buildMemberBillingItems({ hub, items, routeMode });

  return <MemberPaymentsWorkspace hub={hub} items={billingItems} showHeader={false} />;
}

export default async function BillingPage({ params }) {
  const { hubSlug } = await params;
  const hubRecord = await requireHubCoreBySlug(hubSlug);
  const requestHeaders = await headers();
  const routeMode = resolveHubRuntimeRouteMode(getRequestHostFromHeaders(requestHeaders));
  const hub = { ...hubRecord, routeMode };

  return (
    <div className={styles.routeStack}>
      <PageHeader
        eyebrow="Member account"
        title="Billing"
        description="Review membership, event, and course payment activity in one place."
      />
      <Suspense fallback={<MemberBillingFallback />}>
        <BillingContent hub={hub} routeMode={routeMode} />
      </Suspense>
    </div>
  );
}
