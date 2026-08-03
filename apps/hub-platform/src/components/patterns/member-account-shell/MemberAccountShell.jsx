import Surface from "@/components/primitives/surface/Surface";
import { buildHubRuntimeHref } from "@/lib/domain/hub-runtime-paths";
import MemberAccountNav from "./MemberAccountNav";
import styles from "./MemberAccountShell.module.css";

export default function MemberAccountShell({ hub, children }) {
  const routeMode = hub?.routeMode || "path";
  const navItems = [
    { href: buildHubRuntimeHref(hub.slug, "/account", routeMode), label: "Overview" },
    { href: buildHubRuntimeHref(hub.slug, "/account/bookings", routeMode), label: "My Bookings" },
    { href: buildHubRuntimeHref(hub.slug, "/account/membership", routeMode), label: "Membership" },
    { href: buildHubRuntimeHref(hub.slug, "/account/billing", routeMode), label: "Billing" },
    { href: buildHubRuntimeHref(hub.slug, "/account/profile", routeMode), label: "Profile" },
  ];

  return (
    <div className={styles.root}>
      <Surface padding="none" className={styles.navSurface}>
        <div className={styles.navFrame}>
          <MemberAccountNav items={navItems} />
        </div>
      </Surface>
      <div className={styles.content}>{children}</div>
    </div>
  );
}
