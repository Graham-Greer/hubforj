"use client";

import { useEffect, useId, useRef, useState } from "react";
import PlatformSidebar from "@/components/patterns/platform-sidebar/PlatformSidebar";
import SupportModeBanner from "@/components/patterns/support-mode-banner/SupportModeBanner";
import AdminMobileNav from "./AdminMobileNav";
import HubAdminTopbar from "./HubAdminTopbar";
import styles from "./HubAdminShell.module.css";

export default function HubAdminShell({
  hub,
  navGroups,
  publicSiteHref,
  operatorTheme,
  operatorSession,
  adminSession = null,
  supportMode = null,
  children,
}) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [mobileNavTopOffset, setMobileNavTopOffset] = useState(88);
  const mobileNavId = useId();
  const headerRowRef = useRef(null);

  useEffect(() => {
    const node = headerRowRef.current;
    if (!node) {
      return undefined;
    }

    const updateOffset = () => {
      setMobileNavTopOffset(node.getBoundingClientRect().bottom || 0);
    };

    updateOffset();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateOffset);
      return () => {
        window.removeEventListener("resize", updateOffset);
      };
    }

    const observer = new ResizeObserver(() => {
      updateOffset();
    });
    observer.observe(node);

    window.addEventListener("resize", updateOffset);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateOffset);
    };
  }, [supportMode]);

  return (
    <div className={styles.root} data-admin-theme="workspace">
      <div className={styles.sidebarDesktop}>
        <PlatformSidebar title={hub.name} groups={navGroups} />
      </div>
      <div className={styles.frame}>
        <div className={styles.headerRow}>
          <div ref={headerRowRef}>
          <HubAdminTopbar
            hub={hub}
            operatorTheme={operatorTheme}
            operatorSession={operatorSession}
            adminSession={adminSession}
            supportMode={supportMode}
            publicSiteHref={publicSiteHref}
            mobileNavOpen={mobileNavOpen}
            onToggleMobileNav={() => setMobileNavOpen((current) => !current)}
            mobileNavId={mobileNavId}
          />
          </div>
        </div>
        <div className={styles.body}>
          {supportMode ? <SupportModeBanner hub={hub} supportMode={supportMode} /> : null}
          <main className={styles.content}>{children}</main>
        </div>
      </div>
      <AdminMobileNav
        hubSlug={hub.slug}
        publicSiteHref={publicSiteHref}
        title={hub.name}
        groups={navGroups}
        open={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        topOffset={mobileNavTopOffset}
        id={mobileNavId}
        operatorTheme={operatorTheme}
        operatorSession={operatorSession}
        adminSession={adminSession}
        supportMode={supportMode}
      />
    </div>
  );
}
