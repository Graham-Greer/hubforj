import PlatformSidebar from "@/components/patterns/platform-sidebar/PlatformSidebar";
import PlatformTopbar from "@/components/patterns/platform-topbar/PlatformTopbar";
import styles from "./PlatformShell.module.css";

export default function PlatformShell({
  shellTitle,
  shellAudience,
  shellSubject,
  navGroups,
  operatorTheme,
  operatorSession,
  children,
}) {
  return (
    <div className={styles.root}>
      <PlatformSidebar title={shellTitle} groups={navGroups} />
      <div className={styles.frame}>
        <PlatformTopbar audience={shellAudience} subject={shellSubject} operatorTheme={operatorTheme} operatorSession={operatorSession} />
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}
