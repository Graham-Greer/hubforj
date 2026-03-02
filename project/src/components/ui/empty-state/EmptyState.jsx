import Icon from "../../primitives/icon/Icon";
import Text from "../../primitives/text/Text";
import Heading from "../../primitives/heading/Heading";
import styles from "./EmptyState.module.css";

export default function EmptyState({ title, body, action, variant = "default", className = "" }) {
  const classes = [styles.root, styles[`variant_${variant}`], className].filter(Boolean).join(" ");

  return (
    <section className={classes}>
      <Icon name="inbox" decorative size="lg" tone="muted" />
      <Heading as="h3" size="sm">{title}</Heading>
      {body ? <Text tone="secondary">{body}</Text> : null}
      {action ? <div className={styles.action}>{action}</div> : null}
    </section>
  );
}
