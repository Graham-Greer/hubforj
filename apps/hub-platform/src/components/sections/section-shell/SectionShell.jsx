import styles from "./SectionShell.module.css";

const spacingClassNames = {
  none: styles.spacingNone,
  default: styles.spacingDefault,
  compact: styles.spacingCompact,
  spacious: styles.spacingSpacious,
};

const surfaceClassNames = {
  transparent: styles.surfaceTransparent,
  subtle: styles.surfaceSubtle,
  primary: styles.surfacePrimary,
  inverse: styles.surfaceInverse,
};

const dividerClassNames = {
  none: "",
  top: styles.dividerTop,
  bottom: styles.dividerBottom,
};

export default function SectionShell({
  as: Component = "section",
  id,
  className = "",
  spacing = "default",
  spacingTop,
  spacingBottom,
  surface = "transparent",
  divider = "none",
  ariaLabel,
  ariaLabelledby,
  children,
}) {
  const topSpacingClassName = spacingTop ? styles[`spacingTop${spacingTop.charAt(0).toUpperCase()}${spacingTop.slice(1)}`] : "";
  const bottomSpacingClassName = spacingBottom ? styles[`spacingBottom${spacingBottom.charAt(0).toUpperCase()}${spacingBottom.slice(1)}`] : "";

  const rootClassName = [
    styles.root,
    surfaceClassNames[surface] || surfaceClassNames.transparent,
    spacingClassNames[spacing] || spacingClassNames.default,
    topSpacingClassName,
    bottomSpacingClassName,
    dividerClassNames[divider] || "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Component
      id={id}
      className={rootClassName}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledby}
    >
      {children}
    </Component>
  );
}
