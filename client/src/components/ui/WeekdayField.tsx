import { useTranslation } from "react-i18next";

interface WeekdayFieldProps {
  label: string;
  /** 0 = Sunday. Empty means every day, which is not the same as "none". */
  value: number[];
  onChange: (weekdays: number[]) => void;
  /** What an empty selection means, said out loud rather than left blank. */
  emptyLabel: string;
}

const DAYS = [0, 1, 2, 3, 4, 5, 6];

/**
 * Days of the week as seven toggles.
 *
 * Empty is the default and means *every day* — the common case for a daily
 * tablet, and one that should not cost seven clicks. Because empty is
 * meaningful rather than missing, the control says so underneath instead of
 * leaving the user to guess whether nothing selected means nothing scheduled.
 */
export function WeekdayField({ label, value, onChange, emptyLabel }: WeekdayFieldProps) {
  const { t } = useTranslation();

  const toggle = (day: number): void =>
    onChange(value.includes(day) ? value.filter((entry) => entry !== day) : [...value, day].sort());

  return (
    <fieldset>
      <legend className="form-label fw-medium">{label}</legend>
      <div className="focus-chips" role="group" aria-label={t("weekdays.label")}>
        {DAYS.map((day) => (
          <button
            key={day}
            type="button"
            className={`focus-chip-button${value.includes(day) ? " is-active" : ""}`}
            aria-pressed={value.includes(day)}
            onClick={() => toggle(day)}
          >
            {t(`weekdays.${day}`)}
          </button>
        ))}
      </div>
      {value.length === 0 && <p className="form-text mb-0">{emptyLabel}</p>}
    </fieldset>
  );
}
