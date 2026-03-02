import { notFound, redirect } from "next/navigation";
import Heading from "@/components/primitives/heading/Heading";
import Text from "@/components/primitives/text/Text";
import Card from "@/components/ui/card/Card";
import Badge from "@/components/ui/badge/Badge";
import ErrorState from "@/components/ui/error-state/ErrorState";
import EmptyState from "@/components/ui/empty-state/EmptyState";
import { getSession } from "@/lib/auth/session";
import { getRequestHost, resolveHubByHost } from "@/lib/data/hubs/domain-resolution";
import {
  cancelRegistration,
  getRegistrationById,
  listRegistrationsByUser,
} from "@/lib/data/events/registration-repository";
import { getEventById } from "@/lib/data/events/event-repository";
import CancelRegistrationButton from "@/app/_shared/member-portal/CancelRegistrationButton";
import styles from "@/app/_shared/member-portal/member-portal.module.css";

export const dynamic = "force-dynamic";

function statusTone(status) {
  if (status === "registered") return "brand";
  if (status === "waitlisted") return "neutral";
  if (status === "cancelled") return "danger";
  return "neutral";
}

async function cancelRegistrationAction(formData) {
  "use server";

  const eventId = String(formData.get("eventId") || "").trim();
  const registrationId = String(formData.get("registrationId") || "").trim();
  const host = await getRequestHost();
  const context = await resolveHubByHost(host);
  if (!context.hub) {
    redirect("/account/registrations?error=Hub%20not%20found.");
  }

  const session = await getSession();
  if (!session?.uid) {
    redirect("/sign-in");
  }

  try {
    const registration = await getRegistrationById(context.hub.id, eventId, registrationId);
    if (!registration) {
      throw new Error("Registration not found.");
    }
    if (registration.userId !== session.uid) {
      throw new Error("You can only cancel your own registration.");
    }

    await cancelRegistration(context.hub.id, eventId, registrationId, session.uid);
    redirect("/account/registrations?success=cancelled");
  } catch (error) {
    redirect(`/account/registrations?error=${encodeURIComponent(error?.message || "Unable to cancel registration.")}`);
  }
}

export default async function CustomDomainRegistrationsPage({ searchParams }) {
  const host = await getRequestHost();
  const context = await resolveHubByHost(host);
  if (!context.hub) notFound();

  const session = await getSession();
  const registrations = await listRegistrationsByUser(context.hub.id, session?.uid);
  const eventIds = Array.from(new Set(registrations.map((item) => String(item.eventId || "").trim()).filter(Boolean)));
  const events = await Promise.all(
    eventIds.map(async (eventId) => {
      const event = await getEventById(context.hub.id, eventId);
      return [eventId, event];
    })
  );
  const eventsById = new Map(events);
  const error = searchParams?.error ? decodeURIComponent(searchParams.error) : "";
  const success = searchParams?.success ? decodeURIComponent(searchParams.success) : "";

  return (
    <main className={styles.grid}>
      <header className={styles.header}>
        <Heading as="h1" size="md">Registrations</Heading>
        <Text tone="secondary">View your event registrations and waitlist status.</Text>
      </header>

      {error ? <ErrorState title="Registration update failed" body={error} variant="compact" /> : null}
      {success === "cancelled" ? <Text>Your registration has been cancelled.</Text> : null}

      {registrations.length ? (
        registrations.map((registration) => (
          <Card key={registration.id} className={styles.grid}>
            <Text tone="secondary">
              Event: {eventsById.get(registration.eventId)?.title || registration.eventId}
              {eventsById.get(registration.eventId)?.slug ? ` (${eventsById.get(registration.eventId).slug})` : ""}
            </Text>
            <div className={styles.row}>
              <Text tone="secondary">Status</Text>
              <Badge tone={statusTone(registration.status)}>{registration.status}</Badge>
              <Text tone="secondary">Payment</Text>
              <Badge tone={registration.paymentStatus === "paid" ? "brand" : "neutral"}>
                {registration.paymentStatus}
              </Badge>
            </div>
            {registration.status !== "cancelled" ? (
              <CancelRegistrationButton
                action={cancelRegistrationAction}
                hiddenFields={{ eventId: registration.eventId, registrationId: registration.id }}
              />
            ) : null}
          </Card>
        ))
      ) : (
        <EmptyState title="No registrations" body="You have no event registrations yet." />
      )}
    </main>
  );
}
