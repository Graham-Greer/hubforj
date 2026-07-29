import fieldStyles from "@/components/ui/field-control/FieldControl.module.css";
import styles from "./Input.module.css";

const hintToneClassNames = {
  danger: fieldStyles.hintDanger,
};

export default function Input({ label, hint, hintTone = "neutral", reserveHintSpace = false, id, className = "", requiredIndicator, ...rest }) {
  const inputId = id || rest.name;
  const shouldRenderHint = Boolean(hint) || reserveHintSpace;
  const shouldShowRequiredIndicator = requiredIndicator || rest.required;
  const hintClassName = [fieldStyles.hint, hintToneClassNames[hintTone]].filter(Boolean).join(" ");

  return (
    <label className={[fieldStyles.root, styles.root, className].filter(Boolean).join(" ")} htmlFor={inputId}>
      {label ? (
        <span className={fieldStyles.labelWrap}>
          <span className={fieldStyles.label}>{label}</span>
          {shouldShowRequiredIndicator ? <span className={fieldStyles.requiredMark}>Required</span> : null}
        </span>
      ) : null}
      <input id={inputId} className={[fieldStyles.control, styles.control].filter(Boolean).join(" ")} {...rest} />
      {shouldRenderHint ? <span className={hintClassName} aria-hidden={!hint}>{hint || "\u00A0"}</span> : null}
    </label>
  );
}
