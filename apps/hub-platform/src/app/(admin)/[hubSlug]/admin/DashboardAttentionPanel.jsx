import Link from "next/link";
import DashboardSection from "./DashboardSection";
import rowStyles from "./DashboardRows.module.css";
import styles from "./DashboardAttentionPanel.module.css";

export default function DashboardAttentionPanel({ items = [] }) {
  return (
    <DashboardSection title="Attention required">
      {items.length ? (
        <div className={rowStyles.list}>
          {items.map((item) => (
            <Link key={item.id} href={item.href} className={`${rowStyles.textRow} ${rowStyles.interactive}`}>
              <span className={`${rowStyles.title} ${styles.label}`}>{item.label}</span>
              <span className={rowStyles.sideMeta}>{item.count}</span>
            </Link>
          ))}
        </div>
      ) : (
        <p className={rowStyles.empty}>
          Everything is clear right now. Admin access issues, legal review prompts, upgrade requests, or payment follow-up will appear here when action is needed.
        </p>
      )}
    </DashboardSection>
  );
}
