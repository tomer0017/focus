import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Section } from "./Section";
import { spanFor, type SectionSpan } from "./sectionSpan";
import { Icon } from "../../components/ui/Icon";
import { useLocale } from "../../i18n/useLocale";
import { formatDayKey, formatRelativeDay } from "../../lib/format";
import { dateKeyToIso } from "../../lib/dateKey";
import { isOverdue, lastCompletionKey, nextPlannedKey, scheduleSummaryArgs } from "../../lib/routineSchedule";
import type { Routine } from "../../types";

interface RoutineListProps {
  title: string;
  routines: Routine[];
  /** Overrides the width the card count would choose. */
  span?: SectionSpan;
}

/**
 * Recurring activity as compact cards: cadence, when it was last done, when it
 * is next planned. Overdue is stated in words as well as colour.
 */
export function RoutineList({ title, routines, span }: RoutineListProps) {
  const { t } = useTranslation(["pages", "common"]);
  const { locale } = useLocale();

  return (
    <Section title={title} hasContent={routines.length > 0} span={span ?? spanFor(routines.length)}>
      <ul className="list-unstyled focus-grid focus-grid--chips mb-0">
        {routines.map((routine) => {
          const summary = scheduleSummaryArgs(routine.schedule);
          const last = lastCompletionKey(routine);
          const next = nextPlannedKey(routine);
          const overdue = isOverdue(routine);

          return (
            <li key={routine.id}>
              <article className="focus-chip-card">
                <p className="focus-chip-card__eyebrow">
                  <Icon name="clock" size={13} />
                  {t(`pages:${summary.key}`, summary.values)}
                </p>
                <h3 className="focus-chip-card__title">
                  <Link to={`/routines/${routine.id}`} className="stretched-link" dir="auto">
                    {routine.title}
                  </Link>
                </h3>

                <p className="focus-chip-card__detail mb-0">
                  {last
                    ? t("pages:routine.lastDone", { when: formatDayKey(last, locale) })
                    : t("pages:routine.neverDone")}
                </p>

                {next && (
                  <p className="focus-chip-card__detail mb-0">
                    <time dateTime={dateKeyToIso(next)}>
                      {t("pages:routine.nextPlanned", {
                        when: formatRelativeDay(dateKeyToIso(next), locale),
                      })}
                    </time>
                  </p>
                )}

                {overdue && (
                  <p className="focus-chip-card__flag mb-0">
                    <Icon name="alert" size={13} />
                    {t("pages:routine.overdue")}
                  </p>
                )}
              </article>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}
