"use client";

import Button from "../button/Button";

export default function ThemeToggle({ value = "light", onChange, variant = "icon" }) {
  const next = value === "light" ? "dark" : "light";
  if (variant === "switch") {
    return (
      <label>
        <input type="checkbox" checked={value === "dark"} onChange={() => onChange?.(next)} />
        Theme
      </label>
    );
  }

  return (
    <Button icon={value === "light" ? "dark_mode" : "light_mode"} ariaLabel="Toggle theme" variant="tertiary" onClick={() => onChange?.(next)} />
  );
}
