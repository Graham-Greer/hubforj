"use client";

import styles from "./Input.module.css";

export default function Input({ id, leftIcon, rightIcon, className = "", ...rest }) {
  return (
    <div className={[styles.wrap, className].filter(Boolean).join(" ")}>
      {leftIcon ? <span className={styles.icon}>{leftIcon}</span> : null}
      <input id={id} className={styles.input} {...rest} />
      {rightIcon ? <span className={styles.icon}>{rightIcon}</span> : null}
    </div>
  );
}
