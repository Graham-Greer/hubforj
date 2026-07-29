import Surface from "@/components/primitives/surface/Surface";
import MemberAccountNav from "./MemberAccountNav";
import styles from "./MemberAccountShell.module.css";

export default function MemberAccountShell({ hub, children }) {
  const navItems = [
    { href: `/${hub.slug}/account`, label: "Overview" },
    { href: `/${hub.slug}/account/bookings`, label: "My Bookings" },
    { href: `/${hub.slug}/account/membership`, label: "Membership" },
    { href: `/${hub.slug}/account/billing`, label: "Billing" },
    { href: `/${hub.slug}/account/profile`, label: "Profile" },
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
