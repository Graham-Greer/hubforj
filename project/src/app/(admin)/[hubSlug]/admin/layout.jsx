import { redirect } from "next/navigation";
import Button from "@/components/ui/button/Button";
import Text from "@/components/primitives/text/Text";
import Heading from "@/components/primitives/heading/Heading";
import Icon from "@/components/primitives/icon/Icon";
import Link from "@/components/ui/link/Link";
import { canAccessHubAdmin, requireSessionRole } from "@/lib/auth/guards";
import { clearSupportModeContext, getSession } from "@/lib/auth/session";
import { logSupportModeExited } from "@/lib/auth/support-mode";
import { getRequestHost, isCustomDomainRequest } from "@/lib/data/hubs/domain-resolution";
import styles from "./layout.module.css";

async function exitSupportMode() {
  "use server";

  const session = await requireSessionRole("superadmin", "/platform/sign-in");

  logSupportModeExited({
    actorUid: session.uid,
    hubId: session.supportHubId || null,
    hubSlug: session.supportHubSlug || null,
  });

  await clearSupportModeContext();

  redirect("/platform/hubs");
}

export default async function HubAdminLayout({ children, params }) {
  const host = await getRequestHost();
  if (await isCustomDomainRequest(host)) {
    return (
      <main className={styles.main}>
        <Heading as="h1" size="md">Admin routes are blocked on custom domains</Heading>
        <Text tone="secondary">Use the platform domain route `/{params.hubSlug}/admin` to access hub admin.</Text>
      </main>
    );
  }

  const session = await getSession();

  if (!canAccessHubAdmin(session, params.hubSlug)) {
    redirect("/platform/sign-in");
  }

  const inSupportMode = session?.role === "superadmin" && session?.supportHubSlug === params.hubSlug;
  const hubSlug = params.hubSlug;
  const navItems = [
    { href: `/${hubSlug}/admin`, label: "Dashboard", icon: "dashboard" },
    { href: `/${hubSlug}/admin/events`, label: "Events", icon: "event" },
    { href: `/${hubSlug}/admin/members`, label: "Members", icon: "group" },
    { href: `/${hubSlug}/admin/membership-plans`, label: "Plans", icon: "card_membership" },
    { href: `/${hubSlug}/admin/settings/features`, label: "Feature Flags", icon: "flag" },
    { href: `/${hubSlug}/admin/cms`, label: "CMS", icon: "web_stories" },
  ];

  return (
    <div className={styles.root}>
      {inSupportMode ? (
        <aside className={styles.banner}>
          <Text size="sm">Support mode active for hub: {params.hubSlug}</Text>
          <form action={exitSupportMode}>
            <Button type="submit" variant="secondary">Exit support mode</Button>
          </form>
        </aside>
      ) : null}
      <input id="adminNavCollapsed" type="checkbox" className={styles.collapseToggle} />
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <label htmlFor="adminNavCollapsed" className={styles.collapseButton}>
            <Icon name="menu" decorative />
            <span>Toggle sidebar</span>
          </label>
          <Heading as="h2" size="sm">Hub Admin</Heading>
        </div>
        <Text size="sm" tone="secondary">Hub: {hubSlug}</Text>
      </header>
      <div className={styles.shell}>
        <nav className={styles.sidebar} aria-label="Hub admin navigation">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              underline={false}
              className={styles.navItem}
              title={item.label}
            >
              <Icon name={item.icon} decorative />
              <span className={styles.navLabel}>{item.label}</span>
            </Link>
          ))}
        </nav>
        <main className={styles.main}>{children}</main>
      </div>
    </div>
  );
}
