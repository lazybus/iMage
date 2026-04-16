"use client";

import { openAnalyticsPreferences } from "@/lib/analytics";

export function AnalyticsPreferencesButton() {
  return (
    <button className="footer-link bg-transparent p-0 text-left" onClick={openAnalyticsPreferences} type="button">
      Cookie Preferences
    </button>
  );
}