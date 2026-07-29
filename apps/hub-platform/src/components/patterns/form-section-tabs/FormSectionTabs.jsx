"use client";

import HorizontalScrollRail from "@/components/ui/horizontal-scroll-rail/HorizontalScrollRail";
import styles from "./FormSectionTabs.module.css";

export default function FormSectionTabs({
  tabs = [],
  activeTabId = "",
  onTabChange,
  className = "",
  ariaLabel = "Form sections",
  showDescriptions = true,
  onboardingKey = "",
}) {
  function handleKeyDown(event, tabId) {
    const currentIndex = tabs.findIndex((tab) => tab.id === tabId);

    if (currentIndex === -1) {
      return;
    }

    let nextIndex = currentIndex;

    if (event.key === "ArrowRight") {
      nextIndex = (currentIndex + 1) % tabs.length;
    } else if (event.key === "ArrowLeft") {
      nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = tabs.length - 1;
    } else {
      return;
    }

    event.preventDefault();
    onTabChange?.(tabs[nextIndex].id);
  }

  return (
    <HorizontalScrollRail className={[styles.viewport, className].filter(Boolean).join(" ")} activeItemKey={activeTabId}>
      <div
        role="tablist"
        aria-label={ariaLabel}
        className={styles.root}
        data-onboarding={onboardingKey || undefined}
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;

          return (
            <button
              key={tab.id}
              id={`form-section-tab-${tab.id}`}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`form-section-panel-${tab.id}`}
              tabIndex={isActive ? 0 : -1}
              className={[
                styles.tab,
                isActive ? styles.tabActive : "",
              ].filter(Boolean).join(" ")}
              onClick={() => onTabChange?.(tab.id)}
              onKeyDown={(event) => handleKeyDown(event, tab.id)}
              data-active={isActive ? "true" : undefined}
            >
              <span className={styles.label}>{tab.label}</span>
              {showDescriptions && tab.description ? <span className={styles.description}>{tab.description}</span> : null}
            </button>
          );
        })}
      </div>
    </HorizontalScrollRail>
  );
}
