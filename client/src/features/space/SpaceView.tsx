import { useMemo, useState } from "react";
import { Navigate, useParams, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { usePages } from "../../state/pagesContext";
import { useRoutines } from "../../state/routinesContext";
import { useEvents } from "../../state/eventsContext";
import { useTrips } from "../../state/tripsContext";
import { useFamily } from "../../state/familyContext";
import { withBirthdays } from "../../lib/birthdays";
import { isSpaceId } from "../../mocks/spaces";
import {
  eventsInSpace,
  pagesInSpace,
  routinesInSpace,
  savedInSpace,
  searchEvents,
  searchPages,
  searchRoutines,
  searchSavedItems,
  selectByStatus,
  selectByType,
  selectQuickAccess,
  selectRecentSaved,
  selectSavedByKind,
  selectUpcoming,
  needsAttention,
  UPCOMING_LIMIT,
} from "../../lib/pageSelectors";
import {
  SECTION_TITLE_KEY,
  SPACE_SECTIONS,
  TOPIC_TITLE_KEY,
  sectionKindOf,
  sectionSpanOf,
  topicOf,
  type SectionEntry,
  type SectionKind,
  type SpaceTopic,
} from "../../lib/spaceLayout";
import { todayKey } from "../../lib/dateKey";
import type { PageSummary } from "../../types";
import { EmptyState } from "../../components/ui/EmptyState";
import { PageHeader } from "../../components/ui/PageHeader";
import { SegmentedNav } from "../../components/ui/SegmentedNav";
import { defaultCategoryFor } from "../../lib/projectCategories";
import { Link } from "react-router-dom";
import { UpcomingStrip } from "../sections/UpcomingStrip";
import { ContinueList } from "../sections/ContinueList";
import { PageChipList } from "../sections/PageChipList";
import { SavedItemsRow } from "../sections/SavedItemsRow";
import { CollectionEntryRow } from "../sections/CollectionEntryRow";
import { CookingBoard } from "../cooking/CookingBoard";
import { TripList } from "../trips/TripList";
import { Section } from "../sections/Section";
import { RoutineList } from "../sections/RoutineList";
import { EventList } from "../sections/EventList";
import { SearchResults } from "../search/SearchResults";
import { EditPageModal } from "../edit/EditPageModal";

/**
 * One component renders every space. Which sections appear comes from
 * `SPACE_SECTIONS`, and any section without data renders nothing — so Cooking
 * shows recipes, Trips shows places and past notes, and neither shows an empty
 * "No projects here" panel.
 *
 * A space is a *filtered way in*, not a dashboard of its own. Its sections are
 * grouped into topics and shown one at a time: stacking projects, then
 * routines, then events, then four kinds of saved thing down a single page was
 * four unrelated questions asked at once, and it meant the same project was
 * rendered on four screens in four different shapes. The work topic links
 * straight through to that space's category on the projects screen rather than
 * reproducing the board here.
 */
export function SpaceView() {
  const { spaceId } = useParams<{ spaceId: string }>();
  const { t } = useTranslation(["dashboard", "common"]);
  const { pages, savedItems, collectionEntries, updatePage } = usePages();
  const { routines, toggleCompletionOn } = useRoutines();
  const { events } = useEvents();
  const { profiles } = useFamily();
  const { trips } = useTrips();
  const [searchParams] = useSearchParams();
  const [editing, setEditing] = useState<PageSummary | null>(null);
  const [topic, setTopic] = useState<SpaceTopic | null>(null);

  const query = searchParams.get("q") ?? "";
  const isSearching = query.trim().length > 0;
  const valid = isSpaceId(spaceId);

  const spacePages = useMemo(
    () => (valid ? pagesInSpace(pages, spaceId) : []),
    [valid, pages, spaceId]
  );
  const spaceSaved = useMemo(
    () => (valid ? savedInSpace(savedItems, spaceId) : []),
    [valid, savedItems, spaceId]
  );
  const spaceRoutines = useMemo(
    () => (valid ? routinesInSpace(routines, spaceId) : []),
    [valid, routines, spaceId]
  );
  /*
   * Derived birthdays live in Personal, the space `birthdayEventFor` gives
   * them. They are merged here rather than stored, so nothing can duplicate.
   */
  const spaceEvents = useMemo(
    () => (valid ? eventsInSpace(withBirthdays(events, profiles), spaceId) : []),
    [valid, events, profiles, spaceId]
  );

  /** Collection entries whose parent collection page lives in this space. */
  const spaceEntries = useMemo(() => {
    const collectionIds = new Set(
      spacePages.filter((page) => page.type === "collection").map((page) => page.id)
    );
    return collectionEntries.filter((entry) => collectionIds.has(entry.pageId));
  }, [spacePages, collectionEntries]);

  // An unknown space id is a bad URL, not an error worth a panel.
  if (!valid) return <Navigate to="/" replace />;

  const spaceName = t(`common:spaces.${spaceId}`);

  if (isSearching) {
    return (
      <>
        <PageHeader title={spaceName} />
        <SearchResults
          pages={searchPages(spacePages, query)}
          savedItems={searchSavedItems(spaceSaved, query)}
          routines={searchRoutines(spaceRoutines, query)}
          events={searchEvents(spaceEvents, query)}
          query={query}
          includeExtra={false}
        />
      </>
    );
  }

  const sectionEntries: SectionEntry[] = SPACE_SECTIONS[spaceId];
  const sections = sectionEntries.map(sectionKindOf);
  const spanOf = (kind: SectionKind) =>
    sectionSpanOf(sectionEntries.find((entry) => sectionKindOf(entry) === kind) ?? kind);
  const upcomingEntries = sections.includes("upcoming")
    ? selectUpcoming(spacePages, spaceRoutines, spaceEvents).slice(0, UPCOMING_LIMIT)
    : [];

  /** Every page a section could show, before de-duplication. */
  const candidatesFor = (kind: SectionKind): PageSummary[] => {
    switch (kind) {
      case "upcoming":
        return spacePages.filter((page) =>
          upcomingEntries.some((entry) => entry.href === `/pages/${page.id}`)
        );
      case "activeProjects":
        return selectByStatus(spacePages, "active").filter((page) => page.type === "project");
      case "blockedProjects":
        return spacePages.filter(needsAttention);
      case "pausedProjects":
        return selectByStatus(spacePages, "paused");
      case "completedProjects":
        return selectByStatus(spacePages, "completed");
      case "checklists":
        return selectByType(spacePages, "checklist");
      case "quickAccess":
        return selectQuickAccess(spacePages);
      default:
        return [];
    }
  };

  /*
   * Resolved once, in config order: every section drops pages an earlier
   * section already displayed, so no space view prints the same page twice.
   * Order in SPACE_SECTIONS is therefore also priority order.
   */
  const sectionPages = new Map<SectionKind, PageSummary[]>();
  const alreadyShown = new Set<string>();
  for (const kind of sections) {
    const visible = candidatesFor(kind).filter((page) => !alreadyShown.has(page.id));
    visible.forEach((page) => alreadyShown.add(page.id));
    sectionPages.set(kind, visible);
  }
  const pagesFor = (kind: SectionKind): PageSummary[] => sectionPages.get(kind) ?? [];

  const renderSection = (kind: SectionKind) => {
    const title = t(`dashboard:${SECTION_TITLE_KEY[kind]}`);
    const span = spanOf(kind);

    switch (kind) {
      case "trips":
        return <TripList key={kind} title={title} trips={trips} span={span} />;
      case "recipes":
        // The cooking board owns its own three groups, so it takes the row.
        return (
          <Section key={kind} title={title} hasContent={spaceEntries.length > 0} span="full">
            <CookingBoard entries={spaceEntries} />
          </Section>
        );
      case "upcoming":
        return (
          <UpcomingStrip
            key={kind}
            entries={upcomingEntries}
            span={span}
            onMarkRoutineDone={(routineId) => toggleCompletionOn(routineId, todayKey())}
          />
        );
      case "activeProjects":
      case "blockedProjects":
        return (
          <ContinueList
            key={kind}
            title={title}
            pages={pagesFor(kind)}
            limit={6}
            span={span}
            onEdit={setEditing}
          />
        );
      case "pausedProjects":
      case "completedProjects":
      case "checklists":
      case "quickAccess":
        return <PageChipList key={kind} title={title} pages={pagesFor(kind)} span={span} />;
      case "routines":
        return <RoutineList key={kind} title={title} routines={spaceRoutines} span={span} />;
      case "events":
        return <EventList key={kind} title={title} events={spaceEvents} span={span} />;
      case "trainingPlans":
        return (
          <SavedItemsRow
            key={kind}
            title={title}
            items={selectSavedByKind(spaceSaved, "document")}
            limit={6}
            span={span}
          />
        );
      case "saved":
        return <SavedItemsRow key={kind} title={title} items={selectRecentSaved(spaceSaved)} span={span} />;
      case "inspiration":
        return (
          <SavedItemsRow
            key={kind}
            title={title}
            items={selectSavedByKind(spaceSaved, "inspiration", "image")}
            span={span}
          />
        );
      case "products":
      case "gear":
        return (
          <SavedItemsRow
            key={kind}
            title={title}
            items={selectSavedByKind(spaceSaved, "product")}
            span={span}
          />
        );
      case "notes":
        return (
          <SavedItemsRow
            key={kind}
            title={title}
            items={selectSavedByKind(spaceSaved, "note")}
            span={span}
          />
        );
      case "places":
        return (
          <CollectionEntryRow
            key={kind}
            title={title}
            entries={spaceEntries.filter((entry) => entry.status === "tried")}
            span={span}
          />
        );
      case "attention":
      case "continue":
        return null;
    }
  };

  /**
   * Whether a section kind would render anything at all.
   *
   * It mirrors what `renderSection` feeds each component, because a tab whose
   * every section returns null is a tab leading to a blank panel — the one
   * failure that grouping sections into topics could newly introduce.
   */
  const hasContent = (kind: SectionKind): boolean => {
    switch (kind) {
      case "trips":
        return trips.length > 0;
      case "recipes":
        return spaceEntries.length > 0;
      case "places":
        return spaceEntries.some((entry) => entry.status === "tried");
      case "upcoming":
        return upcomingEntries.length > 0;
      case "routines":
        return spaceRoutines.length > 0;
      case "events":
        return spaceEvents.length > 0;
      case "trainingPlans":
        return selectSavedByKind(spaceSaved, "document").length > 0;
      case "saved":
        return selectRecentSaved(spaceSaved).length > 0;
      case "inspiration":
        return selectSavedByKind(spaceSaved, "inspiration", "image").length > 0;
      case "products":
      case "gear":
        return selectSavedByKind(spaceSaved, "product").length > 0;
      case "notes":
        return selectSavedByKind(spaceSaved, "note").length > 0;
      case "attention":
      case "continue":
        return false;
      default:
        return pagesFor(kind).length > 0;
    }
  };

  const isEmpty =
    spacePages.length === 0 &&
    spaceSaved.length === 0 &&
    spaceRoutines.length === 0 &&
    spaceEvents.length === 0;

  /*
   * A topic only exists when one of its sections actually renders something.
   * `Section` returns null when it has no content, so a topic built from empty
   * sections would be a tab leading to a blank panel.
   */
  const topics = ([...new Set(sections.map(topicOf))] as SpaceTopic[]).filter((value) =>
    sections.some((kind) => topicOf(kind) === value && hasContent(kind))
  );

  const activeTopic = topic && topics.includes(topic) ? topic : topics[0];
  const shown = sectionEntries.filter((entry) => topicOf(sectionKindOf(entry)) === activeTopic);

  return (
    <>
      <PageHeader
        title={spaceName}
        action={
          activeTopic === "work" ? (
            <Link
              className="btn btn-outline-primary btn-sm"
              to={`/projects?category=${defaultCategoryFor(spaceId)}`}
            >
              {t("dashboard:openProjects")}
            </Link>
          ) : undefined
        }
      />

      {isEmpty ? (
        <EmptyState
          title={t("dashboard:emptySpace.title")}
          hint={t("dashboard:emptySpace.hint", { space: spaceName })}
        />
      ) : (
        <>
          {topics.length > 1 && (
            <SegmentedNav
              label={t("dashboard:chooseTopic")}
              items={topics.map((value) => ({
                id: value,
                label: t(`dashboard:${TOPIC_TITLE_KEY[value]}`),
              }))}
              value={activeTopic}
              onChange={(id) => setTopic(id as SpaceTopic)}
              variant="tabs"
              collapse
            />
          )}

          <div className="focus-sections">
            {shown.map((entry) => renderSection(sectionKindOf(entry)))}
          </div>
        </>
      )}

      <EditPageModal page={editing} onClose={() => setEditing(null)} onSave={updatePage} />
    </>
  );
}
