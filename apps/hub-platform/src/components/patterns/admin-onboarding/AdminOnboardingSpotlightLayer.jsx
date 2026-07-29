"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { resolveAdminOnboardingTargetSelector } from "@/lib/admin-onboarding/selectors";
import Button from "@/components/ui/button/Button";
import Icon from "@/components/ui/icon/Icon";
import AdminOnboardingVideoFrame from "./AdminOnboardingVideoFrame";
import styles from "./AdminOnboardingSpotlightLayer.module.css";

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function resolveSpotlightInset(step) {
  const rawInset = Number(step?.target?.inset);
  if (Number.isFinite(rawInset) && rawInset >= 0) {
    return rawInset;
  }

  return 8;
}

function buildSpotlightBox(rect, viewport, inset = 12) {
  if (!rect) {
    return null;
  }

  const insetLeft = Math.min(inset, Math.max(0, rect.left));
  const insetTop = Math.min(inset, Math.max(0, rect.top));
  const insetRight = Math.min(inset, Math.max(0, viewport.width - rect.right));
  const insetBottom = Math.min(inset, Math.max(0, viewport.height - rect.bottom));

  const left = rect.left - insetLeft;
  const top = rect.top - insetTop;
  const right = rect.right + insetRight;
  const bottom = rect.bottom + insetBottom;

  return {
    left,
    top,
    right,
    bottom,
    width: right - left,
    height: bottom - top,
  };
}

function toPlainRect(rect) {
  if (!rect) {
    return null;
  }

  return {
    left: rect.left,
    top: rect.top,
    right: rect.right,
    bottom: rect.bottom,
    width: rect.width,
    height: rect.height,
  };
}

function rectsOverlapOrTouch(left, right, gap = 20) {
  return !(
    left.right + gap < right.left ||
    right.right + gap < left.left ||
    left.bottom + gap < right.top ||
    right.bottom + gap < left.top
  );
}

function mergeRectangles(rects = []) {
  const pending = [...rects]
    .filter((rect) => rect && rect.width && rect.height)
    .sort((left, right) => {
      if (left.top !== right.top) {
        return left.top - right.top;
      }

      return left.left - right.left;
    });

  const merged = [];

  pending.forEach((rect) => {
    const last = merged[merged.length - 1];

    if (!last || !rectsOverlapOrTouch(last, rect)) {
      merged.push(toPlainRect(rect));
      return;
    }

    last.left = Math.min(last.left, rect.left);
    last.top = Math.min(last.top, rect.top);
    last.right = Math.max(last.right, rect.right);
    last.bottom = Math.max(last.bottom, rect.bottom);
    last.width = last.right - last.left;
    last.height = last.bottom - last.top;
  });

  return merged;
}

function resolveTargetElement(step) {
  const targetKeys = Array.isArray(step?.target?.keys)
    ? step.target.keys
    : step?.target?.key
      ? [step.target.key]
      : [];
  const selectors = targetKeys
    .map((targetKey) => resolveAdminOnboardingTargetSelector(targetKey))
    .filter(Boolean);
  if (selectors.length > 1 && typeof window !== "undefined") {
    return selectors
      .map((selector) => document.querySelector(selector))
      .filter(Boolean);
  }

  const targetKey = step?.target?.key || "";
  const selector = resolveAdminOnboardingTargetSelector(targetKey);
  if (!selector || typeof window === "undefined") {
    return null;
  }

  return document.querySelector(selector);
}

function getPrimaryTargetElement(target) {
  return Array.isArray(target) ? target[0] || null : target;
}

function measureTarget(element) {
  if (Array.isArray(element)) {
    const rects = element
      .map((entry) => entry?.getBoundingClientRect?.())
      .filter((rect) => rect && rect.width && rect.height);
    return rects.length ? mergeRectangles(rects) : null;
  }

  if (!element) {
    return null;
  }

  const rect = element.getBoundingClientRect();
  if (!rect.width || !rect.height) {
    return null;
  }

  return rect;
}

function isTargetComfortablyVisible(rect) {
  if (!rect || typeof window === "undefined") {
    return true;
  }

  if (Array.isArray(rect)) {
    return rect.every((entry) => isTargetComfortablyVisible(entry));
  }

  const insetTop = 96;
  const insetBottom = 140;
  const insetSide = 24;

  return (
    rect.top >= insetTop &&
    rect.bottom <= window.innerHeight - insetBottom &&
    rect.left >= insetSide &&
    rect.right <= window.innerWidth - insetSide
  );
}

