import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { usePages } from "../../state/pagesContext";
import { useRoutines } from "../../state/routinesContext";
import { useEvents } from "../../state/eventsContext";
import {
  ATTENTION_LIMIT,
  CONTINUE_LIMIT,
  searchEvents,
  searchPages,
  searchRoutines,
  searchSavedItems,
  selectContinue,
  selectNeedsAttention,
  selectQuickAccess,
  selectRecentSaved,
  selectUpcoming,
  trainingSessionsThisMonth,
  UPCOMING_LIMIT,
} from "../../lib/pageSelectors";
import { todayKey } from "../../lib/dateKey";
import { withBirthdays } from "../../lib/birthdays";
import { useFamily } from "../../state/familyContext";
import type { PageSummary } from "../../types";
import { EmptyState } from "../../components/ui/EmptyState";
import { PageHeader } from "../../components/ui/PageHeader";
import { UpcomingStrip } from "../sections/UpcomingStrip";
import { ReminderAlerts } from "../events/ReminderAlerts";
import { AttentionList } from "../sections/AttentionList";
import { ContinueList } from "../sections/ContinueList";
import { PageChipList } from "../sections/PageChipList";
import { SavedItemsRow } from "../sections/SavedItemsRow";
import { SegmentedNav } from "../../components/ui/SegmentedNav";
import { SearchResults } from "../search/SearchResults";
import { NowCentre } from "../reminders/NowCentre";
import { useRelevance } from "../reminders/useRelevance";
import { EditPageModal } from "../edit/EditPageModal";
import { ActivityInsight } from "./ActivityInsight";

/**
 * The overview screen — a work surface, not an archive.
 *
 * It answers six questions in order and then stops: what needs me right now,
 * what is near, what is stuck, where do I resume, have I been keeping up, and
 * where is what I saved. It deliberately does NOT list every project (that is
 * `/projects`), carries no calendar, no board and no vision board, and shows
 * nothing twice.
 *
 * "What needs you" goes first and is the reason the rest of the extension
 * exists — but it renders **nothing at all** on a day when nothing is asking,
 * which is most days. That restraint is what keeps it worth looking at.
 */
/** The three groups the overview splits into on a phone. */
type DashboardGroup = "today" | "week" | "later";

const GROUPS: DashboardGroup[] = ["today", "week", "later"];

