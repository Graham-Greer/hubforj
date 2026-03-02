"use client";

import Icon from "@/components/primitives/icon/Icon";
import styles from "./Select.module.css";

export default function Select({ id, options = [], value, onChange, placeholder = "Select...", className = "", ...rest }) {
  const normalizedOptions = options.map((option) =>
    typeof option === "string"
      ? { value: option, label: option }
      : option
  );

  return (
    <div className={[styles.wrap, className].filter(Boolean).join(" ")}>
      <select
        id={id}
        className={styles.root}
        {...(value !== undefined ? { value } : {})}
        onChange={(event) => onChange?.(event.target.value)}
        {...rest}
      >
        <option value="">{placeholder}</option>
        {normalizedOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <span className={styles.chevron} aria-hidden="true">
        <Icon name="expand_more" size="sm" decorative />
      </span>
    </div>
  );
}
