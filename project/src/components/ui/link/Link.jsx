import NextLink from "next/link";
import styles from "./Link.module.css";

export default function Link({ href, external = false, tone = "default", underline = true, className = "", children, ...rest }) {
  const classes = [styles.root, styles[`tone_${tone}`], underline ? styles.underline : styles.noUnderline, className]
    .filter(Boolean)
    .join(" ");

  if (external) {
    return (
      <a className={classes} href={href} target="_blank" rel="noopener noreferrer" {...rest}>
        {children}
      </a>
    );
  }

  return (
    <NextLink className={classes} href={href} {...rest}>
      {children}
    </NextLink>
  );
}
