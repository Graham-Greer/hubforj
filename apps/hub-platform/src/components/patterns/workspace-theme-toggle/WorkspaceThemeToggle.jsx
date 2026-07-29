"use client";

import { useRouter } from "next/navigation";
import Button from "@/components/ui/button/Button";
import Icon from "@/components/ui/icon/Icon";
import { normalizeOperatorTheme, operatorThemeCookieName } from "@/lib/theme/operator-theme";
import styles from "./WorkspaceThemeToggle.module.css";

const oneYearInSeconds = 60 * 60 * 24 * 365;

export default function WorkspaceThemeToggle({ currentTheme }) {
  const router = useRouter();
  const normalizedTheme = normalizeOperatorTheme(currentTheme);
  const nextTheme = normalizedTheme === "dark" ? "light" : "dark";

  function handleToggle() {
    document.cookie = `${operatorThemeCookieName}=${nextTheme}; Path=/; Max-Age=${oneYearInSeconds}; SameSite=Lax`;

    document.querySelectorAll('[data-workspace-theme-scope="operator"]').forEach((node) => {
      node.setAttribute("data-theme", nextTheme);
    });

    router.refresh();
  }

  return (
    <Button
      type="button"
      variant="secondary"
      onClick={handleToggle}
      className={styles.root}
      aria-label={`Switch workspace theme to ${nextTheme}`}
      title={`Switch workspace theme to ${nextTheme}`}
    >
      <Icon name={normalizedTheme === "dark" ? "light_mode" : "dark_mode"} size="md" />
      <span>{normalizedTheme === "dark" ? "Light" : "Dark"}</span>
    </Button>
  );
}
