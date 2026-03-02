import { notFound, redirect } from "next/navigation";
import PageHeader from "@/components/patterns/page-header/PageHeader";
import DataTable from "@/components/patterns/data-table/DataTable";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import EmptyState from "@/components/ui/empty-state/EmptyState";
import ErrorState from "@/components/ui/error-state/ErrorState";
import Field from "@/components/ui/form/field/Field";
import Input from "@/components/ui/form/input/Input";
import Select from "@/components/ui/form/select/Select";
import Text from "@/components/primitives/text/Text";
import { canAccessHubAdmin } from "@/lib/auth/guards";
import { getSession } from "@/lib/auth/session";
import { getHubBySlug } from "@/lib/data/hubs/hub-repository";
import {
  createMembershipPlan,
  deleteMembershipPlan,
  listMembershipPlansByHub,
  updateMembershipPlan,
} from "@/lib/data/memberships/membership-plan-repository";
import {
  createMembership,
  listMembershipsByHub,
  markMembershipPaymentStatus,
  renewMembership,
  transitionMembershipStatus,
} from "@/lib/data/memberships/membership-repository";
import {
  validateCreateMembershipInput,
  validateMembershipPaymentStatus,
  validateMembershipPlanInput,
  validateMembershipRouteInput,
} from "@/lib/validation/memberships";
import CancelMembershipButton from "./_components/CancelMembershipButton";
import DeletePlanButton from "./_components/DeletePlanButton";
import MembershipPlanEditor from "./_components/MembershipPlanEditor";
import MembershipsFilterBar from "./_components/MembershipsFilterBar";
import styles from "./page.module.css";

async function requireHubAccess(hubSlug) {
  const session = await getSession();
  if (!canAccessHubAdmin(session, hubSlug)) {
    redirect("/platform/sign-in");
  }
  return session;
}

function statusTone(status) {
  if (status === "active") return "success";
  if (status === "pending") return "warning";
  if (status === "expired") return "danger";
  if (status === "inactive") return "neutral";
  return "danger";
}

function paymentTone(status) {
  if (status === "paid") return "success";
  if (status === "unpaid") return "warning";
  return "neutral";
}

async function savePlanAction(formData) {
  "use server";

  const hubSlug = String(formData.get("hubSlug") || "").trim();
  const planId = String(formData.get("planId") || "").trim();
  const session = await requireHubAccess(hubSlug);

  const hub = await getHubBySlug(hubSlug);
  if (!hub) redirect("/platform/hubs");

  try {
    const payload = validateMembershipPlanInput({
      title: formData.get("title"),
      description: formData.get("description"),
      durationUnit: formData.get("durationUnit"),
      durationValue: formData.get("durationValue"),
      price: formData.get("price"),
      active: formData.get("active") === "true",
    });

    if (planId) {
      await updateMembershipPlan(hub.id, planId, payload, session?.uid || "local-admin");
    } else {
      await createMembershipPlan(hub.id, payload, session?.uid || "local-admin");
    }

    redirect(`/${hubSlug}/admin/membership-plans?success=planSaved`);
  } catch (error) {
    const message = encodeURIComponent(error?.message || "Unable to save membership plan.");
    redirect(`/${hubSlug}/admin/membership-plans?error=${message}`);
  }
}

async function deletePlanAction(formData) {
  "use server";

  const hubSlug = String(formData.get("hubSlug") || "").trim();
  const planId = String(formData.get("planId") || "").trim();
  await requireHubAccess(hubSlug);

  const hub = await getHubBySlug(hubSlug);
  if (!hub) redirect("/platform/hubs");

  await deleteMembershipPlan(hub.id, planId);
  redirect(`/${hubSlug}/admin/membership-plans?success=planDeleted`);
}

async function createMembershipAction(formData) {
  "use server";

  const hubSlug = String(formData.get("hubSlug") || "").trim();
  const session = await requireHubAccess(hubSlug);
  const hub = await getHubBySlug(hubSlug);
  if (!hub) redirect("/platform/hubs");

  try {
    const payload = validateCreateMembershipInput({
      userId: formData.get("userId"),
      planId: formData.get("planId"),
      startDate: formData.get("startDate"),
    });

    await createMembership(
      hub.id,
      payload,
      { stripeEnabled: Boolean(hub.features?.stripePayments) },
      session?.uid || "local-admin"
    );

    redirect(`/${hubSlug}/admin/membership-plans?success=membershipCreated`);
  } catch (error) {
    const message = encodeURIComponent(error?.message || "Unable to create membership.");
    redirect(`/${hubSlug}/admin/membership-plans?error=${message}`);
  }
}

