"use client";

import { useEffect, useId, useRef, useState } from "react";
import Icon from "@/components/ui/icon/Icon";
import SearchField from "@/components/ui/search-field/SearchField";
import styles from "./SectionSearchFilters.module.css";

export default function SectionSearchFilters({
  searchName = "section-search",
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search",
  searchLabel = "Search",
  filterOptions = [],
  activeFilter,
  onFilterChange,
  filterTriggerLabel = "Open filters",
  filterMenuLabel = "Filters",
  contextText = "",
  className = "",
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const rootRef = useRef(null);
  const menuId = useId();
  const hasFilters = filterOptions.length > 1;
  const isFilterActive = hasFilters && activeFilter && activeFilter !== filterOptions[0]?.value;

  useEffect(() => {
    if (!menuOpen) {
      return undefined;
    }

    function handlePointerDown(event) {
      if (!rootRef.current?.contains(event.target)) {
        setMenuOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  function handleFilterSelect(value) {
    onFilterChange?.(value);
    setMenuOpen(false);
  }

  return (
    <div ref={rootRef} className={[styles.root, className].filter(Boolean).join(" ")}>
      <div className={styles.controls}>
        <SearchField
          name={searchName}
          label={searchLabel}
          labelVisibility="hidden"
          size="sm"
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(event) => onSearchChange?.(event.target.value)}
          className={styles.search}
        />

        {hasFilters ? (
          <div className={styles.filterWrap}>
            <button
              type="button"
              className={[styles.filterTrigger, isFilterActive ? styles.filterTriggerActive : ""].filter(Boolean).join(" ")}
              aria-label={filterTriggerLabel}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-controls={menuOpen ? menuId : undefined}
              onClick={() => setMenuOpen((current) => !current)}
            >
              <Icon name="filter_list" size="md" decorative className={styles.filterIcon} />
            </button>

            {menuOpen ? (
              <div id={menuId} role="menu" aria-label={filterMenuLabel} className={styles.menu}>
                {filterOptions.map((option) => {
                  const selected = activeFilter === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="menuitemradio"
                      aria-checked={selected}
                      className={[styles.menuOption, selected ? styles.menuOptionActive : ""].filter(Boolean).join(" ")}
                      onClick={() => handleFilterSelect(option.value)}
                    >
                      <span>{option.label}</span>
                      {selected ? <Icon name="check" size="sm" tone="accent" decorative /> : null}
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      {contextText ? <p className={styles.context}>{contextText}</p> : null}
    </div>
  );
}
