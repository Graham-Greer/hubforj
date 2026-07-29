import fieldStyles from "@/components/ui/field-control/FieldControl.module.css";
import styles from "./SegmentedToggle.module.css";

export default function SegmentedToggle({
  label,
  name,
  value,
  onChange,
  options = [],
  hint,
  reserveHintSpace = false,
  labelVisibility = "visible",
  className = "",
}) {
  const shouldRenderHint = Boolean(hint) || reserveHintSpace;
  const labelClassName = labelVisibility === "hidden" ? fieldStyles.visuallyHidden : fieldStyles.label;

  return (
    <label className={[fieldStyles.root, styles.root, className].filter(Boolean).join(" ")}>
      {label ? <span className={labelClassName}>{label}</span> : null}
      <input type="hidden" name={name} value={value} />
      <span className={styles.group} role="radiogroup" aria-label={label}>
        {options.map((option) => {
          const isSelected = option.value === value;

          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              className={[styles.option, isSelected ? styles.optionSelected : ""].filter(Boolean).join(" ")}
              onClick={() => onChange?.(option.value)}
            >
              {option.label}
            </button>
          );
        })}
      </span>
      {shouldRenderHint ? <span className={fieldStyles.hint} aria-hidden={!hint}>{hint || "\u00A0"}</span> : null}
    </label>
  );
}
