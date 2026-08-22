import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { PageHeader } from "../../components/ui/PageHeader";
import { usePages } from "../../state/pagesContext";
import { useRoutines } from "../../state/routinesContext";
import { useEvents } from "../../state/eventsContext";
import { useFamily } from "../../state/familyContext";
import { withBirthdays } from "../../lib/birthdays";
import { categoryLabel } from "../../lib/projectCategories";
import {
  searchEvents,
  searchPages,
  searchRoutines,
  searchSavedItems,
} from "../../lib/pageSelectors";
import {
  selectFocusLearning,
  selectFocusProjects,
  selectNeedsYouNow,
} from "../../lib/dashboard";
import { SearchResults } from "../search/SearchResults";
import { ReminderAlerts } from "../events/ReminderAlerts";
import { useRelevance } from "../reminders/useRelevance";
import { FocusList } from "./FocusList";
import { NeedsYouNow } from "./NeedsYouNow";
import { NextDays } from "./NextDays";
import { QuickLinks } from "./QuickLinks";

/**
 * The overview — a decision screen, not a summary of the database.
 *
 * It answers four questions in a fixed order and then stops: what needs me
 * now, what is coming in the next fortnight, what am I working on, and where do
 * I go next. Everything else that used to be here — a gallery of recently saved
 * pictures, inspiration cards, favourite pages as a card grid, a month of
 * training sessions, checklist previews — was true and did not change what
 * anybody would do next. It lives on the screens that own it.
 *
 * Nothing on this screen is stored. Every row is projected on each read from
 * the entities that already exist, and each one carries the reference it came
 * from, so a row can never disagree with its source and there is no dashboard
 * record to migrate or leave stale. See `lib/dashboard.ts`.
 *
 * The order is the mobile order, deliberately: on a phone these stack in
 * exactly this sequence, so the thing that needs you is the thing you land on.
 */
export function DashboardPage() {
  const { pages, savedItems, categories } = usePages();
  const { routines } = useRoutines();
  const { events } = useEvents();
  const { profiles } = useFamily();
  const { items: relevant } = useRelevance();

  const { t } = useTranslation(["dashboard", "common", "projects", "pages"]);
  const [searchParams] = useSearchParams();

  const query = searchParams.get("q") ?? "";
  const isSearching = query.trim().length > 0;

  /* Derived, never stored — see lib/birthdays.ts. */
  const allEvents = useMemo(() => withBirthdays(events, profiles), [events, profiles]);

  // What the first area will show, so the second can exclude it by source.
  const urgent = useMemo(() => selectNeedsYouNow(relevant).visible, [relevant]);

  const projects = useMemo(() => selectFocusProjects(pages), [pages]);
  const learning = useMemo(() => selectFocusLearning(pages), [pages]);

  const projectCategory = (id: string | undefined): string | undefined => {
    const found = categories.find((entry) => entry.id === id);
    return found ? categoryLabel(found, t) : undefined;
  };

  if (isSearching) {
    return (
      <>
        <PageHeader title={t("dashboard:title")} />
        <SearchResults
          pages={searchPages(pages, query)}
          savedItems={searchSavedItems(savedItems, query)}
          routines={searchRoutines(routines, query)}
          events={searchEvents(allEvents, query)}
          query={query}
        />
      </>
    );
  }

  return (
    <>
      <PageHeader title={t("dashboard:title")} />

      {/* Event reminders that have come due. Renders nothing on most days. */}
      <ReminderAlerts />

      <div className="focus-dash">
        <NeedsYouNow items={relevant} />

        {/*
          Two columns above `lg`, because "what is coming" and "what I am
          working on" are two different questions and reading them side by side
          is shorter than reading them stacked. Each column is as tall as its
          own content — nothing stretches to match its neighbour.
        */}
        <div className="focus-dash-columns">
          <NextDays items={relevant} exclude={urgent} />

          <div className="focus-dash-stack">
            <FocusList
              title={t("dashboard:focus.projects")}
              slice={projects}
              allHref="/projects"
              allLabel={t("dashboard:focus.allProjects")}
              emptyLabel={t("dashboard:focus.noProjects")}
              labelFor={projectCategory}
            />

            <FocusList
              title={t("dashboard:focus.learning")}
              slice={learning}
              allHref="/learning"
              allLabel={t("dashboard:focus.allLearning")}
              emptyLabel={t("dashboard:focus.noLearning")}
              levelLabel={(level) => t(`pages:learning.levels.${level}`)}
            />
          </div>
        </div>

        <QuickLinks />
      </div>
    </>
  );
}
