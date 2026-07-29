import fieldStyles from "@/components/ui/field-control/FieldControl.module.css";
import Icon from "@/components/ui/icon/Icon";
import styles from "./SearchField.module.css";

export default function SearchField({
  label = "Search",
  labelVisibility = "visible",
  size = "md",
  className = "",
  controlClassName = "",
  ...rest
}) {
  const controlId = rest.id || rest.name;
  const labelClassName = labelVisibility === "hidden" ? fieldStyles.visuallyHidden : fieldStyles.label;
  const compact = size === "sm";

  return (
    <label className={[styles.root, className].filter(Boolean).join(" ")} htmlFor={controlId}>
      {label ? <span className={labelClassName}>{label}</span> : null}
      <span className={styles.controlWrap}>
        <input
          id={controlId}
          type="search"
          className={[fieldStyles.control, compact ? fieldStyles.compactControl : "", styles.control, compact ? styles.controlSm : "", controlClassName].filter(Boolean).join(" ")}
          {...rest}
        />
        <Icon name="search" size={compact ? "sm" : "md"} tone="muted" decorative className={styles.icon} />
      </span>
    </label>
  );
}