async function updatePaymentAction(formData) {
  "use server";

  const { hubSlug, membershipId } = validateMembershipRouteInput({
    hubSlug: formData.get("hubSlug"),
    membershipId: formData.get("membershipId"),
  });

  const nextPaymentStatus = validateMembershipPaymentStatus(formData.get("paymentStatus"));
  const session = await requireHubAccess(hubSlug);
  const hub = await getHubBySlug(hubSlug);
  if (!hub) redirect("/platform/hubs");

  try {
    await markMembershipPaymentStatus(hub.id, membershipId, nextPaymentStatus, session?.uid || "local-admin");
    redirect(`/${hubSlug}/admin/membership-plans?success=paymentUpdated`);
  } catch (error) {
    const message = encodeURIComponent(error?.message || "Unable to update payment status.");
    redirect(`/${hubSlug}/admin/membership-plans?error=${message}`);
  }
}

async function renewMembershipAction(formData) {
  "use server";

  const { hubSlug, membershipId } = validateMembershipRouteInput({
    hubSlug: formData.get("hubSlug"),
    membershipId: formData.get("membershipId"),
  });

  const session = await requireHubAccess(hubSlug);
  const hub = await getHubBySlug(hubSlug);
  if (!hub) redirect("/platform/hubs");

  try {
    await renewMembership(hub.id, membershipId, session?.uid || "local-admin");
    redirect(`/${hubSlug}/admin/membership-plans?success=membershipRenewed`);
  } catch (error) {
    const message = encodeURIComponent(error?.message || "Unable to renew membership.");
    redirect(`/${hubSlug}/admin/membership-plans?error=${message}`);
  }
}

async function transitionMembershipAction(formData) {
  "use server";

  const { hubSlug, membershipId } = validateMembershipRouteInput({
    hubSlug: formData.get("hubSlug"),
    membershipId: formData.get("membershipId"),
  });

  const nextStatus = String(formData.get("nextStatus") || "").trim();
  const session = await requireHubAccess(hubSlug);
  const hub = await getHubBySlug(hubSlug);
  if (!hub) redirect("/platform/hubs");

  try {
    await transitionMembershipStatus(hub.id, membershipId, nextStatus, session?.uid || "local-admin");
    redirect(`/${hubSlug}/admin/membership-plans?success=statusUpdated`);
  } catch (error) {
    const message = encodeURIComponent(error?.message || "Unable to update membership status.");
    redirect(`/${hubSlug}/admin/membership-plans?error=${message}`);
  }
}

async function cancelMembershipAction(formData) {
  "use server";

  const { hubSlug, membershipId } = validateMembershipRouteInput({
    hubSlug: formData.get("hubSlug"),
    membershipId: formData.get("membershipId"),
  });

  const session = await requireHubAccess(hubSlug);
  const hub = await getHubBySlug(hubSlug);
  if (!hub) redirect("/platform/hubs");

  try {
    await transitionMembershipStatus(hub.id, membershipId, "cancelled", session?.uid || "local-admin");
    redirect(`/${hubSlug}/admin/membership-plans?success=membershipCancelled`);
  } catch (error) {
    const message = encodeURIComponent(error?.message || "Unable to cancel membership.");
    redirect(`/${hubSlug}/admin/membership-plans?error=${message}`);
  }
}

export const dynamic = "force-dynamic";

