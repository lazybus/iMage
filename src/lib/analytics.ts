export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID?.trim() ?? "";
export const ANALYTICS_CONSENT_STORAGE_KEY = "image-analytics-consent";
export const ANALYTICS_PREFERENCES_EVENT = "image:analytics-preferences";

export type AnalyticsConsentState = "granted" | "denied";

type AnalyticsParamValue = boolean | number | string;

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

function canUseWindow() {
  return typeof window !== "undefined";
}

function sanitizeParams(params: Record<string, AnalyticsParamValue | null | undefined>) {
  return Object.fromEntries(Object.entries(params).filter(([, value]) => value !== null && value !== undefined));
}

export function readStoredAnalyticsConsent(): AnalyticsConsentState | null {
  if (!canUseWindow()) {
    return null;
  }

  const storedValue = window.localStorage.getItem(ANALYTICS_CONSENT_STORAGE_KEY);
  return storedValue === "granted" || storedValue === "denied" ? storedValue : null;
}

export function updateAnalyticsConsent(state: AnalyticsConsentState) {
  if (!canUseWindow()) {
    return;
  }

  window.localStorage.setItem(ANALYTICS_CONSENT_STORAGE_KEY, state);
  window.gtag?.("consent", "update", {
    analytics_storage: state,
    ad_personalization: "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
  });
}

export function openAnalyticsPreferences() {
  if (!canUseWindow()) {
    return;
  }

  window.dispatchEvent(new Event(ANALYTICS_PREFERENCES_EVENT));
}

export function trackEvent(eventName: string, params: Record<string, AnalyticsParamValue | null | undefined> = {}) {
  if (!GA_MEASUREMENT_ID || !canUseWindow() || readStoredAnalyticsConsent() !== "granted") {
    return;
  }

  window.gtag?.("event", eventName, sanitizeParams(params));
}