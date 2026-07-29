"use client";

import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import styles from "./MarketingSelect.module.css";

function joinClassNames(...values) {
  return values.filter(Boolean).join(" ");
}

function normalizeValue(value) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value);
}

function findEnabledIndex(options, startIndex, direction) {
  if (!options.length) {
    return -1;
  }

  let index = startIndex;

  while (index >= 0 && index < options.length) {
    if (!options[index]?.disabled) {
      return index;
    }

    index += direction;
  }

  return -1;
}

function getTypeaheadMatch(options, query, startIndex) {
  if (!query) {
    return -1;
  }

  const total = options.length;
  if (!total) {
    return -1;
  }

  const normalizedQuery = query.toLowerCase();

  for (let offset = 0; offset < total; offset += 1) {
    const index = (startIndex + offset) % total;
    const option = options[index];
    if (option?.disabled) {
      continue;
    }

    if (String(option.label || "").toLowerCase().startsWith(normalizedQuery)) {
      return index;
    }
  }

  return -1;
}

export default function MarketingSelect({
  label,
  hint = "",
  name,
  value,
  onChange,
  options = [],
  placeholder = "",
  className = "",
  disabled = false,
  id,
  ariaLabel,
}) {
  const generatedId = useId();
  const selectId = id || name || generatedId;
  const menuId = `${selectId}-menu`;
  const labelId = `${selectId}-label`;
  const hintId = hint ? `${selectId}-hint` : undefined;
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const listboxRef = useRef(null);
  const typeaheadTimeoutRef = useRef(null);
  const typeaheadBufferRef = useRef("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [verticalDirection, setVerticalDirection] = useState("down");

  const normalizedValue = normalizeValue(value);
  const selectedIndex = useMemo(
    () => options.findIndex((option) => normalizeValue(option.value) === normalizedValue),
    [normalizedValue, options],
  );
  const selectedOption = selectedIndex >= 0 ? options[selectedIndex] : null;
  const displayLabel = selectedOption?.label || placeholder || "";

  useLayoutEffect(() => {
    if (!open) {
      return undefined;
    }

    function updatePlacement() {
      const root = rootRef.current;
      const menu = listboxRef.current;
      if (!root || !menu) {
        return;
      }

      const rootRect = root.getBoundingClientRect();
      const menuHeight = menu.offsetHeight;
      const viewportHeight = window.innerHeight;
      const gap = 8;
      const spaceBelow = viewportHeight - rootRect.bottom - gap;
      const spaceAbove = rootRect.top - gap;
      const shouldOpenUp = spaceBelow < menuHeight && spaceAbove >= menuHeight;

      setVerticalDirection(shouldOpenUp ? "up" : "down");
    }

    updatePlacement();

    function handlePointerDown(event) {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
      }
    }

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", updatePlacement);
    window.addEventListener("scroll", updatePlacement, true);

    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", updatePlacement);
      window.removeEventListener("scroll", updatePlacement, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    requestAnimationFrame(() => {
      listboxRef.current?.focus();
    });

    return undefined;
  }, [open]);

  useEffect(() => {
    if (!open || activeIndex < 0) {
      return undefined;
    }

    const activeOption = rootRef.current?.querySelector(`[data-option-index="${activeIndex}"]`);
    activeOption?.scrollIntoView({ block: "nearest" });
    return undefined;
  }, [activeIndex, open]);

  useEffect(
    () => () => {
      if (typeaheadTimeoutRef.current) {
        window.clearTimeout(typeaheadTimeoutRef.current);
      }
    },
    [],
  );

  function openMenu(nextActiveIndex = -1) {
    if (disabled) {
      return;
    }

    const resolvedIndex =
      nextActiveIndex >= 0
        ? nextActiveIndex
        : selectedIndex >= 0
          ? selectedIndex
          : findEnabledIndex(options, 0, 1);

    setActiveIndex(resolvedIndex);
    setOpen(true);
  }

  function closeMenu({ restoreFocus = false } = {}) {
    setOpen(false);

    if (restoreFocus) {
      requestAnimationFrame(() => {
        triggerRef.current?.focus();
      });
    }
  }

  function commitValue(nextValue) {
    if (!onChange) {
      return;
    }

    onChange(normalizeValue(nextValue));
  }

  function moveActiveIndex(direction) {
    if (!options.length) {
      return;
    }

    const startIndex =
      activeIndex >= 0
        ? activeIndex + direction
        : selectedIndex >= 0
          ? selectedIndex + direction
          : direction > 0
            ? 0
            : options.length - 1;

    const nextIndex = findEnabledIndex(options, startIndex, direction);
    if (nextIndex >= 0) {
      setActiveIndex(nextIndex);
    }
  }

  function handleTriggerKeyDown(event) {
    if (disabled) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      openMenu(selectedIndex >= 0 ? selectedIndex : findEnabledIndex(options, 0, 1));
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      openMenu(selectedIndex >= 0 ? selectedIndex : findEnabledIndex(options, options.length - 1, -1));
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (open) {
        closeMenu();
      } else {
        openMenu();
      }
    }
  }

  function handleListboxKeyDown(event) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      moveActiveIndex(1);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      moveActiveIndex(-1);
      return;
    }

    if (event.key === "Home") {
      event.preventDefault();
      setActiveIndex(findEnabledIndex(options, 0, 1));
      return;
    }

    if (event.key === "End") {
      event.preventDefault();
      setActiveIndex(findEnabledIndex(options, options.length - 1, -1));
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (activeIndex >= 0 && !options[activeIndex]?.disabled) {
        commitValue(options[activeIndex].value);
        closeMenu({ restoreFocus: true });
      }
      return;
    }

    if (event.key.length === 1 && /\S/.test(event.key)) {
      const nextQuery = `${typeaheadBufferRef.current}${event.key.toLowerCase()}`;
      const matchIndex = getTypeaheadMatch(
        options,
        nextQuery,
        activeIndex >= 0 ? activeIndex + 1 : selectedIndex >= 0 ? selectedIndex + 1 : 0,
      );

      if (matchIndex >= 0) {
        event.preventDefault();
        setActiveIndex(matchIndex);
      }

      typeaheadBufferRef.current = nextQuery;
      if (typeaheadTimeoutRef.current) {
        window.clearTimeout(typeaheadTimeoutRef.current);
      }

      typeaheadTimeoutRef.current = window.setTimeout(() => {
        typeaheadBufferRef.current = "";
      }, 500);
    }
  }

  return (
    <div className={joinClassNames("form-field", styles.root, className)} ref={rootRef} data-open={open ? "true" : "false"}>
      {label ? (
        <label id={labelId} htmlFor={selectId} className="form-label">
          {label}
        </label>
      ) : null}
      <input type="hidden" name={name} value={normalizedValue} />
      <div className={styles.controlWrap}>
        <button
          id={selectId}
          ref={triggerRef}
          type="button"
          className={joinClassNames(styles.trigger, open ? styles.triggerOpen : "", !selectedOption && placeholder ? styles.triggerPlaceholder : "")}
          aria-haspopup="listbox"
          aria-expanded={open ? "true" : "false"}
          aria-controls={open ? menuId : undefined}
          aria-labelledby={label ? labelId : undefined}
          aria-label={ariaLabel || label}
          aria-describedby={hintId}
          disabled={disabled}
          onClick={() => {
            if (open) {
              closeMenu();
            } else {
              openMenu();
            }
          }}
          onKeyDown={handleTriggerKeyDown}
        >
          <span className={styles.triggerLabel}>{displayLabel}</span>
          <span className={joinClassNames("material-symbols-outlined", styles.chevron)} aria-hidden="true">
            expand_more
          </span>
        </button>
        {open ? (
          <div
            id={menuId}
            ref={listboxRef}
            role="listbox"
            tabIndex={-1}
            className={joinClassNames(styles.menu, verticalDirection === "up" ? styles.menuUp : styles.menuDown)}
            aria-labelledby={label ? labelId : undefined}
            aria-activedescendant={activeIndex >= 0 ? `${selectId}-option-${activeIndex}` : undefined}
            onKeyDown={handleListboxKeyDown}
          >
            {options.map((option, index) => {
              const normalizedOptionValue = normalizeValue(option.value);
              const isSelected = normalizedOptionValue === normalizedValue;
              const isActive = index === activeIndex;

              return (
                <button
                  key={`${normalizedOptionValue}:${option.label}`}
                  id={`${selectId}-option-${index}`}
                  type="button"
                  role="option"
                  className={joinClassNames(
                    styles.option,
                    isActive ? styles.optionActive : "",
                    isSelected ? styles.optionSelected : "",
                  )}
                  aria-selected={isSelected ? "true" : "false"}
                  disabled={option.disabled}
                  data-option-index={index}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => {
                    commitValue(option.value);
                    closeMenu({ restoreFocus: true });
                  }}
                >
                  <span className={styles.optionLabel}>{option.label}</span>
                  {isSelected ? (
                    <span className={joinClassNames("material-symbols-outlined", styles.optionIcon)} aria-hidden="true">
                      check
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
      {hint ? (
        <span id={hintId} className="form-helper">
          {hint}
        </span>
      ) : null}
    </div>
  );
}