export function DashboardPage() {
  const { pages, savedItems, updatePage } = usePages();
  const { routines, toggleCompletionOn } = useRoutines();
  const { events } = useEvents();
  const { profiles } = useFamily();
  const { items: relevant } = useRelevance();

  /* Derived, never stored — see lib/birthdays.ts. */
  const allEvents = useMemo(() => withBirthdays(events, profiles), [events, profiles]);
  const { t } = useTranslation(["dashboard", "common"]);
  const [searchParams] = useSearchParams();
  const [editing, setEditing] = useState<PageSummary | null>(null);
  const [group, setGroup] = useState<DashboardGroup>("today");

  const query = searchParams.get("q") ?? "";
  const isSearching = query.trim().length > 0;

  const upcoming = useMemo(
    () => selectUpcoming(pages, routines, allEvents).slice(0, UPCOMING_LIMIT),
    [pages, routines, allEvents]
  );
  const attention = useMemo(() => selectNeedsAttention(pages), [pages]);

  /*
   * Each section below excludes what the sections above it already showed, so
   * nothing appears twice on this screen.
   */
  const resume = useMemo(() => {
    const scheduled = new Set(upcoming.map((entry) => entry.href));
    return selectContinue(pages)
      .filter((page) => !scheduled.has(`/pages/${page.id}`))
      .slice(0, CONTINUE_LIMIT);
  }, [pages, upcoming]);

  const quickAccess = useMemo(() => {
    const alreadyShown = new Set([
      ...upcoming.map((entry) => entry.href),
      ...attention.slice(0, ATTENTION_LIMIT).map((page) => `/pages/${page.id}`),
      ...resume.map((page) => `/pages/${page.id}`),
    ]);
    return selectQuickAccess(pages).filter((page) => !alreadyShown.has(`/pages/${page.id}`));
  }, [pages, upcoming, attention, resume]);

  const recentSaved = useMemo(() => selectRecentSaved(savedItems), [savedItems]);
  const sessions = useMemo(() => trainingSessionsThisMonth(routines), [routines]);

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

  const hasAnything =
    relevant.length > 0 ||
    upcoming.length > 0 ||
    attention.length > 0 ||
    resume.length > 0 ||
    quickAccess.length > 0 ||
    recentSaved.length > 0;

  return (
    <>
      <PageHeader title={t("dashboard:title")} />

      {/* Anything actually asking for something goes above the four questions
          the overview answers. It renders nothing on a day with nothing due,
          which is most days. */}
      <ReminderAlerts />

      {hasAnything ? (
        <>
        {/*
          On a phone every section stacks, so five of them is thousands of
          pixels before the user reaches the one they came for. Below `md` they
          become three groups and one is shown at a time; above it the grid
          already puts them side by side, so the control would only be in the
          way and is not rendered at all.
        */}
        <div className="d-md-none">
          <SegmentedNav
            label={t("dashboard:chooseGroup")}
            items={GROUPS.map((value) => ({ id: value, label: t(`dashboard:groups.${value}`) }))}
            value={group}
            onChange={(id) => setGroup(id as DashboardGroup)}
            variant="tabs"
          />
        </div>

        <div className="focus-sections focus-dash" data-showing={group}>
          {/*
            The relevance engine's five buckets *are* this screen's grouping, so
            each dashboard group asks for its own rather than all five landing
            under "today" and the same rows being grouped twice.
          */}
          <div className="focus-dash-group" data-group="today">
            <NowCentre hideWhenEmpty buckets={["today"]} />
          </div>
          <div className="focus-dash-group" data-group="week">
            <NowCentre hideWhenEmpty buckets={["week"]} hideTitle />
          </div>
          <div className="focus-dash-group" data-group="later">
            <NowCentre hideWhenEmpty buckets={["waiting", "upcoming", "recurring"]} hideTitle />
          </div>
          {/* The strip, the blocked rows and the resume cards each need the
              width; quick access and recently saved are short enough to share
              a row, which is what stops either from sitting alone in a thin
              column with two thirds of the row blank. */}
          <div className="focus-dash-group" data-group="week">
          <UpcomingStrip
            entries={upcoming}
            span="full"
            onMarkRoutineDone={(routineId) => toggleCompletionOn(routineId, todayKey())}
          />
          </div>
          {/* Attention belongs to "today" on a phone: a blocked project is not
              something to look at later. */}
          <div className="focus-dash-group" data-group="today">
            <AttentionList pages={attention} showAllHref="/projects" span="full" />
          </div>
          <div className="focus-dash-group" data-group="later">
            <ContinueList pages={resume} onEdit={setEditing} span="full" />
          </div>
          <div className="focus-dash-group" data-group="later">
            <ActivityInsight sessions={sessions} />
          </div>
          <div className="focus-dash-group" data-group="later">
            <PageChipList
              title={t("dashboard:sections.quickAccess")}
              pages={quickAccess.slice(0, 3)}
              span="auto"
            />
          </div>
          {/*
            Three, and the whole card. The overview's job is "where is what I
            saved", not "look at what you saved": six full inspiration cards
            were the tallest thing on the screen and answered a question nobody
            arrives at the overview asking.
          */}
          <div className="focus-dash-group" data-group="later">
            <SavedItemsRow items={recentSaved} limit={3} span="auto" />
          </div>
        </div>
        </>
      ) : (
        <EmptyState
          title={t("dashboard:emptyOverview.title")}
          hint={t("dashboard:emptyOverview.hint")}
        />
      )}

      <EditPageModal page={editing} onClose={() => setEditing(null)} onSave={updatePage} />
    </>
  );
}
