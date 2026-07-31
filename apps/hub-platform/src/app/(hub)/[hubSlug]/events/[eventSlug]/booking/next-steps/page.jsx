import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import SectionContainer from "@/components/sections/section-container/SectionContainer";
import SectionShell from "@/components/sections/section-shell/SectionShell";
import OfferingNextStepsWorkspace from "@/components/patterns/offering-next-steps-workspace/OfferingNextStepsWorkspace";
import { requireCurrentMemberSessionForHub } from "@/lib/auth/member-session";
import { requireHubBySlug } from "@/lib/data/hubs";
import { getPublicEventNextStepsData } from "@/lib/data/public-site";
import { getRequestHostFromHeaders, resolveHubRuntimeRouteMode } from "@/lib/domain/hub-hosts";
import { buildHubRuntimeHref } from "@/lib/domain/hub-runtime-paths";
import { buildPublicEventNextStepsModel } from "@/lib/domain/public-offering-next-steps";

export default async function EventBookingNextStepsPage({ params }) {
  const { hubSlug, eventSlug } = await params;
  const hub = await requireHubBySlug(hubSlug);
  const requestHeaders = await headers();
  const routeMode = resolveHubRuntimeRouteMode(getRequestHostFromHeaders(requestHeaders));
  const runtimeHub = { ...hub, routeMode };
  const nextStepsPath = buildHubRuntimeHref(runtimeHub.slug, `/events/${eventSlug}/booking/next-steps`, runtimeHub.routeMode);
  const memberSession = await requireCurrentMemberSessionForHub(runtimeHub, nextStepsPath);
  const { event, currentBooking, nativePaymentTransaction } = await getPublicEventNextStepsData(
    hub.slug,
    eventSlug,
    memberSession.user.id
  );

  if (!event) {
    notFound();
  }

  if (!currentBooking) {
    redirect(buildHubRuntimeHref(runtimeHub.slug, `/events/${event.slug}`, runtimeHub.routeMode));
  }

  return (
    <SectionShell surface="transparent" spacing="default">
      <SectionContainer width="default">
        <OfferingNextStepsWorkspace
          model={buildPublicEventNextStepsModel({
            hub: runtimeHub,
            event,
            booking: currentBooking,
            nativePaymentTransaction,
          })}
        />
      </SectionContainer>
    </SectionShell>
  );
}