export default async function AdminMembershipPlansPage({ params, searchParams }) {
  await requireHubAccess(params.hubSlug);

  const hub = await getHubBySlug(params.hubSlug);
  if (!hub) notFound();

  const search = String(searchParams?.search || "").trim();
  const status = String(searchParams?.status || "all").trim();
  const paymentStatus = String(searchParams?.paymentStatus || "all").trim();
  const editPlanId = String(searchParams?.editPlan || "").trim();

  const [plans, memberships] = await Promise.all([
    listMembershipPlansByHub(hub.id),
    listMembershipsByHub(hub.id, { search, status, paymentStatus }),
  ]);

  const planById = new Map(plans.map((plan) => [plan.id, plan]));
  const editPlan = editPlanId ? planById.get(editPlanId) : null;

  const errorMessage = searchParams?.error ? decodeURIComponent(searchParams.error) : null;
  const success = String(searchParams?.success || "").trim();

  return (
    <section className={styles.root}>
      <PageHeader
        title="Membership Plans + Lifecycle"
        subtitle="Manage plans, offline payment states, renewals, and status transitions."
      />

      {errorMessage ? <ErrorState title="Membership action failed" body={errorMessage} variant="compact" /> : null}
      {success ? <Text className={styles.notice}>Membership updates applied.</Text> : null}

      <div className={styles.sectionGrid}>
        <div className={styles.panel}>
          <Text as="h2" weight="semibold">{editPlan ? "Edit plan" : "Create plan"}</Text>
          <MembershipPlanEditor
            action={savePlanAction}
            hubSlug={hub.slug}
            defaults={editPlan || {
              id: "",
              title: "",
              description: "",
              durationUnit: "months",
              durationValue: 1,
              price: 0,
              active: true,
            }}
          />
        </div>

        <div className={styles.panel}>
          <Text as="h2" weight="semibold">Create membership</Text>
          <form action={createMembershipAction} className={styles.createMembershipForm}>
            <input type="hidden" name="hubSlug" value={hub.slug} />
            <Field id="userId" label="User ID" required>
              <Input id="userId" name="userId" required placeholder="member_123" />
            </Field>
            <Field id="planId" label="Plan" required>
              <Select
                id="planId"
                name="planId"
                required
                defaultValue=""
                options={plans.map((plan) => ({ value: plan.id, label: `${plan.title} (${plan.durationValue} ${plan.durationUnit})` }))}
                placeholder="Select a membership plan"
              />
            </Field>
            <Field id="startDate" label="Start date (optional)">
              <Input id="startDate" name="startDate" type="datetime-local" />
            </Field>
            <Button type="submit">Create membership</Button>
          </form>
          <Text size="sm" tone="secondary">
            Stripe payments {hub.features?.stripePayments ? "enabled" : "disabled"}. Offline paid/unpaid admin actions stay available.
          </Text>
        </div>
      </div>

      <DataTable
        columns={[
          { key: "title", label: "Title" },
          {
            key: "duration",
            label: "Duration",
            render: (row) => `${row.durationValue} ${row.durationUnit}`,
          },
          { key: "price", label: "Price", render: (row) => `$${Number(row.price).toFixed(2)}` },
          { key: "active", label: "Active", render: (row) => <Badge tone={row.active ? "success" : "neutral"}>{row.active ? "yes" : "no"}</Badge> },
          {
            key: "actions",
            label: "Actions",
            render: (row) => (
              <div className={styles.inlineActions}>
                <Button href={`/${hub.slug}/admin/membership-plans?editPlan=${row.id}`} size="sm" variant="secondary">Edit</Button>
                <DeletePlanButton hubSlug={hub.slug} planId={row.id} action={deletePlanAction} />
              </div>
            ),
          },
        ]}
        rows={plans}
        empty={<EmptyState title="No membership plans" body="Create a plan to begin member onboarding." />}
      />

      <MembershipsFilterBar search={search} status={status} paymentStatus={paymentStatus} />

      <DataTable
        columns={[
          {
            key: "userId",
            label: "Member",
            render: (row) => (
              <div className={styles.memberCell}>
                <strong>{row.userId}</strong>
                <span>{planById.get(row.planId)?.title || row.planId}</span>
              </div>
            ),
          },
          {
            key: "status",
            label: "Status",
            render: (row) => <Badge tone={statusTone(row.status)}>{row.status}</Badge>,
          },
          {
            key: "paymentStatus",
            label: "Payment",
            render: (row) => <Badge tone={paymentTone(row.paymentStatus)}>{row.paymentStatus}</Badge>,
          },
          {
            key: "renewalDate",
            label: "Renewal",
            render: (row) => new Date(row.renewalDate).toLocaleDateString(),
          },
          {
            key: "actions",
            label: "Actions",
            render: (row) => (
              <div className={styles.inlineActions}>
                {row.paymentStatus !== "not-required" ? (
                  <>
                    <form action={updatePaymentAction}>
                      <input type="hidden" name="hubSlug" value={hub.slug} />
                      <input type="hidden" name="membershipId" value={row.id} />
                      <Button type="submit" name="paymentStatus" value="paid" size="sm" variant="tertiary">Mark paid</Button>
                    </form>
                    <form action={updatePaymentAction}>
                      <input type="hidden" name="hubSlug" value={hub.slug} />
                      <input type="hidden" name="membershipId" value={row.id} />
                      <Button type="submit" name="paymentStatus" value="unpaid" size="sm" variant="tertiary">Mark unpaid</Button>
                    </form>
                  </>
                ) : null}

                {row.status !== "cancelled" ? (
                  <form action={renewMembershipAction}>
                    <input type="hidden" name="hubSlug" value={hub.slug} />
                    <input type="hidden" name="membershipId" value={row.id} />
                    <Button type="submit" size="sm" variant="secondary">Renew</Button>
                  </form>
                ) : null}

                {row.status === "active" ? (
                  <form action={transitionMembershipAction}>
                    <input type="hidden" name="hubSlug" value={hub.slug} />
                    <input type="hidden" name="membershipId" value={row.id} />
                    <input type="hidden" name="nextStatus" value="inactive" />
                    <Button type="submit" size="sm" variant="tertiary">Deactivate</Button>
                  </form>
                ) : null}

                {(row.status === "inactive" || row.status === "expired" || row.status === "pending") ? (
                  <form action={transitionMembershipAction}>
                    <input type="hidden" name="hubSlug" value={hub.slug} />
                    <input type="hidden" name="membershipId" value={row.id} />
                    <input type="hidden" name="nextStatus" value="active" />
                    <Button type="submit" size="sm" variant="tertiary">Activate</Button>
                  </form>
                ) : null}

                {row.status !== "cancelled" ? (
                  <CancelMembershipButton hubSlug={hub.slug} membershipId={row.id} action={cancelMembershipAction} />
                ) : null}
              </div>
            ),
          },
        ]}
        rows={memberships}
        empty={<EmptyState title="No memberships" body="Create a membership from an active plan." />}
      />
    </section>
  );
}
