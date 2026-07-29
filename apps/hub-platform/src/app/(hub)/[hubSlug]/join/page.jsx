import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Button from "@/components/ui/button/Button";
import Surface from "@/components/primitives/surface/Surface";
import SectionContainer from "@/components/sections/section-container/SectionContainer";
import SectionShell from "@/components/sections/section-shell/SectionShell";
import { buildHubAuthHref, resolveHubAuthRedirect } from "@/lib/auth/hub-auth-redirects";
import { getCurrentSession } from "@/lib/auth/member-session";
import { verifyAdminInviteToken } from "@/lib/auth/admin-invite-token";
import { getServerEnv } from "@/lib/config/env";
import { requireHubBySlug } from "@/lib/data/hubs";
import { getInviteById } from "@/lib/data/invites";
import { getRequestHostFromHeaders, resolveHubRuntimeRouteMode } from "@/lib/domain/hub-hosts";
import { deriveInviteStatus } from "@/lib/domain/invites";
import { canAccessHubAdmin } from "@/lib/domain/users";
import AdminInviteAcceptanceForm from "./AdminInviteAcceptanceForm";
import MemberJoinForm from "./MemberJoinForm";
import styles from "./page.module.css";

export default async function JoinPage({ params, searchParams }) {
  const { hubSlug } = await params;
  const hub = await requireHubBySlug(hubSlug);
  const resolvedSearchParams = await searchParams;
  const nextPath = String(resolvedSearchParams?.next || `/${hub.slug}`).trim() || `/${hub.slug}`;
  const inviteToken = String(resolvedSearchParams?.invite || "").trim();
  const session = await getCurrentSession();
  const requestHeaders = await headers();
  const routeMode = resolveHubRuntimeRouteMode(getRequestHostFromHeaders(requestHeaders));

  if (session && session.hubId === hub.id && (session.role === "member" || canAccessHubAdmin(session.role))) {
    redirect(resolveHubAuthRedirect(hub.slug, session.role, nextPath, routeMode));
  }

  let inviteContext = null;
  if (inviteToken) {
    const payload = verifyAdminInviteToken(inviteToken, getServerEnv().sessionHmacSecret);

    if (payload?.inviteId && payload?.hubId === hub.id) {
      const invite = await getInviteById(hub.id, payload.inviteId);

      if (
        invite &&
        invite.email === payload.email &&
        deriveInviteStatus(invite.status, invite.expiresAt) === "pending"
      ) {
        inviteContext = {
          email: invite.email,
          role: invite.role || "admin",
        };
      }
    }
  }

  return (
    <SectionShell surface="transparent" spacing="default">
      <SectionContainer width="default">
        <div className={styles.root}>
          <Surface className={styles.card}>
            <div className={styles.copy}>
              <p className={styles.eyebrow}>{inviteContext ? "Admin onboarding" : "Join"}</p>
              <h1 className={styles.title}>
                {inviteContext ? `Complete your ${hub.name} admin access` : `Join ${hub.name}`}
              </h1>
              <p className={styles.description}>
                {inviteContext
                  ? "Finish setting up your access to manage this hub."
                  : `Create your access or use your existing account password to join ${hub.name} and access member features.`}
              </p>
            </div>

            {inviteToken && !inviteContext ? (
              <div className={styles.inviteState}>
                <h2 className={styles.supportTitle}>This invite link is no longer valid</h2>
                <p className={styles.supportBody}>
                  This invite may have expired or already been used. Please contact the hub team if you still need access.
                </p>
              </div>
            ) : inviteContext ? (
              <AdminInviteAcceptanceForm hubSlug={hub.slug} inviteToken={inviteToken} invitedEmail={inviteContext.email} />
            ) : (
              <MemberJoinForm hubSlug={hub.slug} nextPath={nextPath} routeMode={routeMode} />
            )}

            <div className={styles.footer}>
              <p className={styles.footerCopy}>{inviteContext ? "Already set up your access?" : "Already have an account?"}</p>
              <Button href={buildHubAuthHref(hub.slug, "sign-in", nextPath, routeMode)} variant="ghost">
                Sign in
              </Button>
            </div>
          </Surface>
        </div>
      </SectionContainer>
    </SectionShell>
  );
}
