import { notFound, redirect } from "next/navigation";
import Link from "@/components/ui/link/Link";
import HubHeaderFooterFrame from "@/app/_shared/HubHeaderFooterFrame";
import { canAccessHubMember } from "@/lib/auth/guards";
import { getSession } from "@/lib/auth/session";
import { buildThemeScope } from "@/lib/theming/hub-theme";
import { getHubBySlug } from "@/lib/data/hubs/hub-repository";
import styles from "@/app/_shared/member-portal/member-portal.module.css";

export const revalidate = 120;

export default async function MemberHubLayout({ children, params }) {
  const hub = await getHubBySlug(params.hubSlug);
  if (!hub) {
    notFound();
  }

  const session = await getSession();
  if (!canAccessHubMember(session, hub.slug)) {
    redirect(`/${hub.slug}/sign-in`);
  }

  const theme = buildThemeScope(hub);

  return (
    <div data-template={theme["data-template"]} data-hub-theme={theme["data-hub-theme"]}>
      {theme.stylesheetHref ? <link rel="stylesheet" href={theme.stylesheetHref} /> : null}
      <HubHeaderFooterFrame hub={hub} basePath={`/${hub.slug}`}>
        <section className={styles.shell}>
          <nav className={styles.nav} aria-label="Member portal">
            <Link href={`/${hub.slug}/account`}>Overview</Link>
            <Link href={`/${hub.slug}/account/membership`}>Membership</Link>
            <Link href={`/${hub.slug}/account/registrations`}>Registrations</Link>
          </nav>
          <div className={styles.content}>{children}</div>
        </section>
      </HubHeaderFooterFrame>
    </div>
  );
}
