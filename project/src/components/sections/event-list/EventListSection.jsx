import Heading from "@/components/primitives/heading/Heading";
import Text from "@/components/primitives/text/Text";
import Badge from "@/components/ui/badge/Badge";
import Card from "@/components/ui/card/Card";
import styles from "./EventListSection.module.css";

export default function EventListSection({ title, events = [], limit = "6", category = "" }) {
  const max = Math.max(1, Number.parseInt(limit, 10) || 6);
  const normalizedCategory = String(category || "").trim().toLowerCase();
  const rows = events
    .filter((event) => (normalizedCategory ? String(event.category || "").toLowerCase() === normalizedCategory : true))
    .slice(0, max);

  return (
    <section className={styles.root}>
      {title ? <Heading as="h2" size="md">{title}</Heading> : null}
      <div className={styles.grid}>
        {rows.length ? rows.map((event) => (
          <Card key={event.id} className={styles.card}>
            <div className={styles.metaRow}>
              <Heading as="h3" size="sm">{event.title}</Heading>
              <Badge tone="neutral">{event.category}</Badge>
            </div>
            <Text tone="secondary">{event.startAt ? new Date(event.startAt).toLocaleString() : "Date TBD"}</Text>
          </Card>
        )) : <Text tone="secondary">No events available yet.</Text>}
      </div>
    </section>
  );
}
