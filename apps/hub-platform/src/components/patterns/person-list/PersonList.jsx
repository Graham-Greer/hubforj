import Link from "next/link";
import Badge from "@/components/ui/badge/Badge";
import Surface from "@/components/primitives/surface/Surface";
import { getUserRoleLabel, getUserRoleTone, getUserStatusLabel, getUserStatusTone } from "@/lib/domain/users";
import styles from "./PersonList.module.css";

export default function PersonList({
  people,
  emptyLabel = "No records yet.",
  showEmail = true,
  showCreatedAt = true,
}) {
  if (!people.length) {
    return (
      <Surface tone="muted" padding="md">
        <p className={styles.empty}>{emptyLabel}</p>
      </Surface>
    );
  }

  return (
    <div className={styles.list}>
      {people.map((person) => (
        <Surface key={person.id} padding="md" className={styles.row}>
          <div className={styles.identity}>
            {person.href ? (
              <Link href={person.href} className={styles.name}>
                {person.name || person.email}
              </Link>
            ) : (
              <strong className={styles.name}>{person.name || person.email}</strong>
            )}
            {showEmail ? <span className={styles.email}>{person.email}</span> : null}
          </div>
          <div className={styles.meta}>
            <Badge tone={getUserRoleTone(person.role)}>{getUserRoleLabel(person.role)}</Badge>
            {person.status ? <Badge tone={getUserStatusTone(person.status)}>{getUserStatusLabel(person.status)}</Badge> : null}
            {showCreatedAt && person.createdAt ? <span className={styles.created}>Created {person.createdAt.slice(0, 10)}</span> : null}
          </div>
        </Surface>
      ))}
    </div>
  );
}
