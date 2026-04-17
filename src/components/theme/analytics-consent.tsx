"use client";

import Link from "next/link";
import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";

import {
  ANALYTICS_CONSENT_CHANGED_EVENT,
  ANALYTICS_PREFERENCES_EVENT,
  GA_MEASUREMENT_ID,
  type AnalyticsConsentState,
  readStoredAnalyticsConsent,
  trackEvent,
  updateAnalyticsConsent,
} from "@/lib/analytics";

function subscribeToAnalyticsConsent(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  function handleStorage(event: StorageEvent) {
    if (event.key && event.key !== "image-analytics-consent") {
      return;
    }

    onStoreChange();
  }

  window.addEventListener("storage", handleStorage);
  window.addEventListener(ANALYTICS_CONSENT_CHANGED_EVENT, onStoreChange);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(ANALYTICS_CONSENT_CHANGED_EVENT, onStoreChange);
  };
}

function useStoredAnalyticsConsent() {
  return useSyncExternalStore(subscribeToAnalyticsConsent, readStoredAnalyticsConsent, () => null);
}

function useHasHydrated() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

function AnalyticsToggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (nextValue: boolean) => void;
}) {
  return (
    <button
      aria-pressed={checked}
      className="flex items-center justify-between gap-4 rounded-[20px] border border-[var(--line)] bg-[var(--surface-soft)] px-4 py-3 text-left transition hover:bg-[var(--surface-strong)]"
      onClick={() => onChange(!checked)}
      type="button"
    >
      <span>
        <span className="block text-sm font-semibold text-[var(--foreground)]">Google Analytics</span>
        <span className="mt-1 block text-sm muted">Measures page visits plus upload and processing actions after you opt in.</span>
      </span>
      <span
        aria-hidden="true"
        className={`relative inline-flex h-7 w-12 rounded-full transition ${checked ? "bg-[var(--accent)]" : "bg-[var(--surface-strong)]"}`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-[var(--overlay-contrast)] transition ${checked ? "left-6" : "left-1"}`}
        />
      </span>
    </button>
  );
}

export function AnalyticsConsent() {
  const pathname = usePathname();
  const hasHydrated = useHasHydrated();
  const consent = useStoredAnalyticsConsent();
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);
  const [isAnalyticsReady, setIsAnalyticsReady] = useState(() => {
    if (!GA_MEASUREMENT_ID || typeof window === "undefined") {
      return false;
    }

    return readStoredAnalyticsConsent() === "granted" && typeof window.gtag === "function";
  });

  useEffect(() => {
    if (!GA_MEASUREMENT_ID) {
      return;
    }

    if (consent) {
      updateAnalyticsConsent(consent);
    }

    function handleOpenPreferences() {
      setAnalyticsEnabled(readStoredAnalyticsConsent() === "granted");
      setIsPreferencesOpen(true);
    }

    window.addEventListener(ANALYTICS_PREFERENCES_EVENT, handleOpenPreferences);

    return () => {
      window.removeEventListener(ANALYTICS_PREFERENCES_EVENT, handleOpenPreferences);
    };
  }, [consent]);

  useEffect(() => {
    if (!isAnalyticsReady || consent !== "granted") {
      return;
    }

    const query = window.location.search;
    const pagePath = query ? `${pathname}${query}` : pathname;
    trackEvent("page_view", {
      page_location: window.location.href,
      page_path: pagePath,
      page_title: document.title,
    });
  }, [consent, isAnalyticsReady, pathname]);

  if (!GA_MEASUREMENT_ID || !hasHydrated) {
    return null;
  }

  function applyConsent(nextConsent: AnalyticsConsentState) {
    setAnalyticsEnabled(nextConsent === "granted");
    updateAnalyticsConsent(nextConsent);
    setIsPreferencesOpen(false);
  }

  function savePreferences() {
    applyConsent(analyticsEnabled ? "granted" : "denied");
  }

  const shouldShowBanner = consent === null && !isPreferencesOpen;

  return (
    <>
      {consent === "granted" ? (
        <Script
          id="google-analytics"
          onLoad={() => {
            window.gtag?.("js", new Date());
            window.gtag?.("config", GA_MEASUREMENT_ID, { send_page_view: false });
            setIsAnalyticsReady(true);
          }}
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          strategy="afterInteractive"
        />
      ) : null}

      {shouldShowBanner ? (
        <div className="fixed inset-x-0 bottom-4 z-50 px-4">
          <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 rounded-[28px] border border-[var(--line)] bg-[var(--panel-strong)] px-5 py-5 shadow-[0_18px_60px_var(--shadow-color)] md:flex-row md:items-center md:justify-between md:px-6">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-[var(--foreground)]">Analytics preference</p>
              <p className="max-w-2xl text-sm muted">
                iMage can use Google Analytics to measure page visits plus successful upload and processing starts. This stays off until you opt in. See the <Link className="footer-inline-link" href="/cookies">Cookie Policy</Link>.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button className="button button-secondary" onClick={() => applyConsent("denied")} type="button">
                Essential only
              </button>
              <button
                className="button button-secondary"
                onClick={() => {
                  setAnalyticsEnabled(consent === "granted");
                  setIsPreferencesOpen(true);
                }}
                type="button"
              >
                Manage
              </button>
              <button className="button button-primary" onClick={() => applyConsent("granted")} type="button">
                Accept analytics
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isPreferencesOpen ? (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/45 px-4 py-4 md:items-center">
          <div className="panel w-full max-w-2xl rounded-[30px] p-6 md:p-7">
            <div className="space-y-3">
              <p className="eyebrow">Privacy controls</p>
              <h2 className="text-3xl font-semibold tracking-[-0.04em]">Choose your analytics setting</h2>
              <p className="text-sm muted">
                Essential storage remains enabled for sign-in, secure routes, and interface preferences. Analytics is optional and only measures navigation plus successful upload and processing starts.
              </p>
            </div>

            <div className="mt-6 space-y-4">
              <div className="rounded-[20px] border border-[var(--line)] bg-[var(--surface-soft)] px-4 py-3">
                <p className="text-sm font-semibold text-[var(--foreground)]">Essential storage</p>
                <p className="mt-1 text-sm muted">Required for authentication, security, protected downloads, and your saved theme.</p>
              </div>

              <AnalyticsToggle checked={analyticsEnabled} onChange={setAnalyticsEnabled} />
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button className="button button-secondary" onClick={() => setIsPreferencesOpen(false)} type="button">
                Close
              </button>
              <button className="button button-secondary" onClick={() => applyConsent("denied")} type="button">
                Essential only
              </button>
              <button className="button button-primary" onClick={savePreferences} type="button">
                Save preferences
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}