function buildPanelStyle(rect, placement = "center") {
  if (!rect || typeof window === "undefined" || window.innerWidth < 960) {
    return {};
  }

  const panelRect = Array.isArray(rect)
    ? {
        left: Math.min(...rect.map((entry) => entry.left)),
        right: Math.max(...rect.map((entry) => entry.right)),
        top: Math.min(...rect.map((entry) => entry.top)),
        bottom: Math.max(...rect.map((entry) => entry.bottom)),
        width: Math.max(...rect.map((entry) => entry.right)) - Math.min(...rect.map((entry) => entry.left)),
        height: Math.max(...rect.map((entry) => entry.bottom)) - Math.min(...rect.map((entry) => entry.top)),
      }
    : rect;

  const panelWidth = Math.min(420, window.innerWidth - 32);
  const gap = 36;
  const maxLeft = window.innerWidth - panelWidth - 16;
  const centeredTop = clamp(window.innerHeight / 2 - 180, 16, window.innerHeight - 380);

  switch (placement) {
    case "right":
      return {
        left: `${clamp(panelRect.right + gap, 16, maxLeft)}px`,
        top: `${clamp(panelRect.top, 16, window.innerHeight - 380)}px`,
        transform: "none",
      };
    case "left":
      return {
        left: `${clamp(panelRect.left - panelWidth - gap, 16, maxLeft)}px`,
        top: `${clamp(panelRect.top, 16, window.innerHeight - 380)}px`,
        transform: "none",
      };
    case "top":
      return {
        left: `${clamp(panelRect.left, 16, maxLeft)}px`,
        top: `${clamp(panelRect.top - 300, 16, window.innerHeight - 380)}px`,
        transform: "none",
      };
    case "bottom":
      return {
        left: `${clamp(panelRect.left, 16, maxLeft)}px`,
        top: `${clamp(panelRect.bottom + gap, 16, window.innerHeight - 380)}px`,
        transform: "none",
      };
    default:
      return {
        left: `${clamp(window.innerWidth / 2 - panelWidth / 2, 16, maxLeft)}px`,
        top: `${centeredTop}px`,
      };
  }
}

function buildOverlayPath(rect, viewport, radius = 18, inset = 12) {
  if (!rect) {
    return "";
  }

  if (Array.isArray(rect)) {
    const fullPath = [`M0 0H${viewport.width}V${viewport.height}H0V0Z`];
    rect.forEach((entry) => {
      const spotlight = buildSpotlightBox(entry, viewport, inset);
      if (!spotlight) {
        return;
      }

      const { left, top, right, bottom, width, height } = spotlight;
      const r = Math.min(radius, width / 2, height / 2);

      fullPath.push(
        [
          `M${left + r} ${top}`,
          `H${right - r}`,
          `Q${right} ${top} ${right} ${top + r}`,
          `V${bottom - r}`,
          `Q${right} ${bottom} ${right - r} ${bottom}`,
          `H${left + r}`,
          `Q${left} ${bottom} ${left} ${bottom - r}`,
          `V${top + r}`,
          `Q${left} ${top} ${left + r} ${top}`,
          "Z",
        ].join(" ")
      );
    });
    return fullPath.join(" ");
  }

  const spotlight = buildSpotlightBox(rect, viewport, inset);
  if (!spotlight) {
    return "";
  }

  const { left, top, right, bottom, width, height } = spotlight;
  const r = Math.min(radius, width / 2, height / 2);
  const w = viewport.width;
  const h = viewport.height;

  return [
    `M0 0H${w}V${h}H0V0Z`,
    `M${left + r} ${top}`,
    `H${right - r}`,
    `Q${right} ${top} ${right} ${top + r}`,
    `V${bottom - r}`,
    `Q${right} ${bottom} ${right - r} ${bottom}`,
    `H${left + r}`,
    `Q${left} ${bottom} ${left} ${bottom - r}`,
    `V${top + r}`,
    `Q${left} ${top} ${left + r} ${top}`,
    "Z",
  ].join(" ");
}

