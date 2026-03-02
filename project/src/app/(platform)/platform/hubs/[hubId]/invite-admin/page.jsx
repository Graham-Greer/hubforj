import { notFound, redirect } from "next/navigation";
import PageHeader from "@/components/patterns/page-header/PageHeader";
import Field from "@/components/ui/form/field/Field";
import Input from "@/components/ui/form/input/Input";
import Button from "@/components/ui/button/Button";
import DataTable from "@/components/patterns/data-table/DataTable";
import { requireSessionRole } from "@/lib/auth/guards";
import { getHubById } from "@/lib/data/hubs/hub-repository";
import { createInvite, listInvites, revokeInvite } from "@/lib/data/hubs/invite-repository";
import { validateInviteInput, validateInviteRouteInput } from "@/lib/validation/invites";
import ErrorState from "@/components/ui/error-state/ErrorState";
import styles from "./page.module.css";

async function createInviteAction(formData) {
  "use server";

  await requireSessionRole("superadmin", "/platform/sign-in");
  const { hubId } = validateInviteRouteInput({ hubId: formData.get("hubId") });
  const payload = validateInviteInput({ email: formData.get("email") });

  try {
    await createInvite(hubId, payload, "local-superadmin");
  } catch (error) {
    const message = encodeURIComponent(error?.message || "Unable to create invite.");
    redirect(`/platform/hubs/${hubId}/invite-admin?error=${message}`);
  }
  redirect(`/platform/hubs/${hubId}/invite-admin`);
}

async function revokeInviteAction(formData) {
  "use server";

  await requireSessionRole("superadmin", "/platform/sign-in");
  const { hubId, inviteId } = validateInviteRouteInput({
    hubId: formData.get("hubId"),
    inviteId: formData.get("inviteId"),
  });

  await revokeInvite(hubId, inviteId);
  redirect(`/platform/hubs/${hubId}/invite-admin`);
}

export const dynamic = "force-dynamic";

export default async function InviteAdminPage({ params, searchParams }) {
  await requireSessionRole("superadmin", "/platform/sign-in");
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const hub = await getHubById(resolvedParams?.hubId);
  if (!hub) notFound();

  const invites = await listInvites(hub.id);
  const errorMessage = resolvedSearchParams?.error ? decodeURIComponent(resolvedSearchParams.error) : null;

  return (
    <section className={styles.root}>
      <PageHeader title="Invite Hub Admins" subtitle={`Hub: ${hub.name}`} />
      {errorMessage ? <ErrorState title="Invite action failed" body={errorMessage} variant="compact" /> : null}
      <form action={createInviteAction} className={styles.form}>
        <input type="hidden" name="hubId" value={hub.id} />
        <Field id="email" label="Admin email" required>
          <Input id="email" name="email" type="email" required />
        </Field>
        <Button type="submit" intent="brand">Create invite</Button>
      </form>
      <DataTable
        columns={[
          { key: "email", label: "Email" },
          { key: "status", label: "Status" },
          {
            key: "actions",
            label: "Actions",
            render: (row) => (
              <form action={revokeInviteAction}>
                <input type="hidden" name="hubId" value={hub.id} />
                <input type="hidden" name="inviteId" value={row.id} />
                <Button type="submit" variant="tertiary" intent="danger" disabled={row.status !== "pending"}>
                  Revoke
                </Button>
              </form>
            ),
          },
        ]}
        rows={invites}
      />
    </section>
  );
}
