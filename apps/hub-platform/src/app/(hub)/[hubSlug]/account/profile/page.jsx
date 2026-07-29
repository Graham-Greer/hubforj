import MemberAvatarEditor from "./MemberAvatarEditor";
import MemberProfileForm from "./MemberProfileForm";
import MemberProfileWorkspace from "@/components/patterns/member-profile-workspace/MemberProfileWorkspace";
import { requireCurrentMemberSessionForHub } from "@/lib/auth/member-session";
import { requireHubBySlug } from "@/lib/data/hubs";

export default async function ProfilePage({ params }) {
  const { hubSlug } = await params;
  const hub = await requireHubBySlug(hubSlug);
  const memberSession = await requireCurrentMemberSessionForHub(hub, `/${hub.slug}/account/profile`);

  return (
    <MemberProfileWorkspace
      hub={hub}
      member={memberSession.user}
      avatarEditor={<MemberAvatarEditor hubId={hub.id} member={memberSession.user} />}
      form={<MemberProfileForm hubSlug={hub.slug} member={memberSession.user} />}
    />
  );
}