export default function AdminOnboardingSpotlightLayer({
  journey,
  step,
  stepIndex = 0,
  theme = "light",
  reducedMotion = false,
  onClose,
  onNext,
}) {
  const [targetRect, setTargetRect] = useState(null);
  const [isSettled, setIsSettled] = useState(false);
  const [viewport, setViewport] = useState({ width: 1, height: 1 });
  const panelRef = useRef(null);
  const previousFocusedElementRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    let timeoutId = 0;
    let settleFrameOne = 0;
    let settleFrameTwo = 0;
    let resizeObserver = null;
    let mutationObserver = null;
    let retryIntervalId = 0;

    function updateViewport() {
      setViewport({
        width: window.innerWidth || 1,
        height: window.innerHeight || 1,
      });
    }

    function refresh() {
      updateViewport();
      const element = resolveTargetElement(step);
      setTargetRect(measureTarget(element));
    }

    function attachTargetObserver() {
      const observedTarget = getPrimaryTargetElement(resolveTargetElement(step));
      if (!observedTarget || typeof ResizeObserver === "undefined") {
        return;
      }

      resizeObserver?.disconnect?.();
      resizeObserver = new ResizeObserver(() => {
        refresh();
      });
      resizeObserver.observe(observedTarget);
    }

    function watchForLateTarget() {
      if (typeof MutationObserver !== "undefined" && document.body) {
        mutationObserver = new MutationObserver(() => {
          const element = resolveTargetElement(step);
          const rect = measureTarget(element);
          if (!rect || cancelled) {
            return;
          }

          setTargetRect(rect);
          attachTargetObserver();
          mutationObserver?.disconnect?.();
          mutationObserver = null;
        });
        mutationObserver.observe(document.body, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ["data-onboarding", "class", "style"],
        });
      }

      retryIntervalId = window.setInterval(() => {
        const element = resolveTargetElement(step);
        const rect = measureTarget(element);
        if (!rect || cancelled) {
          return;
        }

        setTargetRect(rect);
        attachTargetObserver();
        window.clearInterval(retryIntervalId);
        retryIntervalId = 0;
        mutationObserver?.disconnect?.();
        mutationObserver = null;
      }, 120);
    }

    async function prepareTarget() {
      setIsSettled(false);
      updateViewport();
      const element = resolveTargetElement(step);
      const primaryTarget = getPrimaryTargetElement(element);
      if (!element) {
        if (!cancelled) {
          setTargetRect(null);
          watchForLateTarget();
          setIsSettled(true);
        }
        return;
      }

      let rect = measureTarget(element);
      if (rect && !isTargetComfortablyVisible(rect)) {
        primaryTarget?.scrollIntoView?.({
          behavior: reducedMotion ? "auto" : "smooth",
          block: "center",
          inline: "nearest",
        });

        await new Promise((resolve) => {
          timeoutId = window.setTimeout(resolve, reducedMotion ? 40 : 260);
        });
        rect = measureTarget(element);
      }

      if (!cancelled) {
        setTargetRect(rect);
        attachTargetObserver();
        settleFrameOne = window.requestAnimationFrame(() => {
          settleFrameTwo = window.requestAnimationFrame(() => {
            if (cancelled) {
              return;
            }

            updateViewport();
            const settledRect = measureTarget(resolveTargetElement(step));
            setTargetRect(settledRect);
            if (!settledRect) {
              watchForLateTarget();
            }
            setIsSettled(true);
          });
        });
      }
    }

    prepareTarget();

    window.addEventListener("resize", refresh);
    window.addEventListener("scroll", refresh, true);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
      window.clearInterval(retryIntervalId);
      window.cancelAnimationFrame(settleFrameOne);
      window.cancelAnimationFrame(settleFrameTwo);
      resizeObserver?.disconnect?.();
      mutationObserver?.disconnect?.();
      window.removeEventListener("resize", refresh);
      window.removeEventListener("scroll", refresh, true);
    };
  }, [reducedMotion, step]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    previousFocusedElementRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.body.style.overflow = "hidden";

    const focusableSelector = [
      "button:not([disabled])",
      "[href]",
      "input:not([disabled])",
      "select:not([disabled])",
      "textarea:not([disabled])",
      '[tabindex]:not([tabindex="-1"])',
    ].join(", ");

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onClose?.();
        return;
      }

      if (event.key !== "Tab" || !panelRef.current) {
        return;
      }

      const focusableElements = [...panelRef.current.querySelectorAll(focusableSelector)].filter(
        (element) => !element.hasAttribute("disabled") && element.getAttribute("aria-hidden") !== "true"
      );

      if (!focusableElements.length) {
        event.preventDefault();
        panelRef.current.focus();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement;

      if (event.shiftKey && activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);

      window.requestAnimationFrame(() => {
        const previousFocusedElement = previousFocusedElementRef.current;
        if (
          previousFocusedElement &&
          previousFocusedElement.isConnected &&
          typeof previousFocusedElement.focus === "function" &&
          !previousFocusedElement.hasAttribute("disabled") &&
          previousFocusedElement.getAttribute("aria-hidden") !== "true"
        ) {
          previousFocusedElement.focus();
          return;
        }

        window.requestAnimationFrame(() => {
          document
            .querySelector('[data-onboarding-help-trigger="true"]')
            ?.focus?.();
        });
      });
    };
  }, [onClose]);

  useEffect(() => {
    if (!panelRef.current) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      panelRef.current?.querySelector('[data-onboarding-dialog-next="true"]')?.focus?.()
        || panelRef.current?.focus?.();
    }, reducedMotion ? 0 : 80);

    return () => window.clearTimeout(timeoutId);
  }, [reducedMotion, step?.id]);

  const highlightStyle = useMemo(() => {
    if (!targetRect || !step?.target?.spotlight) {
      return null;
    }

    const spotlightInset = resolveSpotlightInset(step);

    if (Array.isArray(targetRect)) {
      return targetRect
        .map((entry) => buildSpotlightBox(entry, viewport, spotlightInset))
        .filter(Boolean)
        .map((spotlight) => ({
          left: `${spotlight.left}px`,
          top: `${spotlight.top}px`,
          width: `${spotlight.width}px`,
          height: `${spotlight.height}px`,
        }));
    }

    const spotlight = buildSpotlightBox(targetRect, viewport, spotlightInset);
    if (!spotlight) {
      return null;
    }

    return {
      left: `${spotlight.left}px`,
      top: `${spotlight.top}px`,
      width: `${spotlight.width}px`,
      height: `${spotlight.height}px`,
    };
  }, [step, targetRect, viewport]);

  const panelStyle = useMemo(
    () => buildPanelStyle(targetRect, step?.target?.placement || "center"),
    [step, targetRect]
  );
  const overlayPath = useMemo(
    () => buildOverlayPath(targetRect, viewport, 18, resolveSpotlightInset(step)),
    [step, targetRect, viewport]
  );
  const fallbackOverlayPath = `M0 0H${viewport.width}V${viewport.height}H0V0Z`;

  return (
    <div className={styles.root} aria-live="polite">
      <div className={styles.blocker} aria-hidden="true" />
      <svg
        className={styles.overlay}
        data-theme-mode={theme}
        viewBox={`0 0 ${viewport.width} ${viewport.height}`}
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path className={styles.overlayPath} d={overlayPath || fallbackOverlayPath} fillRule="evenodd" />
      </svg>
      {Array.isArray(highlightStyle)
        ? highlightStyle.map((style, index) => <div key={`${step?.id || "highlight"}:${index}`} className={styles.highlight} style={style} />)
        : highlightStyle
          ? <div className={styles.highlight} style={highlightStyle} />
          : null}
      <section
        className={styles.panel}
        data-ready={isSettled ? "true" : "false"}
        data-reduced-motion={reducedMotion ? "true" : "false"}
        style={panelStyle}
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-onboarding-title"
        aria-describedby="admin-onboarding-body"
        tabIndex={-1}
        ref={panelRef}
      >
        <div className={styles.header}>
          <p className={styles.eyebrow}>
            Step {stepIndex + 1} of {journey.steps.length}
          </p>
          <Button
            type="button"
            variant="secondary"
            iconOnly
            aria-label="Close onboarding"
            title="Close onboarding"
            className={styles.closeButton}
            onClick={onClose}
          >
            <Icon name="close" decorative />
          </Button>
        </div>
        <div className={styles.content}>
          <h2 id="admin-onboarding-title" className={styles.title}>{step.title}</h2>
          <p id="admin-onboarding-body" className={styles.body}>{step.body}</p>
          {step.type === "video" ? (
            <AdminOnboardingVideoFrame assetKey={step.videoAssetKey} theme={theme} title={step.title} />
          ) : null}
        </div>
        <div className={styles.actions}>
          <Button type="button" variant="secondary" onClick={onClose}>
            Skip
          </Button>
          <Button type="button" variant="primary" onClick={onNext} data-onboarding-dialog-next="true">
            {step.ctaLabel || (stepIndex + 1 >= journey.steps.length ? "Finish" : "Next")}
          </Button>
        </div>
      </section>
    </div>
  );
}
