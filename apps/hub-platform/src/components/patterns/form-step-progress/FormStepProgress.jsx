"use client";

import Icon from "@/components/ui/icon/Icon";
import styles from "./FormStepProgress.module.css";

function getStepState(step, currentIndex) {
  if (step.index < currentIndex) {
    return "complete";
  }

  if (step.index === currentIndex) {
    return "current";
  }

  return "upcoming";
}

export default function FormStepProgress({
  steps = [],
  currentStepId = "",
  onStepSelect,
  interactive = false,
  className = "",
  ariaLabel = "Form progress",
}) {
  const currentIndex = Math.max(
    0,
    steps.findIndex((step) => step.id === currentStepId)
  );

  return (
    <nav
      aria-label={ariaLabel}
      className={[styles.root, className].filter(Boolean).join(" ")}
    >
      <ol className={styles.list}>
        {steps.map((step, index) => {
          const state = getStepState({ ...step, index }, currentIndex);
          const isInteractive =
            interactive &&
            typeof onStepSelect === "function" &&
            (state === "complete" || state === "current");
          const hasForwardRail = index < steps.length - 1;
          const isForwardRailComplete = index < currentIndex;

          return (
            <li
              key={step.id}
              className={[
                styles.item,
                state === "complete" ? styles.itemComplete : "",
                state === "current" ? styles.itemCurrent : "",
              ].filter(Boolean).join(" ")}
            >
              {hasForwardRail ? (
                <span
                  aria-hidden="true"
                  className={[
                    styles.rail,
                    styles.railForward,
                    isForwardRailComplete ? styles.railComplete : "",
                  ].filter(Boolean).join(" ")}
                />
              ) : null}
              {isInteractive ? (
                <button
                  type="button"
                  className={styles.trigger}
                  onClick={() => onStepSelect(step.id)}
                  aria-current={state === "current" ? "step" : undefined}
                >
                  <StepMarker state={state} index={index} />
                  <StepLabel step={step} state={state} />
                </button>
              ) : (
                <div className={styles.staticStep} aria-current={state === "current" ? "step" : undefined}>
                  <StepMarker state={state} index={index} />
                  <StepLabel step={step} state={state} />
                </div>
              )}
            </li>
          );
        })}
      </ol>
      <p className={styles.summary}>
        Step {currentIndex + 1} of {steps.length}
      </p>
    </nav>
  );
}

function StepMarker({ state, index }) {
  return (
    <span
      className={[
        styles.marker,
        state === "complete" ? styles.markerComplete : "",
        state === "current" ? styles.markerCurrent : "",
      ].filter(Boolean).join(" ")}
      aria-hidden="true"
    >
      {state === "complete" ? <Icon name="check" size="sm" decorative /> : <span>{index + 1}</span>}
    </span>
  );
}

function StepLabel({ step, state }) {
  return (
    <span className={styles.copy}>
      <span
        className={[
          styles.label,
          state === "current" ? styles.labelCurrent : "",
        ].filter(Boolean).join(" ")}
      >
        {step.label}
      </span>
      {step.description ? <span className={styles.description}>{step.description}</span> : null}
    </span>
  );
}
