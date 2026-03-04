import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import PageHeader from "@/components/patterns/page-header/PageHeader";
import DataTable from "@/components/patterns/data-table/DataTable";
import Field from "@/components/ui/form/field/Field";
import Input from "@/components/ui/form/input/Input";
import Select from "@/components/ui/form/select/Select";
import Button from "@/components/ui/button/Button";
import ErrorState from "@/components/ui/error-state/ErrorState";
import { requireSessionRole } from "@/lib/auth/guards";
import { getHubById, updateHub } from "@/lib/data/hubs/hub-repository";
import { listFooterSectionOptions, listHeaderSectionOptions } from "@/lib/data/pages/layout-config";
import { createPage, listPagesByHub } from "@/lib/data/pages/page-repository";
import { validateCreatePageInput } from "@/lib/validation/pages";
import styles from "./page.module.css";

function rethrowIfRedirectError(error) {
  if (String(error?.digest || "").startsWith("NEXT_REDIRECT")) {
    throw error;
  }
}

async function createPageAction(formData) {
  "use server";

  const session = await requireSessionRole("superadmin", "/platform/sign-in");
  const hubId = String(formData.get("hubId") || "").trim();

  try {
    const payload = validateCreatePageInput({
      title: formData.get("title"),
      slug: formData.get("slug"),
      status: "draft",
      seo: {
        title: "",
        description: "",
        imageMediaId: "",
      },
      parentPageId: "",
      headerIdOverride: "",
      footerIdOverride: "",
      draftComposition: [],
      publishedComposition: [],
    });

    const page = await createPage(hubId, payload, session?.uid || "local-superadmin");
    redirect(`/platform/hubs/${hubId}/cms/${page.id}`);
  } catch (error) {
    rethrowIfRedirectError(error);
    const message = encodeURIComponent(error?.message || "Unable to create page.");
    redirect(`/platform/hubs/${hubId}/cms?error=${message}`);
  }
}

async function updateHubLayoutAction(formData) {
  "use server";

  await requireSessionRole("superadmin", "/platform/sign-in");
  const hubId = String(formData.get("hubId") || "").trim();
  const globalHeaderId = String(formData.get("globalHeaderId") || "").trim();
  const globalFooterId = String(formData.get("globalFooterId") || "").trim();

  try {
    await updateHub(hubId, { globalHeaderId, globalFooterId });
    redirect(`/platform/hubs/${hubId}/cms?success=layoutSaved`);
  } catch (error) {
    rethrowIfRedirectError(error);
    const message = encodeURIComponent(error?.message || "Unable to save layout defaults.");
    redirect(`/platform/hubs/${hubId}/cms?error=${message}`);
  }
}

export const dynamic = "force-dynamic";

export default async function HubCmsPagesPage({ params, searchParams }) {
  await requireSessionRole("superadmin", "/platform/sign-in");
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const hub = await getHubById(resolvedParams?.hubId);
  if (!hub) notFound();

  const pages = await listPagesByHub(hub.id);
  const errorMessage = resolvedSearchParams?.error ? decodeURIComponent(resolvedSearchParams.error) : null;
  const success = String(resolvedSearchParams?.success || "").trim();
  const headerOptions = listHeaderSectionOptions();
  const footerOptions = listFooterSectionOptions();

  return (
    <section className={styles.root}>
      <PageHeader
        title={`${hub.name} CMS Pages`}
        subtitle="Create and manage custom pages. Home/events/contact remain system routes."
      />

      {errorMessage ? <ErrorState title="CMS action failed" body={errorMessage} variant="compact" /> : null}
      {success ? <p className={styles.notice}>Layout defaults saved.</p> : null}

      <form action={updateHubLayoutAction} className={styles.globalLayoutForm}>
        <input type="hidden" name="hubId" value={hub.id} />
        <Field id="globalHeaderId" label="Global header">
          <Select
            id="globalHeaderId"
            name="globalHeaderId"
            defaultValue={hub.globalHeaderId}
            options={headerOptions}
            placeholder="Select header variant"
          />
        </Field>
        <Field id="globalFooterId" label="Global footer">
          <Select
            id="globalFooterId"
            name="globalFooterId"
            defaultValue={hub.globalFooterId}
            options={footerOptions}
            placeholder="Select footer variant"
          />
        </Field>
        <Button type="submit" variant="secondary">Save global header/footer</Button>
      </form>

      <form action={createPageAction} className={styles.createForm}>
        <input type="hidden" name="hubId" value={hub.id} />
        <Field id="title" label="Page title" required>
          <Input id="title" name="title" required placeholder="About our programs" />
        </Field>
        <Field id="slug" label="Page slug" required>
          <Input id="slug" name="slug" required placeholder="about-programs" />
        </Field>
        <Button type="submit">Create page draft</Button>
      </form>

      <DataTable
        rows={pages}
        columns={[
          { key: "title", label: "Title" },
          { key: "slug", label: "Slug" },
          { key: "status", label: "Status" },
          {
            key: "updatedAt",
            label: "Updated",
            render: (row) => (row.updatedAt ? new Date(row.updatedAt).toLocaleString() : "-")
          },
          {
            key: "actions",
            label: "Actions",
            render: (row) => (
              <div className={styles.actions}>
                <Link href={`/platform/hubs/${hub.id}/cms/${row.id}`}>Edit</Link>
                <Link href={`/platform/hubs/${hub.id}/cms/${row.id}/preview`}>Preview draft</Link>
                <Link href={`/${hub.slug}/pages/${row.slug}`}>Live route</Link>
              </div>
            ),
          },
        ]}
      />
    </section>
  );
}
