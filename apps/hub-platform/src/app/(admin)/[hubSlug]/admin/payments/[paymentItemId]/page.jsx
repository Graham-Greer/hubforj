import PaymentDetailWorkspace from "@/components/patterns/hub-payments-workspace/PaymentDetailWorkspace";
import { getHubPaymentItemDetailBySlug } from "@/lib/data/hub-payments";
import { getRequestHostFromHeaders, resolveHubRuntimeRouteMode } from "@/lib/domain/hub-hosts";
import { buildHubRuntimeHref } from "@/lib/domain/hub-runtime-paths";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

export default async function PaymentDetailPage({ params }) {
  const { hubSlug, paymentItemId } = await params;
  const headerStore = await headers();
  const routeMode = resolveHubRuntimeRouteMode(getRequestHostFromHeaders(headerStore));
  const { hub, item, detail } = await getHubPaymentItemDetailBySlug(hubSlug, paymentItemId, { routeMode });

  if (!hub || !item || !detail) {
    notFound();
  }

  return (
    <PaymentDetailWorkspace
      hub={hub}
      item={item}
      detail={detail}
      paymentsHref={buildHubRuntimeHref(hub.slug, "/admin/payments?view=payments", routeMode)}
    />
  );
}
