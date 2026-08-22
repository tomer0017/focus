import { useTranslation } from "react-i18next";
import { SUPPORTED_LANGUAGES } from "../../i18n";
import { useLocale } from "../../i18n/useLocale";

/**
 * Compact two-option language toggle.
 *
 * Built as a radiogroup rather than a <select>: with exactly two options the
 * choice and the current value are both visible without opening anything, and
 * each option keeps its own name in its own script.
 */
export function LanguageSwitcher() {
  const { t } = useTranslation();
  const { language, setLanguage } = useLocale();

  return (
    <div className="focus-lang" role="radiogroup" aria-label={t("language.label")}>
      {SUPPORTED_LANGUAGES.map((code) => {
        const isActive = code === language;
        return (
          <button
            key={code}
            type="button"
            role="radio"
            aria-checked={isActive}
            lang={code}
            className={`focus-lang__option ${isActive ? "is-active" : ""}`}
            onClick={() => setLanguage(code)}
          >
            {t(`language.${code}`)}
          </button>
        );
      })}
    </div>
  );
}
