import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Button from "@/components/ui/button/Button";
import Surface from "@/components/primitives/surface/Surface";
import SectionContainer from "@/components/sections/section-container/SectionContainer";
import SectionShell from "@/components/sections/section-shell/SectionShell";
import { buildHubAuthHref, resolveHubAuthRedirect } from "@/lib/auth/hub-auth-redirects";
import { getCurrentSession } from "@/lib/auth/member-session";
import { requireHubBySlug } from "@/lib/data/hubs";
import { getRequestHostFromHeaders, resolveHubRuntimeRouteMode } from "@/lib/domain/hub-hosts";
import { canAccessHubAdmin } from "@/lib/domain/users";
import MemberSignInForm from "./MemberSignInForm";
import styles from "./page.module.css";

export default async function SignInPage({ params, searchParams }) {
  const { hubSlug } = await params;
  const hub = await requireHubBySlug(hubSlug);
  const resolvedSearchParams = await searchParams;
  const nextPath = String(resolvedSearchParams?.next || "").trim();
  const defaultEmail = String(resolvedSearchParams?.email || "").trim();
  const activated = String(resolvedSearchParams?.activated || "") === "1";
  const session = await getCurrentSession();
  const requestHeaders = await headers();
  const routeMode = resolveHubRuntimeRouteMode(getRequestHostFromHeaders(requestHeaders));

  if (session && session.hubId === hub.id && (session.role === "member" || canAccessHubAdmin(session.role))) {
    redirect(resolveHubAuthRedirect(hub.slug, session.role, nextPath, routeMode));
  }

  return (
    <SectionShell surface="transparent" spacing="default">
      <SectionContainer width="default">
        <div className={styles.root}>
          <Surface className={styles.card}>
            <div className={styles.copy}>
              <p className={styles.eyebrow}>Sign in</p>
              <h1 className={styles.title}>Sign in to {hub.name}</h1>
              <p className={styles.description}>
                Access your account to manage your membership, bookings, and activity with {hub.name}.
              </p>
            </div>

            {activated ? <p className={styles.description}>Your admin access is ready. Sign in with the same email and password you created when you launched your community.</p> : null}

            <MemberSignInForm hubSlug={hub.slug} nextPath={nextPath} defaultEmail={defaultEmail} routeMode={routeMode} />

            <div className={styles.footer}>
              <p className={styles.footerCopy}>Need to create an account first?</p>
              <Button href={buildHubAuthHref(hub.slug, "join", nextPath, routeMode)} prefetch={false} variant="ghost">
                Go to join
              </Button>
            </div>
          </Surface>
        </div>
      </SectionContainer>
    </SectionShell>
  );
}
