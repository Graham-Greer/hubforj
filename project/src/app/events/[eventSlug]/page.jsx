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
import { getRequestHost, resolveHubByHost } from "@/lib/data/hubs/domain-resolution";
import { getPublishedEventBySlug } from "@/lib/data/events/event-repository";
import {
  cancelRegistration,
  createRegistration,
  getLatestRegistrationByUserForEvent,
} from "@/lib/data/events/registration-repository";
import { getMediaByIds } from "@/lib/data/media/media-repository";
import { getLatestMembershipByUser } from "@/lib/data/memberships/membership-repository";
import { buildThemeScope } from "@/lib/theming/hub-theme";
import CancelRegistrationButton from "@/app/_shared/member-portal/CancelRegistrationButton";
import styles from "../../custom-domain-shell.module.css";

export const revalidate = 120;

async function registerAction(formData) {
  "use server";

  const eventSlug = String(formData.get("eventSlug") || "").trim();
  const session = await getSession();
  if (!session?.uid) {
    redirect(`/sign-in?error=${encodeURIComponent("Sign in to register for events.")}`);
  }

  const host = await getRequestHost();
  const context = await resolveHubByHost(host);
  if (!context.hub) {
    redirect(`/events/${eventSlug}?error=${encodeURIComponent("Hub not found.")}`);
  }

  if (session.hubId !== context.hub.id) {
    redirect(`/events/${eventSlug}?error=${encodeURIComponent("Your account is not eligible for this hub.")}`);
  }

  const event = await getPublishedEventBySlug(context.hub.id, eventSlug);
  if (!event) {
    redirect(`/events?error=${encodeURIComponent("Event not found.")}`);
  }

  try {
    const registration = await createRegistration(context.hub.id, event.id, { userId: session.uid }, session.uid);
    redirect(`/events/${event.slug}?success=${encodeURIComponent(registration.status)}`);
  } catch (error) {
    redirect(`/events/${event.slug}?error=${encodeURIComponent(error?.message || "Unable to register.")}`);
  }
}

async function cancelAction(formData) {
  "use server";

  const eventSlug = String(formData.get("eventSlug") || "").trim();
  const session = await getSession();
  if (!session?.uid) {
    redirect(`/sign-in?error=${encodeURIComponent("Sign in to manage registrations.")}`);
  }

  const host = await getRequestHost();
  const context = await resolveHubByHost(host);
  if (!context.hub) {
    redirect(`/events/${eventSlug}?error=${encodeURIComponent("Hub not found.")}`);
  }

  if (session.hubId !== context.hub.id) {
    redirect(`/events/${eventSlug}?error=${encodeURIComponent("Your account is not eligible for this hub.")}`);
  }

  const event = await getPublishedEventBySlug(context.hub.id, eventSlug);
  if (!event) {
    redirect(`/events?error=${encodeURIComponent("Event not found.")}`);
  }

  try {
    const registration = await getLatestRegistrationByUserForEvent(context.hub.id, event.id, session.uid);
    if (!registration || registration.status === "cancelled") {
      throw new Error("No active registration found for this event.");
    }

    await cancelRegistration(context.hub.id, event.id, registration.id, session.uid);
    redirect(`/events/${event.slug}?success=cancelled`);
  } catch (error) {
    redirect(`/events/${event.slug}?error=${encodeURIComponent(error?.message || "Unable to cancel registration.")}`);
  }
}

function toDateLabel(value) {
  if (!value) return "Date TBD";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Date TBD";
  return parsed.toLocaleString();
}

export default async function CustomDomainEventDetailPage({ params, searchParams }) {
  const host = await getRequestHost();
  const context = await resolveHubByHost(host);
  if (!context.hub) notFound();

  const event = await getPublishedEventBySlug(context.hub.id, params.eventSlug);
  if (!event) notFound();

  const session = await getSession();
  const canViewMembersOnly = canAccessHubMember(session, context.hub.slug);
  if (event.visibility === "members-only" && !canViewMembersOnly) {
    const theme = buildThemeScope(context.hub);
    return (
      <div data-template={theme["data-template"]} data-hub-theme={theme["data-hub-theme"]}>
        {theme.stylesheetHref ? <link rel="stylesheet" href={theme.stylesheetHref} /> : null}
        <HubHeaderFooterFrame hub={context.hub} basePath="">
          <main className={styles.shell}>
            <ErrorState
              title="Members-only event"
              body="Sign in with a member account to view this event."
            />
            <Link href="/events">Back to events</Link>
          </main>
        </HubHeaderFooterFrame>
      </div>
    );
  }

  const media = await getMediaByIds(context.hub.id, event.imageMediaIds || []);
  const hero = media[0];
  const registration = session?.uid ? await getLatestRegistrationByUserForEvent(context.hub.id, event.id, session.uid) : null;
  const membership = session?.uid && event.registrationEligibility === "members-only"
    ? await getLatestMembershipByUser(context.hub.id, session.uid)
    : null;
  const hasAccountForHub = Boolean(session?.uid && session.hubId === context.hub.id);
  const eligibleForRegistration = event.registrationEligibility === "guests-allowed"
    ? hasAccountForHub
    : hasAccountForHub && membership?.status === "active";
  const activeRegistration = registration && registration.status !== "cancelled" ? registration : null;
  const error = searchParams?.error ? decodeURIComponent(searchParams.error) : "";
  const success = searchParams?.success ? decodeURIComponent(searchParams.success) : "";
  const theme = buildThemeScope(context.hub);

  return (
    <div data-template={theme["data-template"]} data-hub-theme={theme["data-hub-theme"]}>
      {theme.stylesheetHref ? <link rel="stylesheet" href={theme.stylesheetHref} /> : null}
      <HubHeaderFooterFrame hub={context.hub} basePath="">
        <main className={styles.shell}>
          <Link href="/events">Back to events</Link>
          <header>
            <Heading as="h1" size="md">{event.title}</Heading>
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

          <section>
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
              <>
                <Text tone="secondary">Create an account or sign in to register.</Text>
                <Button href="/sign-in" variant="secondary">Sign in</Button>
                <Button href="/join" variant="tertiary">Create account</Button>
              </>
            ) : activeRegistration ? (
              <>
                <Badge tone={activeRegistration.status === "registered" ? "brand" : "neutral"}>
                  {activeRegistration.status === "registered" ? "Registered" : "Waitlisted"}
                </Badge>
                <CancelRegistrationButton
                  action={cancelAction}
                  hiddenFields={{ eventSlug: event.slug }}
                />
              </>
            ) : eligibleForRegistration ? (
              <form action={registerAction}>
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
    </div>
  );
}
