import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { EmptyState } from "../../components/ui/EmptyState";
import { BlockedBadge, SpaceBadge } from "../../components/ui/Badges";
import { Section } from "../sections/Section";
import { LabelledText } from "../../components/ui/LabelledText";
import { SavedItemsRow } from "../sections/SavedItemsRow";
import { RoutineList } from "../sections/RoutineList";
import { EventList } from "../sections/EventList";
import { ExtraResults } from "./ExtraResults";
import { useExtraSearch } from "./useExtraSearch";
import { useLocale } from "../../i18n/useLocale";
import { formatRelativeDay } from "../../lib/format";
import { isBlocked, type FocusEvent, type PageSummary, type Routine, type SavedItem } from "../../types";

interface SearchResultsProps {
  pages: PageSummary[];
  savedItems: SavedItem[];
  routines: Routine[];
  events: FocusEvent[];
  query: string;
  /**
   * Whether to search the slices that have no space of their own — family,
   * ongoing management, leisure.
   *
   * A space view passes `false`: those entities do not belong to Cooking or to
   * Trips, and surfacing a vet appointment under a search inside Cooking would
   * be the same category error as listing every project on the overview.
   */
  includeExtra?: boolean;
}

/**
 * Flat result list shown while a search is active.
 *
 * Search spans every entity on purpose. The sectioned views only surface
 * certain kinds, so a matching collection, routine or event would otherwise be
 * counted as a match and then never displayed.
 */
export function SearchResults({
  pages,
  savedItems,
  routines,
  events,
  query,
  includeExtra = true,
}: SearchResultsProps) {
  const { t } = useTranslation(["common", "dashboard"]);
  const { locale } = useLocale();
  const extra = useExtraSearch(query);

  /*
   * The count spans every slice, including the newer ones, so the results line
   * and the empty state both tell the truth. `useExtraSearch` is called once and
   * shared with `<ExtraResults>` — running the searches twice is exactly how the
   * two would drift and put "nothing matches" above a list of matches.
   */
  const total =
    pages.length +
    savedItems.length +
    routines.length +
    events.length +
    (includeExtra ? extra.total : 0);

  if (total === 0) {
    return (
      <EmptyState
        title={t("common:search.noResultsTitle", { query })}
        hint={t("common:search.noResultsHint")}
      />
    );
  }

  return (
    <>
      <p className="text-secondary small mb-3" aria-live="polite">
        {t("common:search.resultsCount", { count: total })}{" "}
        {t("common:search.resultsFor", { query })}
      </p>

      <Section title={t("common:search.matchingPages")} hasContent={pages.length > 0}>
        <ul className="list-unstyled focus-grid focus-grid--continue mb-0">
          {pages.map((page) => (
            <li key={page.id}>
              <article className="focus-card">
                <div className="focus-card__head">
                  <div>
                    <p className="focus-chip-card__eyebrow">{t(`common:pageTypes.${page.type}`)}</p>
                    <h3 className="focus-card__title">
                      <Link to={`/pages/${page.id}`} className="stretched-link" dir="auto">
                        {page.title}
                      </Link>
                    </h3>
                  </div>
                  <div className="focus-card__meta">
                    {isBlocked(page) && <BlockedBadge />}
                    <SpaceBadge spaceId={page.spaceId} />
                  </div>
                </div>

                {(page.currentState ?? page.description) && (
                  <p className="focus-card__state focus-clamp-2" dir="auto">
                    {page.currentState ?? page.description}
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
                </p>
              </article>
            </li>
          ))}
        </ul>
      </Section>

      <RoutineList title={t("dashboard:sections.routines")} routines={routines} />
      <EventList title={t("dashboard:sections.events")} events={events} />
      <SavedItemsRow items={savedItems} limit={savedItems.length} />
      {includeExtra && <ExtraResults query={query} />}
    </>
  );
}
