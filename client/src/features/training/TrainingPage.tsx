import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import Button from "react-bootstrap/Button";
import { useRoutines } from "../../state/routinesContext";
import { usePages } from "../../state/pagesContext";
import { todayKey } from "../../lib/dateKey";
import { isCompletedOn, isPlannedOn, lastCompletionKey, nextPlannedKey } from "../../lib/routineSchedule";
import { trainingSessionsThisMonth } from "../../lib/pageSelectors";
import { Icon } from "../../components/ui/Icon";
import { SavedItemCard } from "../../components/ui/SavedItemCard";
import { EmptyState } from "../../components/ui/EmptyState";
import { SegmentedNav } from "../../components/ui/SegmentedNav";
import { CompactList } from "../../components/ui/CompactRow";
import { useManage } from "../../state/manageContext";
import { byDueDate, isOpen } from "../../lib/scheduled";
import { ScheduledRow } from "../manage/ScheduledRow";
import { PageHeader } from "../../components/ui/PageHeader";
import { Section } from "../sections/Section";
import { RoutineCalendarCard } from "../routines/RoutineCalendarCard";
import { RoutineFormModal } from "../routines/RoutineFormModal";
import { TrainingSummary } from "./TrainingSummary";
import { ActivePlanCard } from "./ActivePlanCard";

/**
 * The training area.
 *
 * It belongs to Personal but has its own entry in the sidebar, because
 * "am I still training?" is a question people ask far more often than they
 * browse a space. Training plans are ordinary documents in the data model and
 * a first-class section here, which is exactly the split that keeps the model
 * general and the screen specific.
 */
/** The three things this screen is about, one at a time. */
type TrainingArea = "training" | "treatments" | "history";

export function TrainingPage() {
  const { t } = useTranslation(["pages", "common", "dashboard"]);
  const { routines, createRoutine, toggleCompletionOn } = useRoutines();
  const { savedItems } = usePages();
  const [creating, setCreating] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [area, setArea] = useState<TrainingArea>("training");
  const { scheduled } = useManage();

  /*
   * Treatments and follow-ups are `ScheduledItem`s the user already keeps in
   * ongoing management — laser sessions, physio appointments, the blood test
   * that comes round. They are *shown* here because this is the screen about
   * the body, but they are not copied: this reads the same slice manage does,
   * and editing one opens the same dialog.
   */
  const treatments = useMemo(
    () =>
      scheduled
        .filter(
          (item) =>
            isOpen(item) &&
            (item.category === "appointment" || item.category === "checkup" ||
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
  const trainingItems = useMemo(
    () =>
      savedItems
        .filter((item) => item.contextIds.includes("training"))
        .sort((a, b) => b.savedAt.localeCompare(a.savedAt)),
    [savedItems]
  );

  const plans = trainingItems.filter((item) => item.kind === "document");
  const [activePlan, ...previousPlans] = plans;
  const references = trainingItems.filter((item) => item.kind !== "document");

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
   * the button to a *different* routine the instant you pressed it — the label
   * would snap back to "mark today's session" and undo would be unreachable.
   */
  const todaysRoutine =
    trainingRoutines.find((routine) => isCompletedOn(routine, today)) ??
    trainingRoutines.find((routine) => isPlannedOn(routine, today)) ??
    nextSession?.routine ??
    trainingRoutines[0] ??
    null;
  const doneToday = todaysRoutine ? isCompletedOn(todaysRoutine, today) : false;

  return (
    <>
      <PageHeader
        title={t("pages:training.title")}
        lead={t("pages:training.lead")}
        action={
          <Button variant="primary" size="sm" onClick={() => setCreating(true)}>
            <Icon name="plus" size={15} />
            {t("pages:routineForm.createTitle")}
          </Button>
        }
      />

      {trainingRoutines.length === 0 && treatments.length === 0 ? (
        <EmptyState title={t("pages:training.emptyTitle")} hint={t("pages:training.emptyHint")} />
      ) : (
        <>
          {/*
            Sessions, treatments and history are three different questions and
            were three stacked sections. One at a time; nothing about the data
            moved.
          */}
          <SegmentedNav
            label={t("pages:training.chooseArea")}
            items={[
              { id: "training", label: t("pages:training.areas.training") },
              {
                id: "treatments",
                label: t("pages:training.areas.treatments"),
                badge: treatments.length > 0 ? String(treatments.length) : undefined,
              },
              { id: "history", label: t("pages:training.areas.history") },
            ]}
            value={area}
            onChange={(id) => setArea(id as TrainingArea)}
            variant="tabs"
            collapse
          />

          {area === "training" && (
          <>
          <TrainingSummary
            nextSession={nextSession}
            lastSession={lastSession}
            sessionsThisMonth={sessions}
            todaysRoutine={todaysRoutine}
            doneToday={doneToday}
            onToggleToday={() => todaysRoutine && toggleCompletionOn(todaysRoutine.id, today)}
          />

          <Section title={t("pages:training.activePlan")} hasContent={Boolean(activePlan)}>
            {activePlan && <ActivePlanCard plan={activePlan} />}
          </Section>
          </>
          )}

          {area === "treatments" && (
            treatments.length === 0 ? (
              <p className="focus-day-empty mb-0">{t("pages:training.noTreatments")}</p>
            ) : (
              <CompactList>
                {treatments.map((item) => (
                  <ScheduledRow key={item.id} item={item} />
                ))}
              </CompactList>
            )
          )}

          {area === "history" && (
          <>
          <Section title={t("pages:training.history")} hasContent={Boolean(selected)}>
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
          </Section>

          <Section title={t("pages:training.previousPlans")} hasContent={previousPlans.length > 0}>
            <ul className="list-unstyled focus-grid focus-grid--saved mb-0">
              {previousPlans.map((item) => (
                <li key={item.id}>
                  <SavedItemCard item={item} />
                </li>
              ))}
            </ul>
          </Section>

          <Section title={t("pages:training.references")} hasContent={references.length > 0}>
            <ul className="list-unstyled focus-grid focus-grid--saved mb-0">
              {references.map((item) => (
                <li key={item.id}>
                  <SavedItemCard item={item} />
                </li>
              ))}
            </ul>
          </Section>
          </>
          )}
        </>
      )}

      <RoutineFormModal
        show={creating}
        onClose={() => setCreating(false)}
        onSubmit={(draft) => createRoutine(draft)}
      />
    </>
  );
}
