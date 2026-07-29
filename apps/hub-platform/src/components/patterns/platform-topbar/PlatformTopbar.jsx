import WorkspaceThemeToggle from "@/components/patterns/workspace-theme-toggle/WorkspaceThemeToggle";
import OperatorSignOutButton from "@/components/patterns/operator-sign-out-button/OperatorSignOutButton";
import styles from "./PlatformTopbar.module.css";

export default function PlatformTopbar({ audience, subject, operatorTheme, operatorSession }) {
  return (
    <header className={styles.root}>
      <div className={styles.context}>
        <span className={styles.pill}>{audience}</span>
        <span className={styles.subject}>{subject}</span>
      </div>
      <div className={styles.account}>
        <WorkspaceThemeToggle currentTheme={operatorTheme} />
        <span className={styles.accountName}>{operatorSession?.user?.name || operatorSession?.user?.email || "Operator"}</span>
        <span className={styles.accountBadge}>OP</span>
        <OperatorSignOutButton />
      </div>
    </header>
  );
}
