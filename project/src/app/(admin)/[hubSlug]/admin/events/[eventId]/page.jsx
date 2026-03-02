import { notFound, redirect } from "next/navigation";
import PageHeader from "@/components/patterns/page-header/PageHeader";
import ErrorState from "@/components/ui/error-state/ErrorState";
import Text from "@/components/primitives/text/Text";
import Button from "@/components/ui/button/Button";
import { canAccessHubAdmin } from "@/lib/auth/guards";
import { getSession } from "@/lib/auth/session";
import { getHubBySlug } from "@/lib/data/hubs/hub-repository";
import { listMediaByHub } from "@/lib/data/media/media-repository";
import { getEventById, transitionEventStatus, updateEvent } from "@/lib/data/events/event-repository";
import { validateEventInput, validateEventRouteInput } from "@/lib/validation/events";
import EventEditorForm from "../_components/EventEditorForm";
import { toEventFormDefaults } from "../event-form-data";
import styles from "./page.module.css";

async function requireHubAccess(hubSlug) {
  const session = await getSession();
  if (!canAccessHubAdmin(session, hubSlug)) {
    redirect("/platform/sign-in");
  }
  return session;
}

async function updateEventAction(formData) {
  "use server";

  const { hubSlug, eventId } = validateEventRouteInput({
    hubSlug: formData.get("hubSlug"),
    eventId: formData.get("eventId"),
  });

  const session = await requireHubAccess(hubSlug);
  const hub = await getHubBySlug(hubSlug);
  if (!hub) {
    redirect("/platform/hubs");
  }

  const existing = await getEventById(hub.id, eventId);
  if (!existing) {
    redirect(`/${hubSlug}/admin/events`);
  }

  try {
    const payload = validateEventInput({
      title: formData.get("title"),
      slug: formData.get("slug"),
      description: formData.get("description"),
      imageMediaIds: formData.get("imageMediaIds"),
      startAt: formData.get("startAt"),
      endAt: formData.get("endAt"),
      location: formData.get("location"),
      capacity: formData.get("capacity"),
      category: formData.get("category"),
      tags: formData.get("tags"),
      pricingMode: formData.get("pricingMode"),
      price: formData.get("price"),
      registrationEligibility: formData.get("registrationEligibility"),
      visibility: formData.get("visibility"),
      status: existing.status,
    });

    await updateEvent(hub.id, eventId, payload, session?.uid || "local-admin");
    redirect(`/${hub.slug}/admin/events/${eventId}?saved=1`);
  } catch (error) {
    const message = encodeURIComponent(error?.message || "Unable to update event.");
    redirect(`/${hubSlug}/admin/events/${eventId}?error=${message}`);
  }
}

async function transitionStatusAction(formData) {
  "use server";

  const { hubSlug, eventId } = validateEventRouteInput({
    hubSlug: formData.get("hubSlug"),
    eventId: formData.get("eventId"),
  });
  const nextStatus = String(formData.get("nextStatus") || "").trim();

  const session = await requireHubAccess(hubSlug);
  const hub = await getHubBySlug(hubSlug);
  if (!hub) {
    redirect("/platform/hubs");
  }

  try {
    await transitionEventStatus(hub.id, eventId, nextStatus, session?.uid || "local-admin");
    redirect(`/${hub.slug}/admin/events/${eventId}?statusUpdated=1`);
  } catch (error) {
    const message = encodeURIComponent(error?.message || "Unable to update event status.");
    redirect(`/${hubSlug}/admin/events/${eventId}?error=${message}`);
  }
}

export const dynamic = "force-dynamic";

export default async function EventDetailPage({ params, searchParams }) {
  await requireHubAccess(params.hubSlug);

  const hub = await getHubBySlug(params.hubSlug);
  if (!hub) notFound();

  const event = await getEventById(hub.id, params.eventId);
  if (!event) notFound();

  const media = await listMediaByHub(hub.id);
  const errorMessage = searchParams?.error ? decodeURIComponent(searchParams.error) : null;
  const wasCreated = searchParams?.created === "1";
  const wasSaved = searchParams?.saved === "1";
  const statusUpdated = searchParams?.statusUpdated === "1";

  return (
    <section className={styles.root}>
      <PageHeader
        title={event.title}
        subtitle={`Status: ${event.status}`}
        actions={(
          <>
            <Button href={`/${hub.slug}/admin/events/${event.id}/registrations`} variant="secondary">Registrations</Button>
            <Button href={`/${hub.slug}/admin/events`} variant="secondary">Back to events</Button>
          </>
        )}
      />

      {errorMessage ? <ErrorState title="Event update failed" body={errorMessage} variant="compact" /> : null}
      {wasCreated ? <Text className={styles.notice}>Event created.</Text> : null}
      {wasSaved ? <Text className={styles.notice}>Event updated.</Text> : null}
      {statusUpdated ? <Text className={styles.notice}>Event status updated.</Text> : null}

      <EventEditorForm
        formAction={updateEventAction}
        submitLabel="Save changes"
        defaultValues={toEventFormDefaults(event)}
        media={media}
        includeStatusField
        hiddenFields={{ hubSlug: hub.slug, eventId: event.id }}
      />

      <div className={styles.statusActions}>
        {event.status === "draft" ? (
          <form action={transitionStatusAction}>
            <input type="hidden" name="hubSlug" value={hub.slug} />
            <input type="hidden" name="eventId" value={event.id} />
            <input type="hidden" name="nextStatus" value="published" />
            <Button type="submit">Publish event</Button>
          </form>
        ) : null}

        {event.status === "published" ? (
          <form action={transitionStatusAction}>
            <input type="hidden" name="hubSlug" value={hub.slug} />
            <input type="hidden" name="eventId" value={event.id} />
            <input type="hidden" name="nextStatus" value="cancelled" />
            <Button type="submit" intent="danger" variant="secondary">Cancel event</Button>
          </form>
        ) : null}
      </div>
    </section>
  );
}
