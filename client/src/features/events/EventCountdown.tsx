import { useTranslation } from "react-i18next";
import { Icon, type IconName } from "../../components/ui/Icon";
import { useLocale } from "../../i18n/useLocale";
import { daysUntil, formatRelativeDay } from "../../lib/format";
import { urgencyOf, type EventUrgency } from "../../lib/eventTiming";
import type { FocusEvent } from "../../types";

/**
 * The icon and label for each state.
 *
 * Both are always rendered. The colour is an accent on a border and a small
 * chip, never a wash across the whole card and never the only signal — a
 * colour-blind reader, a screen reader and a printed page all have to be able
 * to tell "preparing" from "today". See CLAUDE.md → hard rule 9.
 */
const URGENCY_ICON: Record<EventUrgency, IconName> = {
  neutral: "calendar",
  preparing: "clock",
  soon: "clock",
  critical: "alert",
  done: "check",
};

/**
 * The countdown, as the loudest thing on an event card.
 *
 * An event is a thing that happens at a time, and the number of days left is
 * the fact that makes it feel that way — "in 9 days" tells you more at a glance
 * than the date does. The date is still there underneath, because "in 9 days"
 * is useless for writing in a diary.
 */
export function EventCountdown({
  event,
  size = "normal",
}: {
  event: FocusEvent;
  size?: "normal" | "large";
}) {
  const { t } = useTranslation(["events", "common"]);
  const { locale } = useLocale();

  const urgency = urgencyOf(event);
  const days = daysUntil(event.startsAt);

  return (
    <p
      className={`focus-countdown focus-countdown--${size} focus-countdown--${urgency} mb-0`}
    >
      <Icon name={URGENCY_ICON[urgency]} size={size === "large" ? 20 : 15} />
      <span className="focus-countdown__value">
        <time dateTime={event.startsAt}>{formatRelativeDay(event.startsAt, locale)}</time>
      </span>
      {/* The state in words, so the colour is never carrying it alone. */}
      <span className="focus-countdown__state">{t(`events:urgency.${urgency}`)}</span>
      <span className="visually-hidden">
        {days >= 0
          ? t("events:daysRemaining", { count: days })
          : t("events:daysSince", { count: Math.abs(days) })}
      </span>
    </p>
  );
}

/** The same state as a compact chip, for lists that already show a date. */
export function EventUrgencyChip({ event }: { event: FocusEvent }) {
  const { t } = useTranslation(["events"]);
  const urgency = urgencyOf(event);

  if (urgency === "neutral") return null;

  return (
    <span className={`focus-chip focus-chip--urgency-${urgency}`}>
      <Icon name={URGENCY_ICON[urgency]} size={12} />
      {t(`events:urgency.${urgency}`)}
    </span>
  );
}
