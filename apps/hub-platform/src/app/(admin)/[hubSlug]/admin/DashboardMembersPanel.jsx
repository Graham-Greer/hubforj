import Link from "next/link";
import Badge from "@/components/ui/badge/Badge";
import { getUserStatusLabel, getUserStatusTone } from "@/lib/domain/users";
import DashboardSection from "./DashboardSection";
import rowStyles from "./DashboardRows.module.css";
import styles from "./DashboardMembersPanel.module.css";

export default function DashboardMembersPanel({ items = [] }) {
  return (
    <DashboardSection title="Newest members">
      {items.length ? (
        <div className={rowStyles.list}>
          {items.map((item) => (
            <Link key={item.id} href={item.href} prefetch={false} className={`${rowStyles.textRow} ${rowStyles.interactive}`}>
              <div className={rowStyles.content}>
                <div className={rowStyles.identity}>
                  <strong className={rowStyles.title}>{item.name}</strong>
                  <Badge tone={getUserStatusTone(item.status)} size="sm">
                    {getUserStatusLabel(item.status)}
                  </Badge>
                </div>
                <span className={styles.secondary}>{item.secondary}</span>
              </div>
              <span className={rowStyles.sideMeta}>{item.createdAtLabel}</span>
            </Link>
          ))}
        </div>
      ) : (
        <p className={rowStyles.empty}>New members will appear here after people join the hub.</p>
      )}
    </DashboardSection>
  );
}
