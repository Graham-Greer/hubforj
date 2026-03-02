import Icon from "../../primitives/icon/Icon";
import Heading from "../../primitives/heading/Heading";
import Text from "../../primitives/text/Text";
import Button from "../button/Button";
import styles from "./ErrorState.module.css";

export default function ErrorState({ title, body, onRetry, referenceId, variant = "default", className = "" }) {
  const classes = [styles.root, styles[`variant_${variant}`], className].filter(Boolean).join(" ");

  return (
    <section className={classes}>
      <Icon name="error" decorative size="lg" tone="danger" />
      <Heading as="h3" size="sm">{title}</Heading>
      {body ? <Text tone="secondary">{body}</Text> : null}
      {referenceId ? <Text size="sm" tone="muted">Ref: {referenceId}</Text> : null}
      {onRetry ? <Button onClick={onRetry}>Try again</Button> : null}
    </section>
  );
}
