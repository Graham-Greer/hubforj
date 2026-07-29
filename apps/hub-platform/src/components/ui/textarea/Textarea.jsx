import fieldStyles from "@/components/ui/field-control/FieldControl.module.css";
import styles from "./Textarea.module.css";

export default function Textarea({ label, hint, reserveHintSpace = false, id, className = "", requiredIndicator, ...rest }) {
  const textareaId = id || rest.name;
  const shouldRenderHint = Boolean(hint) || reserveHintSpace;
  const shouldShowRequiredIndicator = requiredIndicator || rest.required;

  return (
    <label className={[fieldStyles.root, styles.root, className].filter(Boolean).join(" ")} htmlFor={textareaId}>
      {label ? (
        <span className={fieldStyles.labelWrap}>
          <span className={fieldStyles.label}>{label}</span>
          {shouldShowRequiredIndicator ? <span className={fieldStyles.requiredMark}>Required</span> : null}
        </span>
      ) : null}
      <textarea id={textareaId} className={[fieldStyles.control, styles.control].filter(Boolean).join(" ")} {...rest} />
      {shouldRenderHint ? <span className={fieldStyles.hint} aria-hidden={!hint}>{hint || "\u00A0"}</span> : null}
    </label>
  );
}
