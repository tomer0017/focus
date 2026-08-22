import { useTranslation } from "react-i18next";
import type { EventImportance, FocusEvent } from "../../types";

interface EventPreparationProps {
  event: FocusEvent;
  onChange: (patch: { prepDaysBefore?: number; importance?: EventImportance }) => void;
}

/** Offered windows, in days. Free entry would be precision nobody has. */
const WINDOWS = [7, 14, 30, 60, 90] as const;

const IMPORTANCE: EventImportance[] = ["low", "normal", "high"];

/**
 * When this event should start asking for attention.
 *
 * Two questions, both optional, and neither of them "how urgent is it?" — that
 * is the answer, not the question. The user says how long the preparation
 * takes and how much the event matters, and urgency follows from those plus
 * the calendar. Leaving both alone is a normal answer: the event stays quiet
 * until the week before, which is the right behaviour for most things that
 * have a date.
 */
export function EventPreparation({ event, onChange }: EventPreparationProps) {
  const { t } = useTranslation(["events", "common"]);

  return (
    <section className="focus-prep">
      <h2 className="focus-note__title">{t("events:prep.heading")}</h2>
      <p className="focus-prep__lead">{t("events:prep.lead")}</p>

      <div className="focus-prep__fields">
        <div>
          <label htmlFor="prep-window" className="form-label fw-medium">
            {t("events:prep.window")}
          </label>
          <select
            id="prep-window"
            className="form-select"
            value={event.prepDaysBefore ?? ""}
            onChange={(input) =>
              onChange({
                prepDaysBefore: input.target.value ? Number(input.target.value) : undefined,
              })
            }
          >
            <option value="">{t("events:prep.noPrep")}</option>
            {WINDOWS.map((days) => (
              <option key={days} value={days}>
                {t("events:prep.daysBefore", { count: days })}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="prep-importance" className="form-label fw-medium">
            {t("events:prep.importance")}
          </label>
          <select
            id="prep-importance"
            className="form-select"
            value={event.importance ?? "normal"}
            onChange={(input) =>
              onChange({ importance: input.target.value as EventImportance })
            }
          >
            {IMPORTANCE.map((level) => (
              <option key={level} value={level}>
                {t(`events:prep.importanceLevel.${level}`)}
              </option>
            ))}
          </select>
        </div>
      </div>
    </section>
  );
}
