import { useTranslation } from "react-i18next";
import Button from "react-bootstrap/Button";
import { Icon } from "../../components/ui/Icon";
import { useLocale } from "../../i18n/useLocale";
import { formatDayKey, formatRelativeDay } from "../../lib/format";
import { dateKeyToIso } from "../../lib/dateKey";
import type { Routine } from "../../types";

interface TrainingSummaryProps {
  nextSession: { routine: Routine; key: string } | null;
  lastSession: { routine: Routine; key: string } | null;
  sessionsThisMonth: number;
  /** The routine "today's session" refers to, and whether it is already logged. */
  todaysRoutine: Routine | null;
  doneToday: boolean;
  onToggleToday: () => void;
}

/**
 * Three facts and one button.
 *
 * This replaced a wide panel that spread the same three lines across the full
 * width of a 1440px screen with nothing in the middle. The primary action is
 * the point of the screen: logging today's session should not require finding
 * the routine, opening it, and finding the right day in a grid.
 */
export function TrainingSummary({
  nextSession,
  lastSession,
  sessionsThisMonth,
  todaysRoutine,
  doneToday,
  onToggleToday,
}: TrainingSummaryProps) {
  const { t } = useTranslation(["pages", "dashboard", "common"]);
  const { locale } = useLocale();

  return (
    <section className="focus-summary">
      <dl className="focus-summary__facts">
        <div className="focus-summary__fact">
          <dt>{t("pages:training.nextSession")}</dt>
          <dd>
            {nextSession ? (
              <>
                <span className="focus-summary__strong" dir="auto">
                  {nextSession.routine.title}
                </span>
                <time dateTime={dateKeyToIso(nextSession.key)}>
                  {formatRelativeDay(dateKeyToIso(nextSession.key), locale)}
                </time>
              </>
            ) : (
              t("pages:routine.noPlannedDate")
            )}
          </dd>
        </div>

        <div className="focus-summary__fact">
          <dt>{t("pages:training.lastSession")}</dt>
          <dd>
            {lastSession ? (
              <>
                <span className="focus-summary__strong" dir="auto">
                  {lastSession.routine.title}
                </span>
                <time dateTime={dateKeyToIso(lastSession.key)}>
                  {formatDayKey(lastSession.key, locale)}
                </time>
              </>
            ) : (
              t("pages:routine.neverDone")
            )}
          </dd>
        </div>

        <div className="focus-summary__fact">
          <dt>{t("pages:training.thisMonth")}</dt>
          <dd>
            <span className="focus-summary__strong">
              {t("dashboard:insight.sessionsThisMonth", { count: sessionsThisMonth })}
            </span>
          </dd>
        </div>
      </dl>

      {todaysRoutine && (
        <div className="focus-summary__action">
          <Button
            variant={doneToday ? "success" : "primary"}
            onClick={onToggleToday}
            className="focus-summary__button"
          >
            <Icon name="check" size={16} />
            {doneToday
              ? t("pages:training.todayDone")
              : t("pages:training.markToday")}
          </Button>
          {doneToday && (
            <button type="button" className="focus-summary__undo" onClick={onToggleToday}>
              {t("pages:training.undoToday")}
            </button>
          )}
          <p className="focus-summary__target mb-0" dir="auto">
            {todaysRoutine.title}
          </p>
        </div>
      )}
    </section>
  );
}
