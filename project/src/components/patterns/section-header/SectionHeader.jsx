import Heading from "../../primitives/heading/Heading";
import Text from "../../primitives/text/Text";
import styles from "./SectionHeader.module.css";

export default function SectionHeader({ title, subtitle, actions }) {
  return (
    <header className={styles.root}>
      <div className={styles.copy}>
        <Heading as="h2" size="sm">{title}</Heading>
        {subtitle ? <Text tone="secondary">{subtitle}</Text> : null}
      </div>
      {actions ? <div className={styles.actions}>{actions}</div> : null}
    </header>
  );
}
