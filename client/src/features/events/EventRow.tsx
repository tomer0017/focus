import { useTranslation } from "react-i18next";
import { CompactRow } from "../../components/ui/CompactRow";
import { useLocale } from "../../i18n/useLocale";
import { formatDate } from "../../lib/format";
import { eventTasks, urgencyOf } from "../../lib/eventTiming";
import { eventHref, isDerivedBirthday } from "../../lib/birthdays";
import { EventCountdown } from "./EventCountdown";
import type { FocusEvent } from "../../types";

/** The urgency accent maps onto the row's tone. Never the only signal. */
const TONE = {
  neutral: "neutral",
  preparing: "soon",
  soon: "soon",
  critical: "due",
  done: "done",
} as const;

/**
 * An event that is not imminent, as one line.
 *
 * A card per event is right for the two or three things happening this week and
 * wrong for the forty birthdays, holidays and appointments behind them — a
 * chip-card is ~150px, so a year of events was several screens of scrolling
 * past things that need nothing from anyone.
 *
 * The countdown still leads, because "in nine days" is what makes an event feel
 * like one, and the date follows it, because "in nine days" is no use for
 * writing in a diary. Urgency tints the row's edge and is written out in words
 * beside it.
 */
export function EventRow({ event }: { event: FocusEvent }) {
  const { t } = useTranslation(["events", "common", "family"]);
  const { locale } = useLocale();

  const urgency = urgencyOf(event);
  const tasks = eventTasks(event);

  /*
   * A derived birthday stores the person's name and nothing else — composing
   * "Mum's birthday" happens here, at render, so no language is written into
   * data. The same rule as event sections and checklist groups.
   */
  const title = isDerivedBirthday(event)
    ? t("family:birthday.label", { name: event.title })
    : event.title;

  return (
    <CompactRow
      href={eventHref(event)}
      eyebrow={t(`events:kinds.${event.kind}`)}
      title={title}
      detail={event.nextAction}
      badges={<EventCountdown event={event} />}
      progress={tasks.total > 0 ? tasks : undefined}
      meta={<time dateTime={event.startsAt}>{formatDate(event.startsAt, locale)}</time>}
      tone={TONE[urgency]}
    />
  );
}
