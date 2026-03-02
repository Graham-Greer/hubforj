import Heading from "../../../../primitives/heading/Heading";
import Text from "../../../../primitives/text/Text";
import styles from "./FormGroup.module.css";

export default function FormGroup({ title, description, children }) {
  return (
    <section className={styles.root}>
      {title ? <Heading as="h3" size="xs">{title}</Heading> : null}
      {description ? <Text size="sm" tone="secondary">{description}</Text> : null}
      <div className={styles.content}>{children}</div>
    </section>
  );
}
