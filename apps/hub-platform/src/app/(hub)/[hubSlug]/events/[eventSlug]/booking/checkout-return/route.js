import { NextResponse } from "next/server";
import { requireCurrentMemberSessionForHub } from "@/lib/auth/member-session";
import { requireHubBySlug } from "@/lib/data/hubs";
import { getEventBySlug } from "@/lib/data/events";
import { finalizeEventBookingCheckoutReturn } from "@/lib/server/event-booking-checkout";

function normalizeString(value) {
  return String(value || "").trim();
}

export async function GET(request, { params }) {
  const { hubSlug, eventSlug } = await params;
  const url = new URL(request.url);
  const transactionId = normalizeString(url.searchParams.get("transaction"));
  const sessionId = normalizeString(url.searchParams.get("session_id"));
  const state = normalizeString(url.searchParams.get("state"));
  const hub = await requireHubBySlug(hubSlug);
  const event = await getEventBySlug(hub.slug, eventSlug);

  if (!event) {
    return NextResponse.redirect(new URL(`/${hub.slug}/events`, request.url));
  }

  const nextStepsPath = `/${hub.slug}/events/${event.slug}/booking/next-steps`;

  if (state === "cancelled") {
    return NextResponse.redirect(new URL(`${nextStepsPath}?success=checkoutCancelled`, request.url));
  }

  try {
    const memberSession = await requireCurrentMemberSessionForHub(hub, nextStepsPath);
    const result = await finalizeEventBookingCheckoutReturn({
      hub,
      event,
      memberSession,
      transactionId,
      sessionId,
      actorId: memberSession.user.id,
    });

    return NextResponse.redirect(
      new URL(
        `${nextStepsPath}?success=${result.paid ? "checkoutSubmitted" : "checkoutCompleted"}`,
        request.url
      )
    );
  } catch {
    return NextResponse.redirect(new URL(`${nextStepsPath}?success=checkoutCompleted`, request.url));
  }
}
