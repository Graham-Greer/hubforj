import { notFound, redirect } from "next/navigation";
import PageHeader from "@/components/patterns/page-header/PageHeader";
import Text from "@/components/primitives/text/Text";
import Button from "@/components/ui/button/Button";
import { requireSessionRole } from "@/lib/auth/guards";
import { getHubById } from "@/lib/data/hubs/hub-repository";
import { setSupportModeContext } from "@/lib/auth/session";
import { validateSupportModeInput } from "@/lib/validation/support-mode";
import { logSupportModeEntered } from "@/lib/auth/support-mode";

async function enterSupportMode(formData) {
  "use server";

  const session = await requireSessionRole("superadmin", "/platform/sign-in");
  const { hubId, hubSlug } = validateSupportModeInput({
    hubId: formData.get("hubId"),
    hubSlug: formData.get("hubSlug"),
  });
  const hub = await getHubById(hubId);
  if (!hub || hub.slug !== hubSlug) {
    redirect("/platform/hubs");
  }

  await setSupportModeContext({
    supportHubId: hubId,
    supportHubSlug: hubSlug,
    supportModeEnteredAt: new Date().toISOString(),
  });
  logSupportModeEntered({ actorUid: session.uid, hubId, hubSlug });

  redirect(`/${hubSlug}/admin`);
}

export default async function SupportModePage({ params }) {
  await requireSessionRole("superadmin", "/platform/sign-in");
  const resolvedParams = await params;
  const hub = await getHubById(resolvedParams?.hubId);

  if (!hub) notFound();

  return (
    <section>
      <PageHeader title="Support Mode" subtitle={`Hub: ${hub.name}`} />
      <Text tone="secondary">Entering support mode adds explicit session context and redirects to this hub admin surface.</Text>
      <form action={enterSupportMode}>
        <input type="hidden" name="hubId" value={hub.id} />
        <input type="hidden" name="hubSlug" value={hub.slug} />
        <Button type="submit" intent="brand">Enter Support Mode</Button>
      </form>
    </section>
  );
}
