import { notFound, redirect } from "next/navigation";
import Heading from "@/components/primitives/heading/Heading";
import Text from "@/components/primitives/text/Text";
import Link from "@/components/ui/link/Link";
import AppImage from "@/components/ui/image/AppImage";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import ErrorState from "@/components/ui/error-state/ErrorState";
import HubHeaderFooterFrame from "@/app/_shared/HubHeaderFooterFrame";
import { canAccessHubMember } from "@/lib/auth/guards";
import { getSession } from "@/lib/auth/session";
import { getHubBySlug } from "@/lib/data/hubs/hub-repository";
import { getPublishedEventBySlug } from "@/lib/data/events/event-repository";
import {
  cancelRegistration,
  createRegistration,
  getLatestRegistrationByUserForEvent,
} from "@/lib/data/events/registration-repository";
import { getMediaByIds } from "@/lib/data/media/media-repository";
import { getLatestMembershipByUser } from "@/lib/data/memberships/membership-repository";
import CancelRegistrationButton from "@/app/_shared/member-portal/CancelRegistrationButton";
import styles from "./page.module.css";

export const revalidate = 120;

async function registerAction(formData) {
  "use server";

  const hubSlug = String(formData.get("hubSlug") || "").trim();
  const eventSlug = String(formData.get("eventSlug") || "").trim();
  const session = await getSession();
  if (!session?.uid) {
    redirect(`/${hubSlug}/sign-in?error=${encodeURIComponent("Sign in to register for events.")}`);
  }

  const hub = await getHubBySlug(hubSlug);
  if (!hub) {
    redirect(`/${hubSlug}/events/${eventSlug}?error=${encodeURIComponent("Hub not found.")}`);
  }

  if (session.hubId !== hub.id) {
    redirect(`/${hub.slug}/events/${eventSlug}?error=${encodeURIComponent("Your account is not eligible for this hub.")}`);
  }

  const event = await getPublishedEventBySlug(hub.id, eventSlug);
  if (!event) {
    redirect(`/${hub.slug}/events?error=${encodeURIComponent("Event not found.")}`);
  }

  try {
    const registration = await createRegistration(hub.id, event.id, { userId: session.uid }, session.uid);
    redirect(`/${hub.slug}/events/${event.slug}?success=${encodeURIComponent(registration.status)}`);
  } catch (error) {
    redirect(`/${hub.slug}/events/${event.slug}?error=${encodeURIComponent(error?.message || "Unable to register.")}`);
  }
}

async function cancelAction(formData) {
  "use server";

  const hubSlug = String(formData.get("hubSlug") || "").trim();
  const eventSlug = String(formData.get("eventSlug") || "").trim();
  const session = await getSession();
  if (!session?.uid) {
    redirect(`/${hubSlug}/sign-in?error=${encodeURIComponent("Sign in to manage registrations.")}`);
  }

  const hub = await getHubBySlug(hubSlug);
  if (!hub) {
    redirect(`/${hubSlug}/events/${eventSlug}?error=${encodeURIComponent("Hub not found.")}`);
  }

  if (session.hubId !== hub.id) {
    redirect(`/${hub.slug}/events/${eventSlug}?error=${encodeURIComponent("Your account is not eligible for this hub.")}`);
  }

  const event = await getPublishedEventBySlug(hub.id, eventSlug);
  if (!event) {
    redirect(`/${hub.slug}/events?error=${encodeURIComponent("Event not found.")}`);
  }

  try {
    const registration = await getLatestRegistrationByUserForEvent(hub.id, event.id, session.uid);
    if (!registration || registration.status === "cancelled") {
      throw new Error("No active registration found for this event.");
    }

    await cancelRegistration(hub.id, event.id, registration.id, session.uid);
    redirect(`/${hub.slug}/events/${event.slug}?success=cancelled`);
  } catch (error) {
    redirect(`/${hub.slug}/events/${event.slug}?error=${encodeURIComponent(error?.message || "Unable to cancel registration.")}`);
  }
}

function toDateLabel(value) {
  if (!value) return "Date TBD";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Date TBD";
  return parsed.toLocaleString();
}

