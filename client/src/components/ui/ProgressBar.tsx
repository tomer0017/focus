import { useTranslation } from "react-i18next";
import { useLocale } from "../../i18n/useLocale";
import { completionFraction, formatPercent } from "../../lib/format";

interface ProgressBarProps {
  done: number;
  total: number;
  /** Accessible name — what is being measured. */
  label: string;
}

/**
 * Shared progress readout. The numbers are stated in words as well as drawn,
 * so the bar is never the only way to know how far along something is.
 */
export function ProgressBar({ done, total, label }: ProgressBarProps) {
  const { t } = useTranslation(["dashboard"]);
  const { locale } = useLocale();

  const fraction = completionFraction(done, total);
  const percent = Math.round(fraction * 100);

  return (
    <div className="focus-progress-block">
      <p className="focus-progress-block__text mb-0">
        <span className="fw-semibold">{t("dashboard:checklistProgress", { done, total })}</span>
        <span className="text-secondary"> · {formatPercent(fraction, locale)}</span>
      </p>
      <div
        className="progress focus-progress"
        role="progressbar"
        aria-label={label}
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="progress-bar" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
