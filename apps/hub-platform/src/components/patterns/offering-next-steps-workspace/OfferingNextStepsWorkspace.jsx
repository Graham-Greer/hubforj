import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import PageHeader from "@/components/patterns/page-header/PageHeader";
import Surface from "@/components/primitives/surface/Surface";
import styles from "./OfferingNextStepsWorkspace.module.css";

function DetailRow({ label, value }) {
  return (
    <div className={styles.detailRow}>
      <dt className={styles.detailLabel}>{label}</dt>
      <dd className={styles.detailValue}>{value}</dd>
    </div>
  );
}

function ActionRow({ primaryAction = null, secondaryAction = null }) {
  if (!primaryAction && !secondaryAction) {
    return null;
  }

  return (
    <div className={styles.actions}>
      {primaryAction ? (
        <Button
          href={primaryAction.href}
          variant="primary"
          target={primaryAction.external ? "_blank" : undefined}
          rel={primaryAction.external ? "noreferrer" : undefined}
        >
          {primaryAction.label}
        </Button>
      ) : null}
      {secondaryAction ? (
        <Button
          href={secondaryAction.href}
          variant="secondary"
          target={secondaryAction.external ? "_blank" : undefined}
          rel={secondaryAction.external ? "noreferrer" : undefined}
        >
          {secondaryAction.label}
        </Button>
      ) : null}
    </div>
  );
}

export default function OfferingNextStepsWorkspace({ model }) {
  return (
    <div className={styles.root}>
      <PageHeader
        eyebrow={model.eyebrow}
        title={model.title}
        description={model.description}
        actions={
          model.backAction ? (
            <Button href={model.backAction.href} variant="ghost">
              {model.backAction.label}
            </Button>
          ) : null
        }
      />

      <Surface className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.cardCopy}>
            <h2 className={styles.cardTitle}>{model.statusCard.title}</h2>
            <p className={styles.cardDescription}>{model.statusCard.description}</p>
          </div>
        </div>

        <div className={styles.badges}>
          {model.statusCard.badges.map((badge) => (
            <Badge key={`${badge.label}_${badge.tone}`} tone={badge.tone}>
              {badge.label}
            </Badge>
          ))}
        </div>

        <dl className={styles.details}>
          {model.statusCard.details.map((detail) => (
            <DetailRow key={detail.label} label={detail.label} value={detail.value} />
          ))}
        </dl>
      </Surface>

      <Surface className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.cardCopy}>
            <h2 className={styles.cardTitle}>{model.paymentCard.title}</h2>
            <p className={styles.cardDescription}>{model.paymentCard.description}</p>
          </div>
        </div>

        {model.paymentCard.instructions ? (
          <p className={styles.instructions}>{model.paymentCard.instructions}</p>
        ) : null}

        <ActionRow
          primaryAction={model.paymentCard.primaryAction}
          secondaryAction={model.paymentCard.secondaryAction}
        />
      </Surface>
    </div>
  );
}
