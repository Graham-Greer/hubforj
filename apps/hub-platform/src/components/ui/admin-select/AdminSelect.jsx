"use client";

import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import fieldStyles from "@/components/ui/field-control/FieldControl.module.css";
import Icon from "@/components/ui/icon/Icon";
import styles from "./AdminSelect.module.css";

function joinClassNames(...values) {
  return values.filter(Boolean).join(" ");
}

function normalizeValue(value) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value);
}

function resolveInitialValue({ defaultValue, options, placeholder }) {
  if (defaultValue !== null && defaultValue !== undefined) {
    return normalizeValue(defaultValue);
  }

  if (placeholder) {
    return "";
  }

  const firstEnabledOption = options.find((option) => !option.disabled);
  return firstEnabledOption ? normalizeValue(firstEnabledOption.value) : "";
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

export default function AdminSelect({
  label,
  hint,
  reserveHintSpace = false,
  labelVisibility = "visible",
  requiredIndicator,
  size = "md",
  id,
  name,
  options = [],
  className = "",
  value,
  defaultValue,
  onChange,
  disabled = false,
  placeholder = "",
  ...rest
}) {
  const generatedId = useId();
  const selectId = id || name || generatedId;
  const menuId = `${selectId}-menu`;
  const hintId = hint ? `${selectId}-hint` : undefined;
  const labelId = label ? `${selectId}-label` : undefined;
  const shouldRenderHint = Boolean(hint) || reserveHintSpace;
  const labelClassName = labelVisibility === "hidden" ? fieldStyles.visuallyHidden : fieldStyles.label;
  const controlSizeClassName = size === "sm" ? fieldStyles.compactControl : "";
  const shouldShowRequiredIndicator = requiredIndicator || rest.required;
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(() =>
    resolveInitialValue({ defaultValue, options, placeholder }),
  );
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [verticalDirection, setVerticalDirection] = useState("down");
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const listboxRef = useRef(null);
  const hiddenInputRef = useRef(null);
  const typeaheadTimeoutRef = useRef(null);
  const typeaheadBufferRef = useRef("");

  const normalizedControlledValue = normalizeValue(value);
  const currentValue = isControlled ? normalizedControlledValue : internalValue;

  const selectedIndex = useMemo(
    () => options.findIndex((option) => normalizeValue(option.value) === currentValue),
    [currentValue, options],
  );

  const selectedOption = selectedIndex >= 0 ? options[selectedIndex] : null;

  if (!isControlled) {
    const hasCurrentOption = options.some((option) => normalizeValue(option.value) === internalValue);
    const canKeepPlaceholderValue = internalValue === "" && placeholder;
    const nextInternalValue = resolveInitialValue({ defaultValue, options, placeholder });

    if (!hasCurrentOption && !canKeepPlaceholderValue && internalValue !== nextInternalValue) {
      setInternalValue(nextInternalValue);
    }
  }

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

    const handlePointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

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

  function syncHiddenInputEvents() {
    requestAnimationFrame(() => {
      if (!hiddenInputRef.current) {
        return;
      }

      hiddenInputRef.current.dispatchEvent(new Event("input", { bubbles: true }));
      hiddenInputRef.current.dispatchEvent(new Event("change", { bubbles: true }));
    });
  }

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
    if (!isControlled) {
      setInternalValue(nextValue);
    }

    onChange?.({
      target: { name, value: nextValue },
      currentTarget: { name, value: nextValue },
    });

    syncHiddenInputEvents();
  }

  function handleSelect(optionIndex) {
    const option = options[optionIndex];
    if (!option || option.disabled) {
      return;
    }

    const nextValue = normalizeValue(option.value);
    commitValue(nextValue);
    closeMenu({ restoreFocus: true });
  }

  function handleTriggerKeyDown(event) {
    if (disabled) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      const firstIndex =
        selectedIndex >= 0 ? selectedIndex : findEnabledIndex(options, 0, 1);
      openMenu(firstIndex);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      const lastIndex =
        selectedIndex >= 0 ? selectedIndex : findEnabledIndex(options, options.length - 1, -1);
      openMenu(lastIndex);
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openMenu();
    }
  }

  function handleListboxKeyDown(event) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      const nextIndex = findEnabledIndex(options, activeIndex + 1, 1);
      if (nextIndex >= 0) {
        setActiveIndex(nextIndex);
      }
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      const nextIndex = findEnabledIndex(options, activeIndex - 1, -1);
      if (nextIndex >= 0) {
        setActiveIndex(nextIndex);
      }
      return;
    }

    if (event.key === "Home") {
      event.preventDefault();
      const firstIndex = findEnabledIndex(options, 0, 1);
      if (firstIndex >= 0) {
        setActiveIndex(firstIndex);
      }
      return;
    }

    if (event.key === "End") {
      event.preventDefault();
      const lastIndex = findEnabledIndex(options, options.length - 1, -1);
      if (lastIndex >= 0) {
        setActiveIndex(lastIndex);
      }
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleSelect(activeIndex);
      return;
    }

    if (event.key === "Tab") {
      closeMenu();
      return;
    }

    if (event.key.length === 1 && !event.altKey && !event.ctrlKey && !event.metaKey) {
      typeaheadBufferRef.current += event.key.toLowerCase();
      if (typeaheadTimeoutRef.current) {
        window.clearTimeout(typeaheadTimeoutRef.current);
      }

      typeaheadTimeoutRef.current = window.setTimeout(() => {
        typeaheadBufferRef.current = "";
      }, 350);

      const startIndex = activeIndex >= 0 ? activeIndex + 1 : 0;
      const matchIndex = getTypeaheadMatch(options, typeaheadBufferRef.current, startIndex);
      if (matchIndex >= 0) {
        setActiveIndex(matchIndex);
      }
    }
  }

  const displayLabel = selectedOption?.label || placeholder || "";

  return (
    <label className={joinClassNames(fieldStyles.root, styles.root, className)} htmlFor={selectId}>
      {label ? (
        <span className={labelVisibility === "hidden" ? labelClassName : fieldStyles.labelWrap}>
          <span id={labelId} className={labelClassName}>{label}</span>
          {labelVisibility !== "hidden" && shouldShowRequiredIndicator ? <span className={fieldStyles.requiredMark}>Required</span> : null}
        </span>
      ) : null}
      {name ? <input ref={hiddenInputRef} type="hidden" name={name} value={currentValue} /> : null}
      <span ref={rootRef} className={styles.controlWrap}>
        <button
          {...rest}
          ref={triggerRef}
          id={selectId}
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={open ? menuId : undefined}
          aria-describedby={hintId}
          aria-labelledby={label ? labelId : undefined}
          disabled={disabled}
          className={joinClassNames(
            fieldStyles.control,
            controlSizeClassName,
            styles.trigger,
            size === "sm" ? styles.triggerSm : "",
            open ? styles.triggerOpen : "",
          )}
          onClick={() => {
            if (open) {
              closeMenu();
            } else {
              openMenu();
            }
          }}
          onKeyDown={handleTriggerKeyDown}
        >
          <span className={joinClassNames(styles.value, !selectedOption && placeholder ? styles.placeholder : "")}>
            {displayLabel}
          </span>
          <Icon
            name={open ? "expand_less" : "expand_more"}
            size="sm"
            tone="muted"
            decorative
            className={styles.icon}
          />
        </button>

        {open ? (
          <div
            id={menuId}
            ref={listboxRef}
            role="listbox"
            tabIndex={-1}
            aria-activedescendant={activeIndex >= 0 ? `${selectId}-option-${activeIndex}` : undefined}
            className={joinClassNames(
              styles.menu,
              verticalDirection === "up" ? styles.openUp : styles.openDown,
            )}
            onKeyDown={handleListboxKeyDown}
          >
            <div className={styles.list}>
              {options.map((option, index) => {
                const optionValue = normalizeValue(option.value);
                const isSelected = optionValue === currentValue;
                const isActive = index === activeIndex;

                return (
                  <button
                    key={`${optionValue}:${index}`}
                    id={`${selectId}-option-${index}`}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    data-option-index={index}
                    disabled={option.disabled}
                    tabIndex={-1}
                    className={joinClassNames(
                      styles.option,
                      isSelected ? styles.optionSelected : "",
                      isActive ? styles.optionActive : "",
                    )}
                    onMouseEnter={() => {
                      if (!option.disabled) {
                        setActiveIndex(index);
                      }
                    }}
                    onClick={() => handleSelect(index)}
                  >
                    <span>{option.label}</span>
                    {isSelected ? <Icon name="check" size="sm" tone="accent" decorative /> : null}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
      </span>
      {shouldRenderHint ? <span id={hintId} className={fieldStyles.hint} aria-hidden={!hint}>{hint || "\u00A0"}</span> : null}
    </label>
  );
}
