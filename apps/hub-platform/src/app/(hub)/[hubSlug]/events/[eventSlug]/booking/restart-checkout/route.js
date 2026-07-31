import { NextResponse } from "next/server";
import { requireCurrentMemberSessionForHub } from "@/lib/auth/member-session";
import { requireHubBySlug } from "@/lib/data/hubs";
import { getEventBySlug } from "@/lib/data/events";
import { getActiveOrWaitlistedEventBookingByBooker } from "@/lib/data/event-bookings";
import { resolveHubRuntimeRouteMode } from "@/lib/domain/hub-hosts";
import { buildHubRuntimeHref } from "@/lib/domain/hub-runtime-paths";
import { startEventBookingCheckout } from "@/lib/server/event-booking-checkout";

function normalizeString(value) {
  return String(value || "").trim();
}

export async function GET(request, { params }) {
  const { hubSlug, eventSlug } = await params;
  const hub = await requireHubBySlug(hubSlug);
  const requestHost = normalizeString(request.headers.get("x-forwarded-host") || request.headers.get("host"));
  const routeMode = resolveHubRuntimeRouteMode(requestHost);
  const detailPath = buildHubRuntimeHref(hub.slug, `/events/${eventSlug}`, routeMode);
  const eventsPath = buildHubRuntimeHref(hub.slug, "/events", routeMode);
  const nextStepsPath = buildHubRuntimeHref(hub.slug, `/events/${eventSlug}/booking/next-steps`, routeMode);
  const memberSession = await requireCurrentMemberSessionForHub(hub, detailPath);
  const event = await getEventBySlug(hub.slug, eventSlug);

  if (!event) {
    return NextResponse.redirect(new URL(eventsPath, request.url));
  }

  const booking = await getActiveOrWaitlistedEventBookingByBooker(hub.id, event.id, memberSession.user.id);

  if (!booking) {
    return NextResponse.redirect(new URL(detailPath, request.url));
  }

  try {
    const checkout = await startEventBookingCheckout({
      hub,
      event,
      booking,
      memberSession,
      actorId: memberSession.user.id,
      requestHost,
      routeMode,
    });

    return NextResponse.redirect(checkout.checkoutUrl);
  } catch {
    return NextResponse.redirect(new URL(nextStepsPath, request.url));
  }
}
