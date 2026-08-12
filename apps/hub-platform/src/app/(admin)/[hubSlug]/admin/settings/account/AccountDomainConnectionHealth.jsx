import Icon from "@/components/ui/icon/Icon";
import {
  countCompleteSteps,
  getStepIcon,
  getStepStatusLabel,
  getStepTone,
} from "./accountDomainViewModel";
import styles from "./page.module.css";

export default function AccountDomainConnectionHealth({ steps = [] }) {
  if (!steps.length) {
    return null;
  }

  return (
    <section className={styles.connectionHealth} aria-labelledby="custom-domain-status-title">
      <div className={styles.connectionHealthHeader}>
        <h3 id="custom-domain-status-title" className={styles.noticeTitle}>Connection health</h3>
        <span
          className={styles.connectionHealthCount}
          data-tone={countCompleteSteps(steps) === steps.length ? "success" : "info"}
        >
          {countCompleteSteps(steps)} of {steps.length} checks complete
        </span>
      </div>
      <ol className={styles.connectionHealthList} aria-label="Custom domain setup progress">
        {steps.map((step) => (
          <li key={step.id} className={styles.connectionHealthItem} data-state={step.state}>
            <span className={styles.connectionHealthIcon} aria-hidden="true">
              <Icon name={getStepIcon(step.state)} size="sm" decorative />
            </span>
            <div className={styles.connectionHealthCopy}>
              <div className={styles.connectionHealthTitleRow}>
                <strong>{step.title}</strong>
                <span className={styles.connectionHealthStatus} data-tone={getStepTone(step.state)}>
                  {getStepStatusLabel(step.state)}
                </span>
              </div>
              <p>{step.description}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
