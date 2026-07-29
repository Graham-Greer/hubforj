import fieldStyles from "@/components/ui/field-control/FieldControl.module.css";
import Icon from "@/components/ui/icon/Icon";
import styles from "./Select.module.css";

export default function Select({
  label,
  hint,
  reserveHintSpace = false,
  labelVisibility = "visible",
  requiredIndicator,
  size = "md",
  id,
  options = [],
  className = "",
  ...rest
}) {
  const { value, defaultValue, ...selectProps } = rest;
  const selectId = id || rest.name;
  const shouldRenderHint = Boolean(hint) || reserveHintSpace;
  const labelClassName = labelVisibility === "hidden" ? fieldStyles.visuallyHidden : fieldStyles.label;
  const controlSizeClassName = size === "sm" ? fieldStyles.compactControl : "";
  const shouldShowRequiredIndicator = requiredIndicator || rest.required;
  const isControlled = value !== undefined;
  const uncontrolledSelectKey = `${selectId ?? "select"}:${String(defaultValue ?? "")}`;

  return (
    <label className={[fieldStyles.root, styles.root, className].filter(Boolean).join(" ")} htmlFor={selectId}>
      {label ? (
        <span className={labelVisibility === "hidden" ? labelClassName : fieldStyles.labelWrap}>
          <span className={labelClassName}>{label}</span>
          {labelVisibility !== "hidden" && shouldShowRequiredIndicator ? <span className={fieldStyles.requiredMark}>Required</span> : null}
        </span>
      ) : null}
      <span className={styles.controlWrap}>
        <select
          key={isControlled ? undefined : uncontrolledSelectKey}
          id={selectId}
          className={[fieldStyles.control, controlSizeClassName, styles.control, size === "sm" ? styles.controlSm : ""].filter(Boolean).join(" ")}
          value={isControlled ? value : undefined}
          defaultValue={isControlled ? undefined : defaultValue}
          {...selectProps}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <Icon name="expand_more" size="sm" tone="muted" decorative className={styles.icon} />
      </span>
      {shouldRenderHint ? <span className={fieldStyles.hint} aria-hidden={!hint}>{hint || "\u00A0"}</span> : null}
    </label>
  );
}
