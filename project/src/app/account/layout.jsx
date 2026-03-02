import { notFound, redirect } from "next/navigation";
import Link from "@/components/ui/link/Link";
import HubHeaderFooterFrame from "@/app/_shared/HubHeaderFooterFrame";
import { canAccessHubMember } from "@/lib/auth/guards";
import { getSession } from "@/lib/auth/session";
import { getRequestHost, resolveHubByHost } from "@/lib/data/hubs/domain-resolution";
import { buildThemeScope } from "@/lib/theming/hub-theme";
import styles from "@/app/_shared/member-portal/member-portal.module.css";

export const dynamic = "force-dynamic";

export default async function CustomDomainAccountLayout({ children }) {
  const host = await getRequestHost();
  const context = await resolveHubByHost(host);
  if (!context.hub) notFound();

  const session = await getSession();
  if (!canAccessHubMember(session, context.hub.slug)) {
    redirect("/sign-in");
  }

  const theme = buildThemeScope(context.hub);

  return (
    <div data-template={theme["data-template"]} data-hub-theme={theme["data-hub-theme"]}>
      {theme.stylesheetHref ? <link rel="stylesheet" href={theme.stylesheetHref} /> : null}
      <HubHeaderFooterFrame hub={context.hub} basePath="">
        <section className={styles.shell}>
          <nav className={styles.nav} aria-label="Member portal">
            <Link href="/account">Overview</Link>
            <Link href="/account/membership">Membership</Link>
            <Link href="/account/registrations">Registrations</Link>
          </nav>
          <div className={styles.content}>{children}</div>
        </section>
      </HubHeaderFooterFrame>
    </div>
  );
}
