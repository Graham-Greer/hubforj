import { notFound, redirect } from "next/navigation";
import PageHeader from "@/components/patterns/page-header/PageHeader";
import Field from "@/components/ui/form/field/Field";
import Input from "@/components/ui/form/input/Input";
import Select from "@/components/ui/form/select/Select";
import Textarea from "@/components/ui/form/textarea/Textarea";
import Checkbox from "@/components/ui/form/checkbox/Checkbox";
import Button from "@/components/ui/button/Button";
import ErrorState from "@/components/ui/error-state/ErrorState";
import DomainListManager from "@/components/patterns/domain-list-manager/DomainListManager";
import { requireSessionRole } from "@/lib/auth/guards";
import { getHubById, updateHub } from "@/lib/data/hubs/hub-repository";
import { listFooterSectionOptions, listHeaderSectionOptions } from "@/lib/data/pages/layout-config";
import { validateUpdateHubInput } from "@/lib/validation/hubs";
import styles from "./page.module.css";

async function updateHubAction(formData) {
  "use server";

  await requireSessionRole("superadmin", "/platform/sign-in");
  const hubId = String(formData.get("hubId") || "").trim();

  try {
    const patch = validateUpdateHubInput({
      name: formData.get("name"),
      slug: formData.get("slug"),
      templateKey: formData.get("templateKey"),
      tokenOverrides: formData.get("tokenOverrides"),
      globalHeaderId: formData.get("globalHeaderId"),
      globalFooterId: formData.get("globalFooterId"),
      customDomains: formData.get("customDomains"),
      features: {
        cmsPages: formData.get("cmsPages") === "on",
        stripePayments: formData.get("stripePayments") === "on",
        emailNotifications: formData.get("emailNotifications") === "on",
      },
    });

    await updateHub(hubId, patch);
    redirect(`/platform/hubs/${hubId}`);
  } catch (error) {
    const message = encodeURIComponent(error?.message || "Unable to update hub.");
    redirect(`/platform/hubs/${hubId}?error=${message}`);
  }
}

async function removeDomainAction(formData) {
  "use server";

  await requireSessionRole("superadmin", "/platform/sign-in");
  const hubId = String(formData.get("hubId") || "").trim();
  const domain = String(formData.get("domain") || "").trim();
  const hub = await getHubById(hubId);
  if (!hub) redirect("/platform/hubs");

  const nextDomains = (hub.customDomains || []).filter((item) => item !== domain);
  try {
    await updateHub(hubId, { customDomains: nextDomains });
    redirect(`/platform/hubs/${hubId}`);
  } catch (error) {
    const message = encodeURIComponent(error?.message || "Unable to remove custom domain.");
    redirect(`/platform/hubs/${hubId}?error=${message}`);
  }
}

export const dynamic = "force-dynamic";

export default async function HubDetailPage({ params, searchParams }) {
  await requireSessionRole("superadmin", "/platform/sign-in");
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const hub = await getHubById(resolvedParams?.hubId);
  const errorMessage = resolvedSearchParams?.error ? decodeURIComponent(resolvedSearchParams.error) : null;

  if (!hub) notFound();
  const headerOptions = listHeaderSectionOptions();
  const footerOptions = listFooterSectionOptions();

  return (
    <section className={styles.root}>
      <PageHeader title={hub.name} subtitle="Hub configuration" />
      {errorMessage ? <ErrorState title="Hub update failed" body={errorMessage} variant="compact" /> : null}
      <form action={updateHubAction} className={styles.form}>
        <input type="hidden" name="hubId" value={hub.id} />
        <Field id="name" label="Hub name" required>
          <Input id="name" name="name" defaultValue={hub.name} required />
        </Field>
        <Field id="slug" label="Hub slug" required>
          <Input id="slug" name="slug" defaultValue={hub.slug} required />
        </Field>
        <Field id="templateKey" label="Template key">
          <Input id="templateKey" name="templateKey" defaultValue={hub.templateKey} />
        </Field>
        <Field id="globalHeaderId" label="Global header section">
          <Select
            id="globalHeaderId"
            name="globalHeaderId"
            defaultValue={hub.globalHeaderId}
            options={headerOptions}
            placeholder="Select header variant"
          />
        </Field>
        <Field id="globalFooterId" label="Global footer section">
          <Select
            id="globalFooterId"
            name="globalFooterId"
            defaultValue={hub.globalFooterId}
            options={footerOptions}
            placeholder="Select footer variant"
          />
        </Field>
        <Field
          id="tokenOverrides"
          label="Token overrides (JSON)"
          hint='Use CSS variable keys. Example: { "--link": "#0ea5e9", "templateA": { "--bg": "#ffffff" } }'
        >
          <Textarea
            id="tokenOverrides"
            name="tokenOverrides"
            rows={8}
            defaultValue={JSON.stringify(hub.tokenOverrides || {}, null, 2)}
          />
        </Field>
        <Field
          id="customDomains"
          label="Custom domains"
          hint={'One domain per line. Public/member surfaces only. Canonical conflict checks treat "www.example.com" and "example.com" as the same domain.'}
        >
          <Textarea id="customDomains" name="customDomains" rows={4} defaultValue={(hub.customDomains || []).join("\n")} />
        </Field>
        <div className={styles.flags}>
          <Checkbox label="CMS pages" name="cmsPages" defaultChecked={Boolean(hub.features?.cmsPages)} />
          <Checkbox label="Stripe payments" name="stripePayments" defaultChecked={Boolean(hub.features?.stripePayments)} />
          <Checkbox label="Email notifications" name="emailNotifications" defaultChecked={Boolean(hub.features?.emailNotifications)} />
        </div>
        <Button type="submit" intent="brand">Save hub</Button>
      </form>
      <DomainListManager hubId={hub.id} domains={hub.customDomains || []} removeDomainAction={removeDomainAction} />
      <div className={styles.links}>
        <Button href={`/platform/hubs/${hub.id}/invite-admin`} variant="secondary">Manage invites</Button>
        <Button href={`/platform/hubs/${hub.id}/cms`} variant="secondary">CMS pages</Button>
        <Button href={`/platform/support/${hub.id}`} variant="secondary">Enter support mode</Button>
      </div>
    </section>
  );
}
