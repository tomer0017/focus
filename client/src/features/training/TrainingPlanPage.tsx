import { useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import Button from "react-bootstrap/Button";
import { useTranslation } from "react-i18next";
import { BackButton } from "../../components/ui/BackButton";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { EmptyState } from "../../components/ui/EmptyState";
import { PageHeader } from "../../components/ui/PageHeader";
import { SegmentedNav, type SegmentedItem } from "../../components/ui/SegmentedNav";
import { Thumbnail } from "../../components/ui/Thumbnail";
import { TRAINING_NOTE_TEMPLATES } from "../../lib/training";
import { usePages } from "../../state/pagesContext";
import { useTraining } from "../../state/trainingContext";
import type { ProjectNote } from "../../types";
import { ProjectNotes } from "../page/ProjectNotes";
import { ResourcePanels } from "../resources/ResourcePanels";
import { PlanFormModal } from "./PlanFormModal";
import { PlanGroups } from "./PlanGroups";

type Topic = "plan" | "notes" | "materials";
const TOPICS: Topic[] = ["plan", "notes", "materials"];

/**
 * One training plan.
 *
 * Three topics, one at a time: what to do, what you want to remember, and what
 * you saved. Stacking all three would make a plan with a single group look like
 * a mostly-empty page, and the thing you open this screen for at the gym is the
 * first one.
 *
 * Opens in view mode. Editing is one action beside the title and saves as it
 * goes, so the way out says "done editing".
 */
export function TrainingPlanPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation(["training", "common"]);
  const navigate = useNavigate();
  const { getPlan, putPlan, setNotes, deletePlan } = useTraining();
  const { savedItemsFor } = usePages();
  const [params, setParams] = useSearchParams();

  const [editingFacts, setEditingFacts] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const plan = id ? getPlan(id) : undefined;
  const materials = useMemo(() => (id ? savedItemsFor(id) : []), [savedItemsFor, id]);

  const topicParam = params.get("topic");
  const topic: Topic = TOPICS.includes(topicParam as Topic) ? (topicParam as Topic) : "plan";

  if (!plan) {
    return (
      <>
        <BackButton />
        <EmptyState title={t("training:missing")} hint={t("training:missingHint")} />
      </>
    );
  }

  const setTopic = (next: string): void => {
    const updated = new URLSearchParams(params);
    updated.set("topic", next);
    setParams(updated, { replace: true });
  };

  const notes = plan.notes ?? [];

  const tabs: SegmentedItem[] = [
    { id: "plan", label: t("training:tabs.plan") },
    {
      id: "notes",
      label: t("training:tabs.notes"),
      badge: notes.length > 0 ? String(notes.length) : undefined,
    },
    {
      id: "materials",
      label: t("training:tabs.materials"),
      badge: materials.length > 0 ? String(materials.length) : undefined,
    },
  ];

  return (
    <>
      <BackButton />

      <PageHeader
        title={plan.title}
        action={
          <>
            <Button variant="outline-secondary" size="sm" onClick={() => setEditingFacts(true)}>
              {t("training:actions.editPlan")}
            </Button>
            <Button
              variant={editMode ? "secondary" : "outline-secondary"}
              size="sm"
              onClick={() => setEditMode((current) => !current)}
            >
              {editMode ? t("common:actions.doneEditing") : t("common:actions.edit")}
            </Button>
          </>
        }
      />

      <div className="focus-leisure-brief">
        {plan.imageUrl && <Thumbnail imageUrl={plan.imageUrl} size="md" />}

        <div className="focus-leisure-brief__facts">
          <p className="focus-leisure-brief__status">
            <span className="focus-chip focus-chip--muted">
              {t(`training:status.${plan.status}`)}
            </span>
            {plan.environment && (
              <span className="focus-chip focus-chip--muted">
                {t(`training:environments.${plan.environment}`)}
              </span>
            )}
            {plan.label && (
              <span className="focus-chip focus-chip--primary" dir="auto">
                {plan.label}
              </span>
            )}
          </p>

          {plan.description && (
            <p className="focus-panel__lead mb-0" dir="auto">
              {plan.description}
            </p>
          )}
        </div>
      </div>

      <SegmentedNav
        label={t("training:chooseTopic")}
        items={tabs}
        value={topic}
        onChange={setTopic}
        variant="tabs"
        idPrefix="plan"
        collapse
      />

      <div
        role="tabpanel"
        id={`plan-panel-${topic}`}
        aria-labelledby={`plan-tab-${topic}`}
        className="focus-collection__body"
      >
        {topic === "plan" && (
          <PlanGroups plan={plan} isEditing={editMode} onChange={putPlan} />
        )}

        {topic === "notes" && (
          <ProjectNotes
            notes={notes}
            isEditing={editMode}
            templates={TRAINING_NOTE_TEMPLATES}
            onChange={(next: ProjectNote[]) => setNotes(plan.id, next)}
          />
        )}

        {topic === "materials" && (
          <ResourcePanels contextId={plan.id} materials={materials} isEditing={editMode} />
        )}
      </div>

      {editMode && (
        <div className="focus-danger-zone">
          <Button variant="outline-danger" size="sm" onClick={() => setDeleting(true)}>
            {t("common:actions.delete")}
          </Button>
        </div>
      )}

      <PlanFormModal show={editingFacts} plan={plan} onClose={() => setEditingFacts(false)} />

      <ConfirmDialog
        show={deleting}
        title={t("training:actions.deleteTitle")}
        body={t("training:actions.deleteBody", { title: plan.title })}
        confirmLabel={t("common:actions.delete")}
        onConfirm={() => {
          deletePlan(plan.id);
          navigate("/training");
        }}
        onCancel={() => setDeleting(false)}
      />
    </>
  );
}
