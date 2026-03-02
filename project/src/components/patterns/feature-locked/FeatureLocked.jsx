import Card from "../../ui/card/Card";
import Heading from "../../primitives/heading/Heading";
import Text from "../../primitives/text/Text";
import Button from "../../ui/button/Button";
import styles from "./FeatureLocked.module.css";

export default function FeatureLocked({ featureKey, benefits = [], cta }) {
  return (
    <Card className={styles.root} tone="muted">
      <Heading as="h2" size="sm">{featureKey} is locked</Heading>
      <Text tone="secondary">Enable this add-on to unlock this surface.</Text>
      {benefits.length ? (
        <ul className={styles.list}>
          {benefits.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : null}
      {cta ? <div>{cta}</div> : <Button intent="brand">Contact support</Button>}
    </Card>
  );
}
