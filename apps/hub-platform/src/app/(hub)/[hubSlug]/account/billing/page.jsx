import { headers } from "next/headers";
import MemberPaymentsWorkspace from "@/components/patterns/member-payments-workspace/MemberPaymentsWorkspace";
import { requireCurrentMemberSessionForHub } from "@/lib/auth/member-session";
import { requireHubBySlug } from "@/lib/data/hubs";
import { listMemberPaymentItems } from "@/lib/data/member-payments";
import { buildMemberBillingItems } from "@/lib/domain/member-account";
import { getRequestHostFromHeaders, resolveHubRuntimeRouteMode } from "@/lib/domain/hub-hosts";

export default async function BillingPage({ params }) {
  const { hubSlug } = await params;
  const hubRecord = await requireHubBySlug(hubSlug);
  const requestHeaders = await headers();
  const routeMode = resolveHubRuntimeRouteMode(getRequestHostFromHeaders(requestHeaders));
  const hub = { ...hubRecord, routeMode };
  const memberSession = await requireCurrentMemberSessionForHub(hub, `/${hub.slug}/account/billing`);
  const items = await listMemberPaymentItems(hub.id, memberSession.user.id);
  const billingItems = buildMemberBillingItems({ hub, items, routeMode });

  return <MemberPaymentsWorkspace hub={hub} items={billingItems} />;
}
