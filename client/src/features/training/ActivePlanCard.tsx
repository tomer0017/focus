import { useState } from "react";
import { useTranslation } from "react-i18next";
import Button from "react-bootstrap/Button";
import { Icon } from "../../components/ui/Icon";
import { THUMBS } from "../../assets/thumbs";
import { useLocale } from "../../i18n/useLocale";
import { formatDate } from "../../lib/format";
import type { SavedItem } from "../../types";

const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;

/** Which week of the block you are in, counted from the day it started. */
function weekNumber(startedAt: string, now: Date = new Date()): number {
  const elapsed = now.getTime() - new Date(startedAt).getTime();
  return Math.max(1, Math.floor(elapsed / MS_PER_WEEK) + 1);
}

/**
 * The plan currently being run.
 *
 * Deliberately not a `SavedItemCard`: the active plan is the piece of work the
 * whole screen is about, and rendering it identically to the four saved links
 * beneath it made it disappear into them. Previous plans stay as ordinary
 * saved items, which is exactly what they are.
 */
export function ActivePlanCard({ plan }: { plan: SavedItem }) {
  const { t } = useTranslation(["pages", "common"]);
  const { locale } = useLocale();
  const [open, setOpen] = useState(false);

  return (
    <article className="focus-plan">
      <img className="focus-plan__thumb" src={THUMBS[plan.thumb]} alt="" width={320} height={180} />

      <div className="focus-plan__body">
        <p className="focus-plan__eyebrow">
          <Icon name="training" size={14} />
          {t("pages:training.runningNow")}
        </p>

        <h3 className="focus-plan__title" dir="auto">
          {plan.title}
        </h3>

        <dl className="focus-plan__facts">
          <div>
            <dt>{t("pages:training.planStarted")}</dt>
            <dd>{formatDate(plan.savedAt, locale)}</dd>
          </div>
          <div>
            <dt>{t("pages:training.planWeek")}</dt>
            <dd>{t("pages:training.weekNumber", { count: weekNumber(plan.savedAt) })}</dd>
          </div>
        </dl>

        {plan.note && (
          <p className="focus-plan__note" dir="auto">
            {plan.note}
          </p>
        )}

        <Button
          variant="outline-primary"
          size="sm"
          onClick={() => setOpen((current) => !current)}
          aria-expanded={open}
          aria-controls="active-plan-detail"
        >
          <Icon name={open ? "chevronUp" : "chevronDown"} size={14} />
          {open ? t("pages:training.hidePlan") : t("pages:training.openPlan")}
        </Button>

        {open && (
          <div id="active-plan-detail" className="focus-plan__detail">
            <p className="mb-1" dir="auto">
              {plan.note ?? t("pages:training.noPlanDetail")}
            </p>
            <p className="form-text mb-0">{t("common:mock.noLinkHint")}</p>
          </div>
        )}
      </div>
    </article>
  );
}
