import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Button from "react-bootstrap/Button";
import { useRoutines } from "../../state/routinesContext";
import { usePages } from "../../state/pagesContext";
import { useManage } from "../../state/manageContext";
import { todayKey } from "../../lib/dateKey";
import {
  isCompletedOn,
  isPlannedOn,
  lastCompletionKey,
  nextPlannedKey,
} from "../../lib/routineSchedule";
import { trainingSessionsThisMonth } from "../../lib/pageSelectors";
import { byDueDate, isOpen } from "../../lib/scheduled";
import { CollectionPage } from "../../components/ui/CollectionPage";
import { CompactList } from "../../components/ui/CompactRow";
import { Icon } from "../../components/ui/Icon";
import type { SegmentedItem } from "../../components/ui/SegmentedNav";
import { ScheduledRow } from "../manage/ScheduledRow";
import { RoutineCalendarCard } from "../routines/RoutineCalendarCard";
import { RoutineFormModal } from "../routines/RoutineFormModal";
import { ResourcePanels } from "../resources/ResourcePanels";
import { PlansTab } from "./PlansTab";
import { TrainingSummary } from "./TrainingSummary";

/**
 * The training area — three questions, one at a time.
 *
 * **Plans** is what to do: structures with groups and exercises, as many of
 * them active at once as the user actually runs. **Tracking** is when: the
 * sessions, their history and the treatments that come round, all read from the
 * `Routine` and `ScheduledItem` slices that already own them. **Materials** is
 * what was saved: ordinary `SavedItem`s filed against the training area.
 *
 * Keeping those three apart is the point of this screen. A plan has no date, a
 * session has no exercises, and neither is a copy of the other.
 *
 * Tracking earns its tab: next session, last session, sessions this month and
 * the month calendar are all computed from real completion records the user has
 * been ticking. Nothing on it is invented.
 */
type TrainingArea = "plans" | "tracking" | "materials";

const AREAS: TrainingArea[] = ["plans", "tracking", "materials"];

