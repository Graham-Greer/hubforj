import { notFound, redirect } from "next/navigation";
import SectionContainer from "@/components/sections/section-container/SectionContainer";
import SectionShell from "@/components/sections/section-shell/SectionShell";
import OfferingNextStepsWorkspace from "@/components/patterns/offering-next-steps-workspace/OfferingNextStepsWorkspace";
import { requireCurrentMemberSessionForHub } from "@/lib/auth/member-session";
import { requireHubBySlug } from "@/lib/data/hubs";
import { getPublicEventNextStepsData } from "@/lib/data/public-site";
import { buildPublicEventNextStepsModel } from "@/lib/domain/public-offering-next-steps";

export default async function EventBookingNextStepsPage({ params }) {
  const { hubSlug, eventSlug } = await params;
  const hub = await requireHubBySlug(hubSlug);
  const nextStepsPath = `/${hub.slug}/events/${eventSlug}/booking/next-steps`;
  const memberSession = await requireCurrentMemberSessionForHub(hub, nextStepsPath);
  const { event, currentBooking, nativePaymentTransaction } = await getPublicEventNextStepsData(
    hub.slug,
    eventSlug,
    memberSession.user.id
  );

  if (!event) {
    notFound();
  }

  if (!currentBooking) {
    redirect(`/${hub.slug}/events/${event.slug}`);
  }

  return (
    <SectionShell surface="transparent" spacing="default">
      <SectionContainer width="default">
        <OfferingNextStepsWorkspace
          model={buildPublicEventNextStepsModel({
            hub,
            event,
            booking: currentBooking,
            nativePaymentTransaction,
          })}
        />
      </SectionContainer>
    </SectionShell>
  );
}
