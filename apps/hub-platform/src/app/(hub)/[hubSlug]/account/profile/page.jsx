import { Suspense } from "react";
import MemberAvatarEditor from "./MemberAvatarEditor";
import MemberProfileForm from "./MemberProfileForm";
import { MemberProfileFallback } from "@/components/patterns/member-account-fallbacks";
import MemberProfileWorkspace from "@/components/patterns/member-profile-workspace/MemberProfileWorkspace";
import PageHeader from "@/components/patterns/page-header/PageHeader";
import { requireCurrentMemberSessionForHub } from "@/lib/auth/member-session";
import { requireHubBySlug } from "@/lib/data/hubs";
import styles from "../accountRoute.module.css";

async function ProfileContent({ hub }) {
  const memberSession = await requireCurrentMemberSessionForHub(hub, `/${hub.slug}/account/profile`);

  return (
    <MemberProfileWorkspace
      hub={hub}
      member={memberSession.user}
      avatarEditor={<MemberAvatarEditor hubId={hub.id} member={memberSession.user} />}
      form={<MemberProfileForm hubSlug={hub.slug} member={memberSession.user} />}
      showHeader={false}
    />
  );
}

export default async function ProfilePage({ params }) {
  const { hubSlug } = await params;
  const hub = await requireHubBySlug(hubSlug);

  return (
    <div className={styles.routeStack}>
      <PageHeader
        eyebrow="Member account"
        title="Profile"
        description="Review your account details and update the basics we currently support."
      />
      <Suspense fallback={<MemberProfileFallback />}>
        <ProfileContent hub={hub} />
      </Suspense>
    </div>
  );
}
