import NextLink from "next/link";
import Icon from "../../primitives/icon/Icon";
import Spinner from "../spinner/Spinner";
import styles from "./Button.module.css";

function ButtonInner({ children, loading, leftIcon, rightIcon, icon, iconOnly, ...rest }) {
  return (
    <button {...rest}>
      {loading ? <Spinner size="sm" ariaLabel="Loading" /> : null}
      {!loading && leftIcon ? <Icon name={leftIcon} decorative /> : null}
      {!loading && icon ? <Icon name={icon} decorative /> : null}
      {!iconOnly ? <span>{children}</span> : null}
      {!loading && rightIcon ? <Icon name={rightIcon} decorative /> : null}
    </button>
  );
}

export default function Button({
  href,
  external = false,
  loading = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  icon,
  ariaLabel,
  intent = "neutral",
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...rest
}) {
  const iconOnly = Boolean(icon) && !children;
  const resolvedAriaLabel = iconOnly ? ariaLabel || "Button action" : undefined;
  const classes = [
    styles.root,
    styles[`intent_${intent}`],
    styles[`variant_${variant}`],
    styles[`size_${size}`],
    fullWidth ? styles.fullWidth : "",
    iconOnly ? styles.iconOnly : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (href) {
    if (external) {
      return (
        <a
          className={classes}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={resolvedAriaLabel}
        >
          {loading ? <Spinner size="sm" ariaLabel="Loading" /> : null}
          {!loading && leftIcon ? <Icon name={leftIcon} decorative /> : null}
          {!loading && icon ? <Icon name={icon} decorative /> : null}
          {!iconOnly ? <span>{children}</span> : null}
          {!loading && rightIcon ? <Icon name={rightIcon} decorative /> : null}
        </a>
      );
    }

    return (
      <NextLink className={classes} href={href} aria-label={resolvedAriaLabel}>
        {loading ? <Spinner size="sm" ariaLabel="Loading" /> : null}
        {!loading && leftIcon ? <Icon name={leftIcon} decorative /> : null}
        {!loading && icon ? <Icon name={icon} decorative /> : null}
        {!iconOnly ? <span>{children}</span> : null}
        {!loading && rightIcon ? <Icon name={rightIcon} decorative /> : null}
      </NextLink>
    );
  }

  return (
    <ButtonInner
      className={classes}
      type="button"
      disabled={loading || rest.disabled}
      loading={loading}
      leftIcon={leftIcon}
      rightIcon={rightIcon}
      icon={icon}
      iconOnly={iconOnly}
      aria-label={resolvedAriaLabel}
      {...rest}
    >
      {children}
    </ButtonInner>
  );
}
