import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Button from "react-bootstrap/Button";
import { useEvents } from "../../state/eventsContext";
import { Icon } from "../../components/ui/Icon";
import { useLocale } from "../../i18n/useLocale";
import { formatDayAndTime } from "../../lib/format";
import { dueReminders, reminderTime } from "../../lib/eventTiming";
import type { EventReminder, FocusEvent } from "../../types";

/** Snoozing pushes a reminder out by a day — the only offer, deliberately. */
const SNOOZE_HOURS = 24;

/**
 * Every reminder that is asking for something, across every event.
 *
 * This is the one place a reminder actually surfaces, so it sits on the
 * overview and on the events screen rather than only inside the event it
 * belongs to — a reminder you have to go looking for has already failed.
 *
 * It renders nothing when nothing is due, which is most days. The line about
 * the tab being open is not an apology: there is no server and no push
 * infrastructure, and a reminder people believe will wake them up and does not
 * is worse than no reminder at all.
 */
export function ReminderAlerts() {
  const { t } = useTranslation(["events", "common"]);
  const { locale } = useLocale();
  const { events, updateEvent } = useEvents();

  const due = useMemo(
    () =>
      events.flatMap((event) =>
        dueReminders(event).map((reminder) => ({ event, reminder }))
      ),
    [events]
  );

  if (due.length === 0) return null;

  const patch = (event: FocusEvent, id: string, changes: Partial<EventReminder>): void =>
    updateEvent(event.id, {
      reminders: (event.reminders ?? []).map((entry) =>
        entry.id === id ? { ...entry, ...changes } : entry
      ),
    });

  return (
    <section className="focus-alerts" aria-labelledby="reminder-alerts-heading">
      <h2 id="reminder-alerts-heading" className="focus-alerts__heading">
        <Icon name="alert" size={16} />
        {t("events:reminders.dueHeading", { count: due.length })}
      </h2>

      <ul className="list-unstyled focus-alerts__list mb-0">
        {due.map(({ event, reminder }) => (
          <li key={`${event.id}-${reminder.id}`} className="focus-alert">
            <span className="focus-alert__body">
              <span className="focus-alert__label" dir="auto">
                {reminder.label ?? t("events:reminders.untitled")}
              </span>
              <span className="focus-alert__meta">
                <Link to={`/events/${event.id}`} dir="auto">
                  {event.title}
                </Link>
                {" · "}
                <time dateTime={reminderTime(event, reminder)}>
                  {formatDayAndTime(reminderTime(event, reminder), locale)}
                </time>
              </span>
            </span>

            <span className="focus-alert__actions">
              <Button
                variant="outline-success"
                size="sm"
                onClick={() => patch(event, reminder.id, { handled: true })}
              >
                {t("events:reminders.markHandled")}
              </Button>
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() =>
                  patch(event, reminder.id, {
                    snoozedUntil: new Date(
                      Date.now() + SNOOZE_HOURS * 60 * 60 * 1000
                    ).toISOString(),
                  })
                }
              >
                {t("events:reminders.snooze")}
              </Button>
            </span>
          </li>
        ))}
      </ul>

      <p className="focus-alerts__limit mb-0">{t("events:reminders.localOnly")}</p>
    </section>
  );
}
