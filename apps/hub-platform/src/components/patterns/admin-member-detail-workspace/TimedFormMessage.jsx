"use client";

import { useEffect, useState } from "react";
import FormMessage from "@/components/ui/form-message/FormMessage";

export default function TimedFormMessage({ tone = "success", children, durationMs = 4000 }) {
  const [isVisible, setIsVisible] = useState(Boolean(children));

  useEffect(() => {
    setIsVisible(Boolean(children));
  }, [children]);

  useEffect(() => {
    if (!isVisible || !children || durationMs <= 0) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setIsVisible(false);
    }, durationMs);

    return () => window.clearTimeout(timeoutId);
  }, [children, durationMs, isVisible]);

  if (!isVisible || !children) {
    return null;
  }

  return <FormMessage tone={tone}>{children}</FormMessage>;
}
