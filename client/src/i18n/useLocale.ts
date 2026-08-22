import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { applyDocumentLanguage, isLanguage, storeLanguage, type Language } from "./index";

export interface LocaleController {
  language: Language;
  /** "rtl" for Hebrew, "ltr" for English. */
  dir: "rtl" | "ltr";
  isRtl: boolean;
  /** BCP-47 tag for the `Intl.*` formatters. */
  locale: string;
  setLanguage: (next: Language) => void;
}

const LOCALE_TAG: Record<Language, string> = {
  he: "he-IL",
  en: "en-GB",
};

/**
 * Single source of truth for the active language and document direction.
 *
 * i18next already holds the language, so this adds no context of its own — it
 * only wraps the side effects that must happen together on a change: i18next
 * itself, the stored preference, and the document's lang/dir attributes.
 */
export function useLocale(): LocaleController {
  const { i18n } = useTranslation();

  const language: Language = isLanguage(i18n.resolvedLanguage)
    ? i18n.resolvedLanguage
    : "he";
  const dir = i18n.dir(language);

  const setLanguage = useCallback(
    (next: Language) => {
      if (next === language) return;
      void i18n.changeLanguage(next);
      storeLanguage(next);
      applyDocumentLanguage(next);
    },
    [i18n, language]
  );

  return {
    language,
    dir,
    isRtl: dir === "rtl",
    locale: LOCALE_TAG[language],
    setLanguage,
  };
}
