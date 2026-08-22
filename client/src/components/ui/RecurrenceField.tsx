import { useId } from "react";
import { useTranslation } from "react-i18next";
import { RECURRENCE_KINDS } from "../../lib/recurrence";
import type { RecurrenceKind, RecurrenceRule } from "../../types";

interface RecurrenceFieldProps {
  value: RecurrenceRule | undefined;
  onChange: (rule: RecurrenceRule | undefined) => void;
}

/**
 * One control for the six kinds of repetition Focus supports.
 *
 * The interval box only appears for the four rules that can take one, so
 * "once" and "I'll set the next date myself" do not present a number field that
 * does nothing. `custom` gets a line of explanation, because "custom" on its
 * own reads like a missing feature rather than a deliberate choice.
 */
export function RecurrenceField({ value, onChange }: RecurrenceFieldProps) {
  const { t } = useTranslation("manage");
  const id = useId();

  const kind: RecurrenceKind = value?.kind ?? "once";
  const interval = value && "interval" in value ? (value.interval ?? 1) : 1;
  const takesInterval = kind === "daily" || kind === "weekly" || kind === "monthly" || kind === "yearly";

  const setKind = (next: RecurrenceKind): void => {
    if (next === "once") {
      onChange(undefined);
      return;
    }
    if (next === "custom") {
      onChange({ kind: "custom" });
      return;
    }
    onChange({ kind: next, interval: 1 } as RecurrenceRule);
  };

  return (
    <div>
      <label htmlFor={id} className="form-label fw-medium">
        {t("recurrence.label")}
      </label>
      <div className="focus-field-row">
        <select
          id={id}
          className="form-select"
          value={kind}
          onChange={(event) => setKind(event.target.value as RecurrenceKind)}
        >
          {RECURRENCE_KINDS.map((option) => (
            <option key={option} value={option}>
              {t(`recurrence.${option}`)}
            </option>
          ))}
        </select>

        {takesInterval && (
          <div>
            <label htmlFor={`${id}-interval`} className="visually-hidden">
              {t("recurrence.interval")}
            </label>
            <input
              id={`${id}-interval`}
              type="number"
              min={1}
              max={99}
              className="form-control"
              value={interval}
              onChange={(event) =>
                onChange({
                  kind,
                  interval: Math.max(1, Number(event.target.value) || 1),
                } as RecurrenceRule)
              }
            />
          </div>
        )}
      </div>

      {kind === "custom" && <p className="form-text mb-0">{t("recurrence.customHint")}</p>}
    </div>
  );
}
