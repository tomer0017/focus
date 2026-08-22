import { useState } from "react";
import { useTranslation } from "react-i18next";
import Button from "react-bootstrap/Button";
import { Icon } from "../../components/ui/Icon";
import { useLocale } from "../../i18n/useLocale";
import { formatDayAndTime } from "../../lib/format";
import { REMINDER_PRESETS, dueReminders, reminderId, reminderTime } from "../../lib/eventTiming";
import type { EventReminder, FocusEvent } from "../../types";

interface EventRemindersProps {
  event: FocusEvent;
  isEditing: boolean;
  onChange: (reminders: EventReminder[]) => void;
}

/** Snoozing pushes a reminder out by a day — the only offer, deliberately. */
const SNOOZE_HOURS = 24;

/**
 * Reminders for one event, and the honest limits of them.
 *
 * Focus has no server and no push infrastructure, so a reminder here is
 * something the app shows you the next time you open it — never a notification
 * that arrives while the tab is closed. The note under the list says exactly
 * that, because a reminder people believe will wake them up and does not is
 * worse than no reminder at all.
 */
export function EventReminders({ event, isEditing, onChange }: EventRemindersProps) {
  const { t } = useTranslation(["events", "common"]);
  const { locale } = useLocale();
  const [label, setLabel] = useState("");
  const [hoursBefore, setHoursBefore] = useState<number>(24);

  const reminders = event.reminders ?? [];
  const due = new Set(dueReminders(event).map((reminder) => reminder.id));

  const patch = (id: string, changes: Partial<EventReminder>): void =>
    onChange(reminders.map((entry) => (entry.id === id ? { ...entry, ...changes } : entry)));

  const add = (): void => {
    const trimmed = label.trim();
    if (!trimmed) return;
    onChange([...reminders, { id: reminderId(), hoursBefore, label: trimmed }]);
    setLabel("");
  };

  if (reminders.length === 0 && !isEditing) return null;

  return (
    <section className="focus-reminders">
      <h2 className="focus-note__title">{t("events:reminders.heading")}</h2>

      {reminders.length > 0 && (
        <ul className="list-unstyled focus-reminders__list mb-0">
          {reminders.map((reminder) => {
            const when = reminderTime(event, reminder);
            const isDue = due.has(reminder.id);

            return (
              <li
                key={reminder.id}
                className={`focus-reminder ${isDue ? "is-due" : ""} ${
                  reminder.handled ? "is-handled" : ""
                }`}
              >
                <span className="focus-reminder__icon" aria-hidden="true">
                  <Icon name={reminder.handled ? "check" : isDue ? "alert" : "clock"} size={15} />
                </span>

                <span className="focus-reminder__body">
                  <span className="focus-reminder__label" dir="auto">
                    {reminder.label ?? t("events:reminders.untitled")}
                  </span>
                  <span className="focus-reminder__when">
                    <time dateTime={when}>{formatDayAndTime(when, locale)}</time>
                    {/* The state in words, never the styling alone. */}
                    {reminder.handled && ` · ${t("events:reminders.handled")}`}
                    {!reminder.handled && isDue && ` · ${t("events:reminders.due")}`}
                    {!reminder.handled && !isDue && reminder.snoozedUntil && (
                      <> · {t("events:reminders.snoozed")}</>
                    )}
                  </span>
                </span>

                <span className="focus-reminder__actions">
                  {!reminder.handled && (
                    <>
                      <Button
                        variant="outline-success"
                        size="sm"
                        onClick={() => patch(reminder.id, { handled: true })}
                      >
                        {t("events:reminders.markHandled")}
                      </Button>
                      {isDue && (
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          onClick={() =>
                            patch(reminder.id, {
                              snoozedUntil: new Date(
                                Date.now() + SNOOZE_HOURS * 60 * 60 * 1000
                              ).toISOString(),
                            })
                          }
                        >
                          {t("events:reminders.snooze")}
                        </Button>
                      )}
                    </>
                  )}
                  {reminder.handled && (
                    <Button
                      variant="link"
                      size="sm"
                      className="px-0"
                      onClick={() => patch(reminder.id, { handled: false })}
                    >
                      {t("events:reminders.undo")}
                    </Button>
                  )}
                  {isEditing && (
                    <button
                      type="button"
                      className="focus-icon-button border focus-icon-button--danger"
                      onClick={() =>
                        onChange(reminders.filter((entry) => entry.id !== reminder.id))
                      }
                      aria-label={t("events:reminders.remove", {
                        name: reminder.label ?? t("events:reminders.untitled"),
                      })}
                    >
                      <Icon name="trash" size={15} />
                    </button>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      {isEditing && (
        <div className="focus-reminders__add">
          <div className="focus-reminders__add-row">
            <div className="focus-reminders__add-field">
              <label htmlFor="reminder-label" className="form-label fw-medium">
                {t("events:reminders.labelField")}
              </label>
              <input
                id="reminder-label"
                className="form-control"
                dir="auto"
                placeholder={t("events:reminders.labelPlaceholder")}
                value={label}
                onChange={(input) => setLabel(input.target.value)}
              />
            </div>
            <div className="focus-reminders__add-field">
              <label htmlFor="reminder-when" className="form-label fw-medium">
                {t("events:reminders.whenField")}
              </label>
              <select
                id="reminder-when"
                className="form-select"
                value={hoursBefore}
                onChange={(input) => setHoursBefore(Number(input.target.value))}
              >
                {REMINDER_PRESETS.map((hours) => (
                  <option key={hours} value={hours}>
                    {t(`events:reminders.preset.${hours}`)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <Button variant="outline-primary" size="sm" onClick={add} disabled={!label.trim()}>
            <Icon name="plus" size={15} />
            {t("events:reminders.add")}
          </Button>
        </div>
      )}

      <p className="focus-reminders__limit mb-0">
        <Icon name="alert" size={13} />
        {t("events:reminders.localOnly")}
      </p>
    </section>
  );
}
