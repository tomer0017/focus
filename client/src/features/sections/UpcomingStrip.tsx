import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Button from "react-bootstrap/Button";
import { Section } from "./Section";
import { spanFor, type SectionSpan } from "./sectionSpan";
import { Icon } from "../../components/ui/Icon";
import { useLocale } from "../../i18n/useLocale";
import { formatDayAndTime, formatRelativeDay, formatWeekdayAndDay } from "../../lib/format";
import type { UpcomingEntry } from "../../lib/pageSelectors";

interface UpcomingStripProps {
  entries: UpcomingEntry[];
  title?: string;
  /** Records today's completion for a routine, straight from the strip. */
  onMarkRoutineDone: (routineId: string) => void;
  /** Overrides the width the card count would choose. */
  span?: SectionSpan;
}

/**
 * The "what is near" strip. One card per real upcoming thing — never padded
 * out to a fixed number of columns, so three items render three cards.
 */
export function UpcomingStrip({ entries, title, onMarkRoutineDone, span }: UpcomingStripProps) {
  const { t } = useTranslation(["dashboard", "common", "family"]);
  const { locale } = useLocale();

  /* A derived birthday carries the person's name; the label is composed here. */
  const labelOf = (entry: UpcomingEntry): string =>
    entry.kind === "birthday"
      ? t("family:birthday.label", { name: entry.title })
      : entry.title;

  return (
    <Section
      title={title ?? t("dashboard:sections.upcoming")}
      hasContent={entries.length > 0}
      span={span ?? spanFor(entries.length)}
    >
      <ul className="list-unstyled focus-grid focus-grid--upcoming mb-0">
        {entries.map((entry) => (
          <li key={entry.id}>
            <article className="focus-tile">
              <p className="focus-tile__eyebrow">
                <Icon name="clock" size={14} />
                {entry.kind === "birthday"
                  ? t("family:birthday.title")
                  : t(`common:pageTypes.${entry.kind}`)}
              </p>

              <h3 className="focus-tile__title">
                <Link to={entry.href} className="stretched-link" dir="auto">
                  {labelOf(entry)}
                </Link>
              </h3>

              <p className="focus-tile__when mb-0">
                <span className="fw-semibold">{formatRelativeDay(entry.at, locale)}</span>
                <span className="text-secondary">
                  {" · "}
                  {entry.allDay
                    ? formatWeekdayAndDay(entry.at, locale)
                    : formatDayAndTime(entry.at, locale)}
                </span>
              </p>

              {/* Sits above the stretched link so it stays independently clickable. */}
              {entry.routineId && (
                <div className="focus-tile__action">
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => onMarkRoutineDone(entry.routineId as string)}
                  >
                    <Icon name="check" size={14} />
                    {t("common:actions.markDone")}
                  </Button>
                </div>
              )}
            </article>
          </li>
        ))}
      </ul>
    </Section>
  );
}
