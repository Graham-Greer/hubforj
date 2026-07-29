import { redirect } from "next/navigation";
import { requireHubBySlug } from "@/lib/data/hubs";

export default async function UsefulLinksSettingsPage({ params }) {
  const { hubSlug } = await params;
  const hub = await requireHubBySlug(hubSlug);
  redirect(`/${hub.slug}/admin/settings/legal`);
}
