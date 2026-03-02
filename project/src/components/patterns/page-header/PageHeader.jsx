import Heading from "../../primitives/heading/Heading";
import Text from "../../primitives/text/Text";
import styles from "./PageHeader.module.css";

export default function PageHeader({ title, subtitle, actions, breadcrumbs, variant = "default" }) {
  return (
    <header className={[styles.root, styles[`variant_${variant}`]].join(" ")}>
      <div className={styles.copy}>
        {breadcrumbs ? <Text size="sm" tone="muted">{breadcrumbs}</Text> : null}
        <Heading as="h1" size="md">{title}</Heading>
        {subtitle ? <Text tone="secondary">{subtitle}</Text> : null}
      </div>
      {actions ? <div className={styles.actions}>{actions}</div> : null}
    </header>
  );
}
