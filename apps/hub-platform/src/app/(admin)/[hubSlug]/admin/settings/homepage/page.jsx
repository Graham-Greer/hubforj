import { redirect } from "next/navigation";

export default async function HomepageSettingsPage({ params }) {
  const { hubSlug } = await params;
  redirect(`/${hubSlug}/admin/settings/pages/home`);
}
