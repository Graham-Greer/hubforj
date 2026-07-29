import Image from "next/image";
import Surface from "@/components/primitives/surface/Surface";
import styles from "./OfferingAdminSummaryPanel.module.css";

function FactItem({ label, value, compact = false }) {
  return (
    <div className={compact ? styles.secondaryFactItem : styles.primaryFactItem}>
      <p className={styles.factLabel}>{label}</p>
      <p className={compact ? styles.secondaryFactValue : styles.primaryFactValue}>{value}</p>
    </div>
  );
}

export default function OfferingAdminSummaryPanel({
  badges = null,
  actions = null,
  media = null,
  primaryFacts = [],
  secondaryFacts = [],
  summary = "",
  description = null,
}) {
  const hasMedia = Boolean(media?.src);

  return (
    <Surface padding="lg" className={styles.panel}>
      {(badges || actions) ? (
        <div className={styles.header}>
          {badges ? <div className={styles.badges}>{badges}</div> : <div />}
          {actions ? <div className={styles.actions}>{actions}</div> : null}
        </div>
      ) : null}

      <div className={`${styles.layout} ${!hasMedia ? styles.layoutNoMedia : ""}`.trim()}>
        {hasMedia ? (
          <div className={styles.media}>
            <Image
              src={media.src}
              alt={media.alt}
              fill
              sizes={media.sizes || "(max-width: 72rem) 100vw, 24rem"}
              className={styles.mediaImage}
              unoptimized={media.unoptimized !== false}
            />
          </div>
        ) : null}

        <div className={styles.content}>
          {primaryFacts.length ? (
            <div className={styles.primaryFacts}>
              {primaryFacts.map((fact) => (
                <FactItem key={fact.label} label={fact.label} value={fact.value} />
              ))}
            </div>
          ) : null}

          {summary ? <p className={styles.summary}>{summary}</p> : null}

          {secondaryFacts.length ? (
            <div className={styles.secondaryFacts}>
              {secondaryFacts.map((fact) => (
                <FactItem key={fact.label} label={fact.label} value={fact.value} compact />
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {description ? <div className={styles.description}>{description}</div> : null}
    </Surface>
  );
}
