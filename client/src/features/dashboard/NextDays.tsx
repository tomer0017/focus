import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CompactList, CompactRow } from "../../components/ui/CompactRow";
import { useLocale } from "../../i18n/useLocale";
import { formatRelativeDay, formatShortDate } from "../../lib/format";
import { NEXT_DAYS_HORIZON, selectNextDays } from "../../lib/dashboard";
import type { RelevanceItem } from "../../lib/relevance";

interface NextDaysProps {
  items: RelevanceItem[];
  /** Rows already shown under "needs you now", excluded by source identity. */
  exclude: RelevanceItem[];
}

/**
 * The fortnight ahead — what may need preparing, not a calendar.
 *
 * The distinction matters: a calendar shows you everything on a date, and this
 * shows you only the things that have entered a window where you could act. A
 * dental appointment in two months is on your calendar and is not here.
 *
 * Only the next two days carry an accent. Past that a relative day — "in 9
 * days" — says everything the colour would, and tinting six rows would dilute
 * the one area above that genuinely needs tinting.
 */
export function NextDays({ items, exclude }: NextDaysProps) {
  const { t } = useTranslation(["dashboard", "manage"]);
  const { locale } = useLocale();

  const { visible, more } = selectNextDays(items, { exclude });

  return (
    <section className="focus-dash-area">
      <h2 className="focus-section-title">
        {t("dashboard:next.title", { days: NEXT_DAYS_HORIZON })}
      </h2>

      {visible.length === 0 ? (
        <p className="focus-dash-empty">{t("dashboard:next.empty")}</p>
      ) : (
        <>
          <CompactList>
            {visible.map((item) => (
              <li key={item.id}>
                <CompactRow
                  title={item.title}
                  eyebrow={t(`manage:now.sources.${item.source}`)}
                  detail={item.detail}
                  href={item.href}
                  tone={item.daysAway !== undefined && item.daysAway <= 2 ? "next" : "neutral"}
                  meta={
                    item.at ? (
                      <>
                        <time dateTime={item.at}>{formatShortDate(item.at, locale)}</time>
                        <span>{formatRelativeDay(item.at, locale)}</span>
                      </>
                    ) : undefined
                  }
                />
              </li>
            ))}
          </CompactList>

          {more > 0 && (
            <p className="focus-dash-more">
              <Link to="/events">{t("dashboard:next.more", { count: more })}</Link>
            </p>
          )}
        </>
      )}
    </section>
  );
}
