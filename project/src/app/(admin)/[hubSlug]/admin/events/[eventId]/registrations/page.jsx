import { notFound, redirect } from "next/navigation";
import PageHeader from "@/components/patterns/page-header/PageHeader";
import DataTable from "@/components/patterns/data-table/DataTable";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import EmptyState from "@/components/ui/empty-state/EmptyState";
import ErrorState from "@/components/ui/error-state/ErrorState";
import Text from "@/components/primitives/text/Text";
import { canAccessHubAdmin } from "@/lib/auth/guards";
import { getSession } from "@/lib/auth/session";
import { getHubBySlug } from "@/lib/data/hubs/hub-repository";
import { getEventById } from "@/lib/data/events/event-repository";
import {
  cancelRegistration,
  getRegistrationStats,
  listRegistrationsByEvent,
  promoteWaitlistedRegistration,
  updateRegistrationAttendanceStatus,
  updateRegistrationPaymentStatus,
} from "@/lib/data/events/registration-repository";
import { validateRegistrationRouteInput } from "@/lib/validation/registrations";
import CancelRegistrationButton from "./_components/CancelRegistrationButton";
import RegistrationsFilterBar from "./_components/RegistrationsFilterBar";
import styles from "./page.module.css";

async function requireHubAccess(hubSlug) {
  const session = await getSession();
  if (!canAccessHubAdmin(session, hubSlug)) {
    redirect("/platform/sign-in");
  }
  return session;
}

function statusTone(status) {
  if (status === "registered") return "success";
  if (status === "waitlisted") return "warning";
  return "danger";
}

function paymentTone(status) {
  if (status === "paid") return "success";
  if (status === "unpaid") return "warning";
  return "neutral";
}

function attendanceTone(status) {
  if (status === "attended") return "success";
  if (status === "no-show") return "danger";
  return "neutral";
}

async function promoteAction(formData) {
  "use server";

  const { hubSlug, eventId, registrationId } = validateRegistrationRouteInput({
    hubSlug: formData.get("hubSlug"),
    eventId: formData.get("eventId"),
    registrationId: formData.get("registrationId"),
  });

  const session = await requireHubAccess(hubSlug);
  const hub = await getHubBySlug(hubSlug);
  if (!hub) redirect("/platform/hubs");

  try {
    await promoteWaitlistedRegistration(hub.id, eventId, registrationId, session?.uid || "local-admin");
    redirect(`/${hubSlug}/admin/events/${eventId}/registrations?success=promoted`);
  } catch (error) {
    const message = encodeURIComponent(error?.message || "Unable to promote registration.");
    redirect(`/${hubSlug}/admin/events/${eventId}/registrations?error=${message}`);
  }
}

async function cancelAction(formData) {
  "use server";

  const { hubSlug, eventId, registrationId } = validateRegistrationRouteInput({
    hubSlug: formData.get("hubSlug"),
    eventId: formData.get("eventId"),
    registrationId: formData.get("registrationId"),
  });

  const session = await requireHubAccess(hubSlug);
  const hub = await getHubBySlug(hubSlug);
  if (!hub) redirect("/platform/hubs");

  try {
    await cancelRegistration(hub.id, eventId, registrationId, session?.uid || "local-admin");
    redirect(`/${hubSlug}/admin/events/${eventId}/registrations?success=cancelled`);
  } catch (error) {
    const message = encodeURIComponent(error?.message || "Unable to cancel registration.");
    redirect(`/${hubSlug}/admin/events/${eventId}/registrations?error=${message}`);
  }
}

async function updatePaymentAction(formData) {
  "use server";

  const { hubSlug, eventId, registrationId } = validateRegistrationRouteInput({
    hubSlug: formData.get("hubSlug"),
    eventId: formData.get("eventId"),
    registrationId: formData.get("registrationId"),
  });
  const nextPaymentStatus = String(formData.get("paymentStatus") || "").trim();

  const session = await requireHubAccess(hubSlug);
  const hub = await getHubBySlug(hubSlug);
  if (!hub) redirect("/platform/hubs");

  try {
    await updateRegistrationPaymentStatus(hub.id, eventId, registrationId, nextPaymentStatus, session?.uid || "local-admin");
    redirect(`/${hubSlug}/admin/events/${eventId}/registrations?success=payment`);
  } catch (error) {
    const message = encodeURIComponent(error?.message || "Unable to update payment status.");
    redirect(`/${hubSlug}/admin/events/${eventId}/registrations?error=${message}`);
  }
}

async function updateAttendanceAction(formData) {
  "use server";

  const { hubSlug, eventId, registrationId } = validateRegistrationRouteInput({
    hubSlug: formData.get("hubSlug"),
    eventId: formData.get("eventId"),
    registrationId: formData.get("registrationId"),
  });
  const nextAttendanceStatus = String(formData.get("attendanceStatus") || "").trim();

  const session = await requireHubAccess(hubSlug);
  const hub = await getHubBySlug(hubSlug);
  if (!hub) redirect("/platform/hubs");

  try {
    await updateRegistrationAttendanceStatus(
      hub.id,
      eventId,
      registrationId,
      nextAttendanceStatus,
      session?.uid || "local-admin"
    );
    redirect(`/${hubSlug}/admin/events/${eventId}/registrations?success=attendance`);
  } catch (error) {
    const message = encodeURIComponent(error?.message || "Unable to update attendance status.");
    redirect(`/${hubSlug}/admin/events/${eventId}/registrations?error=${message}`);
  }
}

