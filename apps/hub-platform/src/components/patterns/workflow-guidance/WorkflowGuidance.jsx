import Icon from "@/components/ui/icon/Icon";
import Surface from "@/components/primitives/surface/Surface";
import styles from "./WorkflowGuidance.module.css";

export default function WorkflowGuidance({ eyebrow, title, items }) {
  return (
    <Surface tone="muted" padding="lg" className={styles.root}>
      {eyebrow ? <p className={styles.eyebrow}>{eyebrow}</p> : null}
      {title ? <h2 className={styles.title}>{title}</h2> : null}
      <div className={styles.items}>
        {items.map((item) => (
          <article key={item.title} className={styles.item}>
            <div className={styles.iconWrap}>
              <Icon name={item.icon || "info"} tone="accent" />
            </div>
            <div className={styles.copy}>
              <h3 className={styles.itemTitle}>{item.title}</h3>
              <p className={styles.itemBody}>{item.body}</p>
            </div>
          </article>
        ))}
      </div>
    </Surface>
  );
}
