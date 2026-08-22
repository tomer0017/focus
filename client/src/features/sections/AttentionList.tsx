import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Section } from "./Section";
import { spanFor, type SectionSpan } from "./sectionSpan";
import { Icon } from "../../components/ui/Icon";
import { LabelledText } from "../../components/ui/LabelledText";
import { ATTENTION_LIMIT } from "../../lib/pageSelectors";
import type { PageSummary } from "../../types";

interface AttentionListProps {
  pages: PageSummary[];
  /** Where "show all" leads when the list is longer than the limit. */
  showAllHref: string;
  limit?: number;
  /** Overrides the width the card count would choose. */
  span?: SectionSpan;
}

/**
 * Blocked work, as a compact list rather than large cards.
 *
 * Rows, not cards: three blockers should cost three lines of vertical space,
 * not three panels. Capped, with a link out when there are more.
 */
export function AttentionList({
  pages,
  showAllHref,
  limit = ATTENTION_LIMIT,
  span,
}: AttentionListProps) {
  const { t } = useTranslation(["dashboard", "common"]);
  const visible = pages.slice(0, limit);
  const hiddenCount = pages.length - visible.length;

  return (
    <Section
      title={t("dashboard:sections.attention")}
      hasContent={pages.length > 0}
      span={span ?? spanFor(visible.length)}
      action={
        hiddenCount > 0 ? (
          <Link to={showAllHref} className="focus-section-action">
            {t("common:actions.showAll")} ({t("dashboard:moreCount", { count: hiddenCount })})
          </Link>
        ) : undefined
      }
    >
      <ul className="list-unstyled focus-rows mb-0">
        {visible.map((page) => (
          <li key={page.id} className="focus-row focus-row--attention">
            <span className="focus-row__flag" aria-hidden="true">
              <Icon name="alert" size={16} />
            </span>

            <div className="focus-row__body">
              <h3 className="focus-row__title">
                <Link to={`/pages/${page.id}`} className="stretched-link" dir="auto">
                  {page.title}
                </Link>
              </h3>
              {page.blocker && (
                <LabelledText label={t("common:fields.blocker")} className="focus-row__detail">
                  {page.blocker}
                </LabelledText>
              )}
              {page.nextAction && (
                <LabelledText label={t("common:fields.nextAction")} className="focus-row__next">
                  {page.nextAction}
                </LabelledText>
              )}
            </div>

            <span className="focus-row__cta" aria-hidden="true">
              {t("common:actions.continue")}
              <Icon name="arrowForward" size={15} flipForRtl />
            </span>
          </li>
        ))}
      </ul>
    </Section>
  );
}