export const dynamic = "force-dynamic";

export default async function EventRegistrationsPage({ params, searchParams }) {
  await requireHubAccess(params.hubSlug);

  const hub = await getHubBySlug(params.hubSlug);
  if (!hub) notFound();

  const event = await getEventById(hub.id, params.eventId);
  if (!event) notFound();

  const search = String(searchParams?.search || "").trim();
  const status = String(searchParams?.status || "all").trim();

  const [rows, stats] = await Promise.all([
    listRegistrationsByEvent(hub.id, event.id, { search, status }),
    getRegistrationStats(hub.id, event.id),
  ]);

  const errorMessage = searchParams?.error ? decodeURIComponent(searchParams.error) : null;
  const success = String(searchParams?.success || "").trim();

  return (
    <section className={styles.root}>
      <PageHeader
        title={`Registrations: ${event.title}`}
        subtitle={`Capacity ${event.capacity} • Registered ${stats.registered} • Waitlisted ${stats.waitlisted}`}
        actions={<Button href={`/${hub.slug}/admin/events/${event.id}`} variant="secondary">Back to event</Button>}
      />

      {errorMessage ? <ErrorState title="Registration action failed" body={errorMessage} variant="compact" /> : null}
      {success ? <Text className={styles.notice}>Registration updates applied.</Text> : null}

      <RegistrationsFilterBar search={search} status={status} />

      <DataTable
        columns={[
          {
            key: "userId",
            label: "User",
            render: (row) => (
              <div className={styles.userCell}>
                <strong>{row.userId}</strong>
                {row.notes ? <span>{row.notes}</span> : null}
              </div>
            ),
          },
          {
            key: "status",
            label: "Registration",
            render: (row) => <Badge tone={statusTone(row.status)}>{row.status}</Badge>,
          },
          {
            key: "paymentStatus",
            label: "Payment",
            render: (row) => (
              <div className={styles.inlineActions}>
                <Badge tone={paymentTone(row.paymentStatus)}>{row.paymentStatus}</Badge>
                {event.pricingMode === "paid" && row.status !== "cancelled" ? (
                  <form action={updatePaymentAction} className={styles.inlineForm}>
                    <input type="hidden" name="hubSlug" value={hub.slug} />
                    <input type="hidden" name="eventId" value={event.id} />
                    <input type="hidden" name="registrationId" value={row.id} />
                    <Button type="submit" size="sm" variant="tertiary" name="paymentStatus" value="unpaid">Unpaid</Button>
                    <Button type="submit" size="sm" variant="tertiary" name="paymentStatus" value="paid">Paid</Button>
                  </form>
                ) : null}
              </div>
            ),
          },
          {
            key: "attendanceStatus",
            label: "Attendance",
            render: (row) => (
              <div className={styles.inlineActions}>
                <Badge tone={attendanceTone(row.attendanceStatus)}>{row.attendanceStatus}</Badge>
                {row.status === "registered" ? (
                  <form action={updateAttendanceAction} className={styles.inlineForm}>
                    <input type="hidden" name="hubSlug" value={hub.slug} />
                    <input type="hidden" name="eventId" value={event.id} />
                    <input type="hidden" name="registrationId" value={row.id} />
                    <Button type="submit" size="sm" variant="tertiary" name="attendanceStatus" value="attended">Attended</Button>
                    <Button type="submit" size="sm" variant="tertiary" name="attendanceStatus" value="no-show">No-show</Button>
                    <Button type="submit" size="sm" variant="tertiary" name="attendanceStatus" value="unknown">Reset</Button>
                  </form>
                ) : null}
              </div>
            ),
          },
          {
            key: "actions",
            label: "Actions",
            render: (row) => (
              <div className={styles.inlineActions}>
                {row.status === "waitlisted" ? (
                  <form action={promoteAction}>
                    <input type="hidden" name="hubSlug" value={hub.slug} />
                    <input type="hidden" name="eventId" value={event.id} />
                    <input type="hidden" name="registrationId" value={row.id} />
                    <Button type="submit" size="sm" variant="secondary">Promote</Button>
                  </form>
                ) : null}
                {row.status !== "cancelled" ? (
                  <CancelRegistrationButton
                    hubSlug={hub.slug}
                    eventId={event.id}
                    registrationId={row.id}
                    cancelAction={cancelAction}
                  />
                ) : null}
              </div>
            ),
          },
        ]}
        rows={rows}
        empty={
          <EmptyState
            title="No registrations"
            body={search || status !== "all" ? "No registrations match this filter." : "No one has registered yet."}
          />
        }
      />
    </section>
  );
}
