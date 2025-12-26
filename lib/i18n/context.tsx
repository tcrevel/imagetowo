"use client";

/**
 * Internationalization Context
 * 
 * Provides language switching capabilities across the app.
 * Detects browser language and persists user preference.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { translations, type Locale, type TranslationKey } from "./translations";

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

const STORAGE_KEY = "imagetofit-locale";

function detectBrowserLocale(): Locale {
  if (typeof window === "undefined") return "en";
  
  const browserLang = navigator.language.split("-")[0];
  return browserLang === "fr" ? "fr" : "en";
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");
  const [isHydrated, setIsHydrated] = useState(false);

  // Initialize locale from storage or browser preference
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Locale | null;
    if (stored && (stored === "en" || stored === "fr")) {
      setLocaleState(stored);
    } else {
      setLocaleState(detectBrowserLocale());
    }
    setIsHydrated(true);
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem(STORAGE_KEY, newLocale);
  }, []);

  const t = useCallback(
    (key: TranslationKey): string => {
      return translations[locale][key] || translations.en[key] || key;
    },
    [locale]
  );

  // Prevent hydration mismatch
  if (!isHydrated) {
    return (
      <I18nContext.Provider value={{ locale: "en", setLocale, t: (key) => translations.en[key] || key }}>
        {children}
      </I18nContext.Provider>
    );
  }

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
}

export function useTranslation() {
  const { t } = useI18n();
  return t;
}
