import MemberAccountShell from "@/components/patterns/member-account-shell/MemberAccountShell";
import SectionContainer from "@/components/sections/section-container/SectionContainer";
import SectionShell from "@/components/sections/section-shell/SectionShell";
import { requireCurrentMemberSessionForHub } from "@/lib/auth/member-session";
import { requireHubBySlug } from "@/lib/data/hubs";
import { notFound } from "next/navigation";

export default async function AccountLayout({ children, params }) {
  const { hubSlug } = await params;
  let hub;

  try {
    hub = await requireHubBySlug(hubSlug);
  } catch {
    notFound();
  }

  await requireCurrentMemberSessionForHub(hub);

  return (
    <SectionShell surface="transparent" spacing="default">
      <SectionContainer width="default">
        <MemberAccountShell hub={hub}>{children}</MemberAccountShell>
      </SectionContainer>
    </SectionShell>
  );
}
