import { useTranslation } from "react-i18next";
import { useLocale } from "../../i18n/useLocale";
import { formatDate, formatRelativeDay } from "../../lib/format";
import { Icon } from "../../components/ui/Icon";
import type { PageSummary } from "../../types";

/** A block of the user's own words under an interface label. */
function Block({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="focus-brief__block">
      <p className="focus-brief__block-label">{label}</p>
      <p className="focus-brief__block-value mb-0" dir="auto">
        {value}
      </p>
    </div>
  );
}

/**
 * The four facts a returning reader needs, visible without a single click.
 *
 * These four — where it stands, where you stopped, what is blocking it, what to
 * do next — are the only ones that stayed structured fields when the rest of
 * the page became free-form notes. They earned it by being read somewhere
 * else: the overview's "needs attention" list is `blocker`, its "pick up where
 * you left off" list is `stoppedAt`, and every board card prints `nextAction`.
 * The narrative rubrics that used to sit here (why this exists, what success
 * looks like, what is already done, and after that, the last decision) were
 * read by this page and nothing else, so they are notes now — and a project
 * with nothing to say about them shows nothing at all.
 *
 * Every block is optional and an absent one renders nothing, so a small project
 * gets a small brief rather than a column of empty labels.
 */
export function ResumeBrief({ page }: { page: PageSummary }) {
  const { t } = useTranslation(["pages", "common"]);
  const { locale } = useLocale();

  const hasStage = page.currentState || page.stoppedAt || page.blocker;
  const hasFacts = page.pausedReason || page.completedAt || page.dueAt;

  if (!hasStage && !page.nextAction && !hasFacts) return null;

  return (
    <div className="focus-brief">
      {hasStage && (
        <section className="focus-brief__panel">
          <h2 className="focus-brief__panel-title">{t("pages:brief.stage")}</h2>
          <Block label={t("common:fields.currentState")} value={page.currentState} />
          <Block label={t("common:fields.stoppedAt")} value={page.stoppedAt} />

          {page.blocker && (
            <p className="focus-brief__blocker mb-0">
              <Icon name="alert" size={16} />
              <span>
                <span className="fw-semibold">{t("common:fields.blocker")}</span>
                <span className="focus-brief__blocker-text" dir="auto">
                  {page.blocker}
                </span>
              </span>
            </p>
          )}
        </section>
      )}

      {/* The next action — the loudest thing on the page. */}
      {page.nextAction && (
        <div className="focus-brief__action">
          <p className="focus-brief__action-label">{t("common:fields.nextAction")}</p>
          <p className="focus-brief__action-value mb-0" dir="auto">
            {page.nextAction}
          </p>
        </div>
      )}

      {hasFacts && (
        <dl className="focus-brief__facts mb-0">
          {page.pausedReason && (
            <div className="focus-fact">
              <dt className="focus-fact__label">{t("common:fields.pausedReason")}</dt>
              <dd className="focus-fact__value mb-0" dir="auto">
                {page.pausedReason}
              </dd>
            </div>
          )}
          {page.completedAt && (
            <div className="focus-fact">
              <dt className="focus-fact__label">{t("common:fields.completedOn")}</dt>
              <dd className="focus-fact__value mb-0">{formatDate(page.completedAt, locale)}</dd>
            </div>
          )}
          {page.dueAt && (
            <div className="focus-fact">
              <dt className="focus-fact__label">{t("common:fields.neededBy")}</dt>
              <dd className="focus-fact__value mb-0">
                {formatDate(page.dueAt, locale)} · {formatRelativeDay(page.dueAt, locale)}
              </dd>
            </div>
          )}
        </dl>
      )}
    </div>
  );
}
