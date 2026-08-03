import {
  SkeletonBlock,
  SkeletonButtonRow,
} from "@/components/patterns/loading-skeleton";
import { cookies } from "next/headers";
import { normalizeOperatorTheme, operatorThemeCookieName } from "@/lib/theme/operator-theme";
import styles from "./loading.module.css";

function SidebarSection({ rows = 3 }) {
  return (
    <div className={styles.sidebarSection} aria-hidden="true">
      <SkeletonBlock variant="eyebrow" width="5rem" />
      {Array.from({ length: rows }).map((_, index) => (
        <div className={styles.sidebarItem} key={index}>
          <SkeletonBlock variant="pill" width="1rem" />
          <SkeletonBlock width={index % 2 === 0 ? "7rem" : "5.5rem"} />
        </div>
      ))}
    </div>
  );
}

export default async function AdminSegmentLoading() {
  const cookieStore = await cookies();
  const operatorTheme = normalizeOperatorTheme(cookieStore.get(operatorThemeCookieName)?.value);

  return (
    <div
      className={styles.root}
      data-theme={operatorTheme}
      data-admin-theme="workspace"
      data-workspace-theme-scope="operator"
      role="status"
      aria-live="polite"
      aria-label="Loading admin workspace"
    >
      <aside className={styles.sidebar} aria-hidden="true">
        <div className={styles.brand}>
          <span className={styles.brandMark}>HP</span>
          <div className={styles.brandCopy}>
            <SkeletonBlock variant="heading" width="9rem" />
            <SkeletonBlock width="8rem" compact />
          </div>
        </div>
        <nav className={styles.sidebarNav}>
          <SidebarSection rows={1} />
          <SidebarSection rows={2} />
          <SidebarSection rows={3} />
          <SidebarSection rows={3} />
        </nav>
      </aside>
      <div className={styles.frame}>
        <header className={styles.topbar}>
          <div className={styles.mobileIdentity} aria-hidden="true">
            <span className={styles.mobileBrandMark}>HP</span>
            <div className={styles.brandCopy}>
              <SkeletonBlock variant="heading" width="10rem" />
              <SkeletonBlock width="8rem" compact />
            </div>
          </div>
          <SkeletonButtonRow count={3} />
        </header>
        <main className={styles.content} aria-hidden="true" />
      </div>
    </div>
  );
}