export default async function PublicEventDetailPage({ params, searchParams }) {
  const hub = await getHubBySlug(params.hubSlug);
  if (!hub) notFound();

  const event = await getPublishedEventBySlug(hub.id, params.eventSlug);
  if (!event) notFound();

  const session = await getSession();
  const canViewMembersOnly = canAccessHubMember(session, hub.slug);
  if (event.visibility === "members-only" && !canViewMembersOnly) {
    return (
      <HubHeaderFooterFrame hub={hub} basePath={`/${hub.slug}`}>
        <main className={styles.root}>
          <ErrorState
            title="Members-only event"
            body="Sign in with a member account to view this event."
          />
          <Link href={`/${hub.slug}/events`}>Back to events</Link>
        </main>
      </HubHeaderFooterFrame>
    );
  }

  const media = await getMediaByIds(hub.id, event.imageMediaIds || []);
  const hero = media[0];
  const registration = session?.uid ? await getLatestRegistrationByUserForEvent(hub.id, event.id, session.uid) : null;
  const membership = session?.uid && event.registrationEligibility === "members-only"
    ? await getLatestMembershipByUser(hub.id, session.uid)
    : null;
  const hasAccountForHub = Boolean(session?.uid && session.hubId === hub.id);
  const eligibleForRegistration = event.registrationEligibility === "guests-allowed"
    ? hasAccountForHub
    : hasAccountForHub && membership?.status === "active";
  const activeRegistration = registration && registration.status !== "cancelled" ? registration : null;
  const error = searchParams?.error ? decodeURIComponent(searchParams.error) : "";
  const success = searchParams?.success ? decodeURIComponent(searchParams.success) : "";

  return (
    <HubHeaderFooterFrame hub={hub} basePath={`/${hub.slug}`}>
      <main className={styles.root}>
        <Link href={`/${hub.slug}/events`}>Back to events</Link>
        <header className={styles.header}>
          <Heading as="h1" size="lg">{event.title}</Heading>
          <Text tone="secondary">{toDateLabel(event.startAt)}{event.location ? ` • ${event.location}` : ""}</Text>
        </header>

        {hero?.publicUrl ? (
          <AppImage
            src={hero.publicUrl}
            alt={hero.alt || event.title}
            width={1400}
            height={840}
            sizes="(max-width: 900px) 100vw, 70vw"
          />
        ) : null}

        <section className={styles.body}>
          <Text>{event.description || "Event details will be shared soon."}</Text>
          <Text tone="secondary">Category: {event.category || "General"}</Text>
          <Text tone="secondary">
            Eligibility: {event.registrationEligibility === "members-only" ? "Members only" : "Guests allowed"}
          </Text>
          <Text tone="secondary">
            Price: {event.pricingMode === "paid" ? `$${Number(event.price || 0).toFixed(2)}` : "Free"}
          </Text>

          {error ? <ErrorState title="Registration update failed" body={error} variant="compact" /> : null}
          {success === "registered" ? <Text>You are registered for this event.</Text> : null}
          {success === "waitlisted" ? <Text tone="secondary">Event capacity is full. You are on the waitlist.</Text> : null}
          {success === "cancelled" ? <Text tone="secondary">Your registration has been cancelled.</Text> : null}

          {!session?.uid ? (
            <div className={styles.body}>
              <Text tone="secondary">Create an account or sign in to register.</Text>
              <Button href={`/${hub.slug}/sign-in`} variant="secondary">Sign in</Button>
              <Button href={`/${hub.slug}/join`} variant="tertiary">Create account</Button>
            </div>
          ) : activeRegistration ? (
            <div className={styles.body}>
              <Badge tone={activeRegistration.status === "registered" ? "brand" : "neutral"}>
                {activeRegistration.status === "registered" ? "Registered" : "Waitlisted"}
              </Badge>
              <CancelRegistrationButton
                action={cancelAction}
                hiddenFields={{ hubSlug: hub.slug, eventSlug: event.slug }}
              />
            </div>
          ) : eligibleForRegistration ? (
            <form action={registerAction}>
              <input type="hidden" name="hubSlug" value={hub.slug} />
              <input type="hidden" name="eventSlug" value={event.slug} />
              <Button type="submit">Register now</Button>
            </form>
          ) : (
            <ErrorState
              title="Registration not available"
              body={
                event.registrationEligibility === "members-only"
                  ? "This event requires an active membership."
                  : "Your account is not eligible for this hub."
              }
              variant="compact"
            />
          )}
        </section>
      </main>
    </HubHeaderFooterFrame>
  );
}
