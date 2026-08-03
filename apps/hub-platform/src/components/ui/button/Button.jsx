import Link from "next/link";
import styles from "./Button.module.css";

const variantClassNames = {
  primary: styles.variantPrimary,
  secondary: styles.variantSecondary,
  ghost: styles.variantGhost,
  flat: styles.variantFlat,
};

const sizeClassNames = {
  md: "",
  lg: styles.sizeLg,
  sm: styles.sizeSm,
};

export default function Button({
  href,
  prefetch,
  type = "button",
  variant = "primary",
  size = "md",
  iconOnly = false,
  children,
  className = "",
  ...rest
}) {
  const variantClassName = variantClassNames[variant] || variantClassNames.primary;
  const sizeClassName = sizeClassNames[size] || "";
  const classes = [styles.root, variantClassName, sizeClassName, iconOnly ? styles.iconOnly : "", className].filter(Boolean).join(" ");
  const isExternalHref = typeof href === "string" && /^(https?:)?\/\//.test(href);
  const shouldUseAnchor = isExternalHref || rest.download !== undefined || rest.target === "_blank";

  if (href) {
    if (shouldUseAnchor) {
      return (
        <a href={href} className={classes} {...rest}>
          {children}
        </a>
      );
    }

    return (
      <Link href={href} prefetch={prefetch} className={classes} {...rest}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} className={classes} {...rest}>
      {children}
    </button>
  );
}
