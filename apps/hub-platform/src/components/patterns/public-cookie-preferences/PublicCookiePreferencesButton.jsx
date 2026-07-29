"use client";

import { usePublicCookiePreferences } from "./PublicCookiePreferencesProvider";

export default function PublicCookiePreferencesButton({ className = "" }) {
  const { openPreferences } = usePublicCookiePreferences();

  return (
    <button type="button" className={className} onClick={openPreferences}>
      Manage cookie settings
    </button>
  );
}
