"use client";

import { useState } from "react";
import Icon from "@/components/ui/icon/Icon";
import styles from "./page.module.css";

export default function AccountDomainCopyButton({ value, label = "Copy" }) {
  const [state, setState] = useState("idle");
  const disabled = !value;

  async function handleCopy() {
    if (!value) {
      return;
    }

    try {
      await navigator.clipboard.writeText(value);
      setState("copied");
      window.setTimeout(() => setState("idle"), 1800);
    } catch {
      setState("error");
      window.setTimeout(() => setState("idle"), 2400);
    }
  }

  return (
    <button
      type="button"
      className={styles.copyButton}
      onClick={handleCopy}
      disabled={disabled}
      aria-label={`${label}: ${value || "not available"}`}
      title={state === "copied" ? "Copied" : state === "error" ? "Could not copy" : label}
    >
      <Icon name="content_copy" size="sm" decorative />
      <span className={styles.copyButtonText}>{state === "copied" ? "Copied" : state === "error" ? "Try again" : label}</span>
    </button>
  );
}
