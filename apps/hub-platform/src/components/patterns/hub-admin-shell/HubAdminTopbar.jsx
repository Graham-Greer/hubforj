"use client";

import Button from "@/components/ui/button/Button";
import Icon from "@/components/ui/icon/Icon";
import NavToggleButton from "@/components/ui/nav-toggle-button/NavToggleButton";
import OperatorSignOutButton from "@/components/patterns/operator-sign-out-button/OperatorSignOutButton";
import HubSignOutButton from "@/components/patterns/hub-sign-out-button/HubSignOutButton";
import WorkspaceThemeToggle from "@/components/patterns/workspace-theme-toggle/WorkspaceThemeToggle";
import styles from "./HubAdminTopbar.module.css";

export default function HubAdminTopbar({
  hub,
  operatorTheme,
  operatorSession = null,
  adminSession = null,
  supportMode = null,
  mobileNavOpen = false,
  onToggleMobileNav,
  mobileNavId,
}) {
  return (
    <header className={styles.root}>
      <div className={styles.mobileIdentity}>
        <div className={styles.mobileBrandMark} aria-hidden="true">
          HP
        </div>
        <div className={styles.mobileBrandCopy}>
          <strong>{hub.name}</strong>
          <span>Operations platform</span>
        </div>
      </div>
      <div className={styles.actions}>
        {operatorSession && !supportMode ? (
          <Button href="/platform/hubs" variant="ghost">
            <Icon name="arrow_back" size="md" decorative />
            <span>Back to platform</span>
          </Button>
        ) : null}
        <Button href={`/${hub.slug}`} variant="ghost">
          View public site
        </Button>
        <WorkspaceThemeToggle currentTheme={operatorTheme} />
        {operatorSession ? <OperatorSignOutButton /> : null}
        {!operatorSession && adminSession ? <HubSignOutButton hubSlug={hub.slug} redirectPath={`/${hub.slug}/sign-in`} /> : null}
      </div>
      <div className={styles.mobileActions}>
        <NavToggleButton
          open={mobileNavOpen}
          onClick={onToggleMobileNav}
          label={mobileNavOpen ? "Close admin navigation" : "Open admin navigation"}
          variant="secondary"
          className={styles.mobileToggle}
          aria-controls={mobileNavId}
        />
      </div>
    </header>
  );
}
