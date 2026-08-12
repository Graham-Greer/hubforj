"use client";

import { useRef } from "react";
import Icon from "@/components/ui/icon/Icon";
import styles from "./TaskSegmentedControl.module.css";

function clampIndex(index, length) {
  if (!length) {
    return 0;
  }

  if (index < 0) {
    return length - 1;
  }

  if (index >= length) {
    return 0;
  }

  return index;
}

export default function TaskSegmentedControl({
  ariaLabel,
  value,
  onChange,
  options = [],
  className = "",
}) {
  const buttonRefs = useRef([]);

  function focusOption(index) {
    buttonRefs.current[index]?.focus();
  }

  function handleKeyDown(event, optionIndex) {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
      return;
    }

    event.preventDefault();

    const enabledOptions = options
      .map((option, index) => ({ option, index }))
      .filter(({ option }) => !option.disabled);

    const currentEnabledIndex = enabledOptions.findIndex(({ index }) => index === optionIndex);
    let nextEnabledIndex = currentEnabledIndex;

    if (event.key === "Home") {
      nextEnabledIndex = 0;
    } else if (event.key === "End") {
      nextEnabledIndex = enabledOptions.length - 1;
    } else if (event.key === "ArrowRight") {
      nextEnabledIndex = clampIndex(currentEnabledIndex + 1, enabledOptions.length);
    } else if (event.key === "ArrowLeft") {
      nextEnabledIndex = clampIndex(currentEnabledIndex - 1, enabledOptions.length);
    }

    const next = enabledOptions[nextEnabledIndex];

    if (!next) {
      return;
    }

    onChange?.(next.option.value);
    focusOption(next.index);
  }

  return (
    <div className={[styles.root, className].filter(Boolean).join(" ")} role="tablist" aria-label={ariaLabel}>
      {options.map((option, index) => {
        const isSelected = option.value === value;

        return (
          <button
            key={option.value}
            ref={(node) => {
              buttonRefs.current[index] = node;
            }}
            id={`task-segment-${option.value}`}
            type="button"
            role="tab"
            aria-selected={isSelected}
            aria-controls={`task-panel-${option.value}`}
            tabIndex={isSelected ? 0 : -1}
            disabled={option.disabled}
            className={[styles.option, isSelected ? styles.optionSelected : ""].filter(Boolean).join(" ")}
            onClick={() => onChange?.(option.value)}
            onKeyDown={(event) => handleKeyDown(event, index)}
          >
            {option.icon ? <Icon name={option.icon} size="sm" decorative /> : null}
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
