"use client";

import { useMemo, useState } from "react";

function normalizeString(value) {
  return String(value || "");
}

export default function useAutoSlugField({ title = "", slug = "", normalizeSlug }) {
  const normalizedInitialTitle = normalizeString(title);
  const normalizedInitialSlug = normalizeString(slug);
  const initialAutoSlug = useMemo(
    () => (typeof normalizeSlug === "function" ? normalizeSlug(normalizedInitialTitle) : ""),
    [normalizeSlug, normalizedInitialTitle]
  );
  const [titleValue, setTitleValue] = useState(normalizedInitialTitle);
  const [slugValue, setSlugValue] = useState(normalizedInitialSlug);
  const [isManualSlug, setIsManualSlug] = useState(
    Boolean(normalizedInitialSlug) && normalizedInitialSlug !== initialAutoSlug
  );
  const [lastInitialState, setLastInitialState] = useState({
    normalizeSlug,
    slug: normalizedInitialSlug,
    title: normalizedInitialTitle,
  });

  if (
    lastInitialState.normalizeSlug !== normalizeSlug ||
    lastInitialState.slug !== normalizedInitialSlug ||
    lastInitialState.title !== normalizedInitialTitle
  ) {
    setLastInitialState({
      normalizeSlug,
      slug: normalizedInitialSlug,
      title: normalizedInitialTitle,
    });
    setTitleValue(normalizedInitialTitle);
    setSlugValue(normalizedInitialSlug);
    setIsManualSlug(Boolean(normalizedInitialSlug) && normalizedInitialSlug !== initialAutoSlug);
  }

  function handleTitleChange(event) {
    const nextTitle = normalizeString(event?.target?.value);

    setTitleValue(nextTitle);

    if (!isManualSlug) {
      setSlugValue(typeof normalizeSlug === "function" ? normalizeSlug(nextTitle) : "");
    }
  }

  function handleSlugChange(event) {
    const nextSlug = normalizeString(event?.target?.value);
    const nextAutoSlug = typeof normalizeSlug === "function" ? normalizeSlug(titleValue) : "";

    setSlugValue(nextSlug);
    setIsManualSlug(Boolean(nextSlug) && nextSlug !== nextAutoSlug);
  }

  function handleSlugBlur() {
    if (isManualSlug || !titleValue.trim()) {
      return;
    }

    setSlugValue(typeof normalizeSlug === "function" ? normalizeSlug(titleValue) : "");
  }

  return {
    titleValue,
    slugValue,
    handleTitleChange,
    handleSlugChange,
    handleSlugBlur,
  };
}
