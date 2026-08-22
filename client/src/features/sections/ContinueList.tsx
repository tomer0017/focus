import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Section } from "./Section";
import { spanFor, type SectionSpan } from "./sectionSpan";
import { Icon } from "../../components/ui/Icon";
import { BlockedBadge, SpaceBadge } from "../../components/ui/Badges";
import { EditButton } from "../../components/ui/EditButton";
import { LabelledText } from "../../components/ui/LabelledText";
import { useLocale } from "../../i18n/useLocale";
import { formatRelativeDay } from "../../lib/format";
import { CONTINUE_LIMIT } from "../../lib/pageSelectors";
import { isBlocked, type PageSummary } from "../../types";

interface ContinueListProps {
  pages: PageSummary[];
  title?: string;
  limit?: number;
  onEdit?: (page: PageSummary) => void;
  /** Overrides the width the card count would choose. */
  span?: SectionSpan;
}

/**
 * "Pick up where you left off" — at most a handful of pages, never the full
 * project list. The emphasis is on the resume thread: where work stopped and
 * what the next step is.
 */
export function ContinueList({
  pages,
  title,
  limit = CONTINUE_LIMIT,
  onEdit,
  span,
}: ContinueListProps) {
  const { t } = useTranslation(["dashboard", "common"]);
  const { locale } = useLocale();
  const visible = pages.slice(0, limit);

  return (
    <Section
      title={title ?? t("dashboard:sections.continue")}
      hasContent={visible.length > 0}
      span={span ?? spanFor(visible.length)}
    >
      <ul className="list-unstyled focus-grid focus-grid--continue mb-0">
        {visible.map((page) => (
          <li key={page.id}>
            <article className="focus-card">
              <div className="focus-card__head">
                <h3 className="focus-card__title">
                  <Link to={`/pages/${page.id}`} className="stretched-link" dir="auto">
                    {page.title}
                  </Link>
                </h3>
                <div className="focus-card__meta">
                  {isBlocked(page) && <BlockedBadge />}
                  <SpaceBadge spaceId={page.spaceId} />
                  {onEdit && <EditButton targetLabel={page.title} onClick={() => onEdit(page)} />}
                </div>
              </div>

              {(page.stoppedAt ?? page.currentState) && (
                <p className="focus-card__state focus-clamp-2" dir="auto">
                  {page.stoppedAt ?? page.currentState}
                </p>
              )}

              {page.nextAction && (
                <LabelledText label={t("common:fields.nextAction")} className="focus-card__next">
                  {page.nextAction}
                </LabelledText>
              )}

              <p className="focus-card__foot mb-0">
                <time dateTime={page.lastUpdatedAt}>
                  {t("common:time.updatedRelative", {
                    when: formatRelativeDay(page.lastUpdatedAt, locale),
                  })}
                </time>
                <span className="focus-card__cta" aria-hidden="true">
                  {t("common:actions.continue")}
                  <Icon name="arrowForward" size={15} flipForRtl />
                </span>
              </p>
            </article>
          </li>
        ))}
      </ul>
    </Section>
  );
}
