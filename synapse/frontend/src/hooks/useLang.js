import { useCallback, useEffect, useState } from "react";
import { getString } from "../i18n/appStrings.js";

export const LANG_STORAGE_KEY = "synapse_lang";
export const LANG_EVENT = "synapse-lang";

/**
 * Global language + RTL/LTR on <html>.
 * @returns {{ lang: string, language: string, setLanguage: (l: 'en'|'ar') => void, t: (key: string) => string }}
 */
export function useLang() {
  const [language, setLanguageState] = useState(() => localStorage.getItem(LANG_STORAGE_KEY) || "en");

  useEffect(() => {
    const sync = () => setLanguageState(localStorage.getItem(LANG_STORAGE_KEY) || "en");
    window.addEventListener(LANG_EVENT, sync);
    return () => window.removeEventListener(LANG_EVENT, sync);
  }, []);

  useEffect(() => {
    document.documentElement.lang = language === "ar" ? "ar" : "en";
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
  }, [language]);

  const setLanguage = useCallback((lang) => {
    const next = lang === "ar" ? "ar" : "en";
    localStorage.setItem(LANG_STORAGE_KEY, next);
    setLanguageState(next);
    window.dispatchEvent(new Event(LANG_EVENT));
  }, []);

  const t = useCallback((key) => getString(key, language), [language]);

  return { lang: language, language, setLanguage, t };
}
