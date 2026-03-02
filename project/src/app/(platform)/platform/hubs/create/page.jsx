import { redirect } from "next/navigation";
import PageHeader from "@/components/patterns/page-header/PageHeader";
import Field from "@/components/ui/form/field/Field";
import Input from "@/components/ui/form/input/Input";
import Textarea from "@/components/ui/form/textarea/Textarea";
import Checkbox from "@/components/ui/form/checkbox/Checkbox";
import Button from "@/components/ui/button/Button";
import ErrorState from "@/components/ui/error-state/ErrorState";
import { requireSessionRole } from "@/lib/auth/guards";
import { createHub } from "@/lib/data/hubs/hub-repository";
import { validateCreateHubInput } from "@/lib/validation/hubs";
import styles from "./page.module.css";

async function createHubAction(formData) {
  "use server";

  await requireSessionRole("superadmin", "/platform/sign-in");

  try {
    const payload = validateCreateHubInput({
      name: formData.get("name"),
      slug: formData.get("slug"),
      templateKey: formData.get("templateKey"),
      tokenOverrides: formData.get("tokenOverrides"),
      customDomains: formData.get("customDomains"),
      features: {
        cmsPages: formData.get("cmsPages") === "on",
        stripePayments: formData.get("stripePayments") === "on",
        emailNotifications: formData.get("emailNotifications") === "on",
      },
    });

    const hub = await createHub(payload, "local-superadmin");
    redirect(`/platform/hubs/${hub.id}`);
  } catch (error) {
    const message = encodeURIComponent(error?.message || "Unable to create hub.");
    redirect(`/platform/hubs/create?error=${message}`);
  }
}

export default async function CreateHubPage({ searchParams }) {
  await requireSessionRole("superadmin", "/platform/sign-in");
  const errorMessage = searchParams?.error ? decodeURIComponent(searchParams.error) : null;

  return (
    <section className={styles.root}>
      <PageHeader title="Create Hub" subtitle="Provision a new tenant hub." />
      {errorMessage ? <ErrorState title="Hub create failed" body={errorMessage} variant="compact" /> : null}
      <form action={createHubAction} className={styles.form}>
        <Field id="name" label="Hub name" required>
          <Input id="name" name="name" required />
        </Field>
        <Field id="slug" label="Hub slug" required>
          <Input id="slug" name="slug" required />
        </Field>
        <Field id="templateKey" label="Template key">
          <Input id="templateKey" name="templateKey" defaultValue="templateA" />
        </Field>
        <Field
          id="tokenOverrides"
          label="Token overrides (JSON)"
          hint='Use CSS variable keys. Example: { "--link": "#0ea5e9", "templateA": { "--bg": "#ffffff" } }'
        >
          <Textarea id="tokenOverrides" name="tokenOverrides" rows={6} defaultValue="{}" />
        </Field>
        <Field
          id="customDomains"
          label="Custom domains"
          hint="One domain per line. Public/member surfaces only."
        >
          <Textarea id="customDomains" name="customDomains" rows={4} placeholder={"community.example.com\nmembers.example.com"} />
        </Field>
        <div className={styles.flags}>
          <Checkbox label="CMS pages" name="cmsPages" />
          <Checkbox label="Stripe payments" name="stripePayments" />
          <Checkbox label="Email notifications" name="emailNotifications" />
        </div>
        <Button type="submit" intent="brand">Create hub</Button>
      </form>
    </section>
  );
}
