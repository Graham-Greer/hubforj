"use client";

import Input from "../../ui/form/input/Input";
import Select from "../../ui/form/select/Select";
import styles from "./FilterBar.module.css";

export default function FilterBar({ search = "", filters = [], onChange, variant = "default" }) {
  return (
    <div className={[styles.root, styles[`variant_${variant}`]].join(" ")}>
      <Input
        value={search}
        onChange={(event) => onChange?.({ type: "search", value: event.target.value })}
        placeholder="Search"
      />
      {filters.map((filter) => (
        <Select
          key={filter.key}
          options={filter.options || []}
          value={filter.value || ""}
          placeholder={filter.label}
          onChange={(value) => onChange?.({ type: filter.key, value })}
        />
      ))}
    </div>
  );
}
