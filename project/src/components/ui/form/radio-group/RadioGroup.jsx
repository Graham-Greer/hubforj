"use client";

import Radio from "../radio/Radio";
import styles from "./RadioGroup.module.css";

export default function RadioGroup({ options = [], value, onChange, name = "radio-group" }) {
  return (
    <div className={styles.root}>
      {options.map((option) => (
        <Radio
          key={option.value}
          name={name}
          value={option.value}
          checked={value === option.value}
          onChange={(checked) => {
            if (checked) onChange?.(option.value);
          }}
          label={option.label}
        />
      ))}
    </div>
  );
}