export function TrainingPage() {
  const { t } = useTranslation(["training", "pages", "common"]);
  const { routines, createRoutine, toggleCompletionOn } = useRoutines();
  const { savedItems } = usePages();
  const { scheduled } = useManage();
  const [params, setParams] = useSearchParams();

  const [creatingRoutine, setCreatingRoutine] = useState(false);
  const [creatingPlan, setCreatingPlan] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const areaParam = params.get("area");
  const area: TrainingArea = AREAS.includes(areaParam as TrainingArea)
    ? (areaParam as TrainingArea)
    : "plans";

  const setArea = (next: string): void => {
    const updated = new URLSearchParams(params);
    updated.set("area", next);
    // A status filter belongs to the plans tab and means nothing on the others.
    if (next !== "plans") {
      updated.delete("status");
      updated.delete("where");
      updated.delete("q");
    }
    setParams(updated, { replace: true });
  };

  /*
   * Treatments and follow-ups are `ScheduledItem`s the user already keeps in
   * ongoing management. They are *shown* here because this is the screen about
   * the body, but they are not copied: this reads the same slice manage does,
   * and editing one opens the same dialog.
   */
  const treatments = useMemo(
    () =>
      scheduled
        .filter(
          (item) =>
            isOpen(item) &&
            (item.category === "appointment" ||
              item.category === "checkup" ||
              item.category === "vaccination")
        )
        .sort(byDueDate),
    [scheduled]
  );

  const trainingRoutines = useMemo(
    () => routines.filter((routine) => routine.domain === "training"),
    [routines]
  );

  const selected =
    trainingRoutines.find((routine) => routine.id === selectedId) ?? trainingRoutines[0];

  /** Everything filed against the training area, newest first. */
  const materials = useMemo(
    () =>
      savedItems
        .filter((item) => item.contextIds.includes("training"))
        .sort((a, b) => b.savedAt.localeCompare(a.savedAt)),
    [savedItems]
  );

  /** The soonest planned session across every training routine. */
  const nextSession = useMemo(() => {
    const candidates = trainingRoutines
      .map((routine) => ({ routine, key: nextPlannedKey(routine) }))
      .filter((entry): entry is { routine: typeof entry.routine; key: string } => entry.key !== null)
      .sort((a, b) => a.key.localeCompare(b.key));
    return candidates[0] ?? null;
  }, [trainingRoutines]);

  /** The most recent completed session across every training routine. */
  const lastSession = useMemo(() => {
    const candidates = trainingRoutines
      .map((routine) => ({ routine, key: lastCompletionKey(routine) }))
      .filter((entry): entry is { routine: typeof entry.routine; key: string } => entry.key !== null)
      .sort((a, b) => b.key.localeCompare(a.key));
    return candidates[0] ?? null;
  }, [trainingRoutines]);

  const sessions = trainingSessionsThisMonth(routines);
  const today = todayKey();

  /*
   * "Today's session" is, in order: the one already logged today, the one the
   * schedule plans for today, then the one due soonest.
   *
   * The first clause is not redundant. Logging a session moves that routine's
   * next planned date, so a rule based only on "what is due soonest" would hand
   * the button to a *different* routine the instant you pressed it.
   */
  const todaysRoutine =
    trainingRoutines.find((routine) => isCompletedOn(routine, today)) ??
    trainingRoutines.find((routine) => isPlannedOn(routine, today)) ??
    nextSession?.routine ??
    trainingRoutines[0] ??
    null;
  const doneToday = todaysRoutine ? isCompletedOn(todaysRoutine, today) : false;

  const tabs: SegmentedItem[] = [
    { id: "plans", label: t("training:areas.plans") },
    { id: "tracking", label: t("training:areas.tracking") },
    {
      id: "materials",
      label: t("training:areas.materials"),
      badge: materials.length > 0 ? String(materials.length) : undefined,
    },
  ];

  return (
    <>
      <CollectionPage
        title={t("training:title")}
        lead={t("training:lead")}
        action={
          area === "tracking" ? (
            <Button variant="primary" size="sm" onClick={() => setCreatingRoutine(true)}>
              <Icon name="plus" size={15} /> {t("pages:routineForm.createTitle")}
            </Button>
          ) : (
            <Button variant="primary" size="sm" onClick={() => setCreatingPlan(true)}>
              <Icon name="plus" size={15} /> {t("training:actions.newPlan")}
            </Button>
          )
        }
        tabs={tabs}
        tabValue={area}
        onTabChange={setArea}
        tabsLabel={t("training:chooseArea")}
      >
        {area === "plans" && (
          <PlansTab creating={creatingPlan} onCloseCreate={() => setCreatingPlan(false)} />
        )}

        {area === "tracking" && (
          <>
            <TrainingSummary
              nextSession={nextSession}
              lastSession={lastSession}
              sessionsThisMonth={sessions}
              todaysRoutine={todaysRoutine}
              doneToday={doneToday}
              onToggleToday={() => todaysRoutine && toggleCompletionOn(todaysRoutine.id, today)}
            />

            {trainingRoutines.length > 1 && (
              <div
                className="focus-pills"
                role="tablist"
                aria-label={t("pages:training.chooseRoutine")}
              >
                {trainingRoutines.map((routine) => (
                  <button
                    key={routine.id}
                    type="button"
                    role="tab"
                    aria-selected={selected?.id === routine.id}
                    className={`focus-pills__item ${selected?.id === routine.id ? "is-active" : ""}`}
                    onClick={() => setSelectedId(routine.id)}
                    dir="auto"
                  >
                    {routine.title}
                  </button>
                ))}
              </div>
            )}

            {selected && <RoutineCalendarCard routine={selected} />}

            {treatments.length > 0 && (
              <>
                <h2 className="focus-section-title">{t("training:areas.treatments")}</h2>
                <CompactList>
                  {treatments.map((item) => (
                    <ScheduledRow key={item.id} item={item} />
                  ))}
                </CompactList>
              </>
            )}
          </>
        )}

        {area === "materials" && (
          /*
           * Filed against the training area as a whole. A document that belongs
           * to one plan is attached to that plan instead, on its own screen.
           */
          <ResourcePanels contextId="training" materials={materials} isEditing />
        )}
      </CollectionPage>

      <RoutineFormModal
        show={creatingRoutine}
        onClose={() => setCreatingRoutine(false)}
        onSubmit={(draft) => createRoutine(draft)}
      />
    </>
  );
}
