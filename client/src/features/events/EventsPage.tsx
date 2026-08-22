import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import Button from "react-bootstrap/Button";
import { useEvents } from "../../state/eventsContext";
import { useFamily } from "../../state/familyContext";
import { withBirthdays } from "../../lib/birthdays";
import { urgencyOf } from "../../lib/eventTiming";
import { Icon } from "../../components/ui/Icon";
import { CollectionPage } from "../../components/ui/CollectionPage";
import { CompactList } from "../../components/ui/CompactRow";
import { EmptyState } from "../../components/ui/EmptyState";
import { PagedList } from "../../components/ui/PagedList";
import { SearchField } from "../../components/ui/SearchField";
import { EventList } from "../sections/EventList";
import { EventRow } from "./EventRow";
import { NewEventModal } from "./NewEventModal";
import { ReminderAlerts } from "./ReminderAlerts";
import type { FocusEvent } from "../../types";

/** Close enough to need something, further off, or already happened. */
type Group = "near" | "later" | "past";

/**
 * Every event, ordered by time and by whether it needs anything.
 *
 * The screen this replaces was two sections of chip-cards, one under the other,
 * both unbounded — so a year of birthdays and holidays pushed next week off the
 * top of the screen, and "past" was an infinite scroll of things that need
 * nothing from anyone.
 *
 * Now the split is by *urgency*, not merely by date. An event is "near" once
 * `urgencyOf` says its preparation window has opened — which is the only judge
 * of that in the app, and the reason a flight in two months stays quiet while a
 * 60th birthday in two months does not. Near events keep their cards, because a
 * card is right when there are two or three of them and they need action;
 * everything else is a row.
 *
 * Past events are kept, never archived away: "what did we do last year" is one
 * of the few questions a personal system is uniquely good at answering.
 */
export function EventsPage() {
  const { t } = useTranslation(["events", "dashboard", "common"]);
  const { events, createEvent } = useEvents();
  const { profiles } = useFamily();

  const [creating, setCreating] = useState(false);
  const [group, setGroup] = useState<Group>("near");
  const [query, setQuery] = useState("");

  const now = new Date().toISOString();
  const all = useMemo(() => withBirthdays(events, profiles), [events, profiles]);

  const groups = useMemo(() => {
    const sorted = [...all].sort((a, b) => a.startsAt.localeCompare(b.startsAt));
    const upcoming = sorted.filter((event) => event.startsAt >= now);
    return {
      // "Neutral" means the event has declared no preparation window, or it has
      // not opened yet. Those are exactly the ones that need nothing today.
      near: upcoming.filter((event) => urgencyOf(event) !== "neutral"),
      later: upcoming.filter((event) => urgencyOf(event) === "neutral"),
      past: sorted.filter((event) => event.startsAt < now).reverse(),
    };
  }, [all, now]);

  const term = query.trim().toLowerCase();
  const listed: FocusEvent[] = term
    ? all.filter((event) =>
        [event.title, event.nextAction]
          .filter(Boolean)
          .some((field) => field!.toLowerCase().includes(term))
      )
    : groups[group];

  const tabs = (["near", "later", "past"] as Group[]).map((value) => ({
    id: value,
    label: t(`events:groups.${value}`),
    badge: String(groups[value].length || ""),
  }));

  const createAction = (
    <Button variant="primary" size="sm" onClick={() => setCreating(true)}>
      <Icon name="plus" size={15} />
      {t("events:create.title")}
    </Button>
  );

  if (all.length === 0) {
    return (
      <>
        <CollectionPage title={t("events:title")} lead={t("events:lead")} action={createAction}>
          <ReminderAlerts />
          <EmptyState title={t("events:empty.title")} hint={t("events:empty.hint")} />
        </CollectionPage>
        <NewEventModal
          show={creating}
          onClose={() => setCreating(false)}
          onCreate={(draft) => createEvent(draft)}
        />
      </>
    );
  }

  return (
    <>
      <CollectionPage
        title={t("events:title")}
        lead={t("events:lead")}
        action={createAction}
        feature={<ReminderAlerts />}
        tabs={tabs}
        tabValue={group}
        onTabChange={(id) => setGroup(id as Group)}
        tabsLabel={t("events:chooseGroup")}
        toolbar={
          <SearchField
            label={t("events:searchLabel")}
            value={query}
            onChange={setQuery}
            resultCount={listed.length}
          />
        }
      >
        {listed.length === 0 ? (
          <p className="focus-day-empty mb-0">
            {term ? t("events:noMatches") : t(`events:noneIn.${group}`)}
          </p>
        ) : group === "near" && !term ? (
          /* Cards, but only here: these are the ones that need something. */
          <div className="focus-sections">
            <EventList title={t("dashboard:sections.events")} events={listed} span="full" />
          </div>
        ) : (
          <PagedList items={listed} pageSize={20} resetKey={`${group}|${term}`}>
            {(visible) => (
              <CompactList>
                {visible.map((event) => (
                  <li key={event.id}>
                    <EventRow event={event} />
                  </li>
                ))}
              </CompactList>
            )}
          </PagedList>
        )}
      </CollectionPage>

      <NewEventModal
        show={creating}
        onClose={() => setCreating(false)}
        onCreate={(draft) => createEvent(draft)}
      />
    </>
  );
}
