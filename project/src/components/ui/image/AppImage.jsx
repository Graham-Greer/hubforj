import Image from "next/image";
import styles from "./AppImage.module.css";

export default function AppImage({
  src,
  alt,
  sizes,
  priority = false,
  fill = false,
  width,
  height,
  variant = "rounded",
  className = "",
  ...rest
}) {
  const classes = [styles.root, styles[`variant_${variant}`], className].filter(Boolean).join(" ");

  return (
    <div className={classes}>
      <Image
        src={src}
        alt={alt}
        sizes={sizes}
        priority={priority}
        fill={fill}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        className={styles.image}
        {...rest}
      />
    </div>
  );
}
