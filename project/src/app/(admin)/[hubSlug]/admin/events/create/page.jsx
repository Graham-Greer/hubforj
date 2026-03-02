import { redirect, notFound } from "next/navigation";
import PageHeader from "@/components/patterns/page-header/PageHeader";
import ErrorState from "@/components/ui/error-state/ErrorState";
import { canAccessHubAdmin } from "@/lib/auth/guards";
import { getSession } from "@/lib/auth/session";
import { getHubBySlug } from "@/lib/data/hubs/hub-repository";
import { listMediaByHub } from "@/lib/data/media/media-repository";
import { createEvent } from "@/lib/data/events/event-repository";
import { validateEventInput } from "@/lib/validation/events";
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

async function createEventAction(formData) {
  "use server";

  const hubSlug = String(formData.get("hubSlug") || "").trim();
  const session = await requireHubAccess(hubSlug);
  const hub = await getHubBySlug(hubSlug);
  if (!hub) {
    redirect("/platform/hubs");
  }

  try {
    const intent = String(formData.get("intent") || "save").trim();
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
      status: intent === "publish" ? "published" : "draft",
    });

    const event = await createEvent(hub.id, payload, session?.uid || "local-admin");
    redirect(`/${hub.slug}/admin/events/${event.id}?created=1`);
  } catch (error) {
    const message = encodeURIComponent(error?.message || "Unable to create event.");
    redirect(`/${hubSlug}/admin/events/create?error=${message}`);
  }
}

export const dynamic = "force-dynamic";

export default async function CreateEventPage({ params, searchParams }) {
  await requireHubAccess(params.hubSlug);

  const hub = await getHubBySlug(params.hubSlug);
  if (!hub) notFound();

  const media = await listMediaByHub(hub.id);
  const errorMessage = searchParams?.error ? decodeURIComponent(searchParams.error) : null;

  return (
    <section className={styles.root}>
      <PageHeader
        title="Create Event"
        subtitle="Draft first or publish immediately once required fields are complete."
      />
      {errorMessage ? <ErrorState title="Create failed" body={errorMessage} variant="compact" /> : null}
      <EventEditorForm
        formAction={createEventAction}
        submitLabel="Save draft"
        defaultValues={toEventFormDefaults()}
        media={media}
        showPublishSubmit
        hiddenFields={{ hubSlug: hub.slug }}
      />
    </section>
  );
}
