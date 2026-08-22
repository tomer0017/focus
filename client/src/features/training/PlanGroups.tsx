import { useState } from "react";
import Button from "react-bootstrap/Button";
import { useTranslation } from "react-i18next";
import { Icon } from "../../components/ui/Icon";
import { OverflowMenu } from "../../components/ui/OverflowMenu";
import {
  addExercise,
  addGroup,
  moveExercise,
  moveGroup,
  removeExercise,
  removeGroup,
  updateExercise,
  updateGroup,
} from "../../lib/training";
import type { TrainingExercise, TrainingGroup, TrainingPlan } from "../../types";

interface PlanGroupsProps {
  plan: TrainingPlan;
  isEditing: boolean;
  onChange: (plan: TrainingPlan) => void;
}

/**
 * What the plan actually says to do.
 *
 * In view mode this is a table of text — no inputs, no delete buttons, no
 * reorder arrows beside every line. That is the rule the whole app follows, and
 * it matters most here: a plan is read at the gym, on a phone, between sets,
 * and a screen covered in editing controls is a screen you cannot read at a
 * glance.
 *
 * Editing is one explicit step away and saves as it goes. Reordering is
 * **buttons**, never dragging: a drag target is unusable on a phone and
 * unreachable from a keyboard.
 */
export function PlanGroups({ plan, isEditing, onChange }: PlanGroupsProps) {
  const { t } = useTranslation(["training", "common"]);
  const [newGroup, setNewGroup] = useState("");

  if (plan.groups.length === 0 && !isEditing) {
    return <p className="focus-dash-empty">{t("training:plan.empty")}</p>;
  }

  return (
    <div className="focus-plan-groups">
      {plan.groups.map((group, index) => (
        <GroupBlock
          key={group.id}
          plan={plan}
          group={group}
          isEditing={isEditing}
          isFirst={index === 0}
          isLast={index === plan.groups.length - 1}
          onChange={onChange}
        />
      ))}

      {isEditing && (
        <form
          className="focus-plan-add"
          onSubmit={(event) => {
            event.preventDefault();
            if (!newGroup.trim()) return;
            onChange(addGroup(plan, newGroup));
            setNewGroup("");
          }}
        >
          <label className="visually-hidden" htmlFor="plan-new-group">
            {t("training:plan.newGroup")}
          </label>
          <input
            id="plan-new-group"
            className="form-control form-control-sm"
            dir="auto"
            placeholder={t("training:plan.newGroup")}
            value={newGroup}
            onChange={(event) => setNewGroup(event.target.value)}
          />
          <Button type="submit" size="sm" variant="outline-primary" disabled={!newGroup.trim()}>
            {t("training:plan.addGroup")}
          </Button>
        </form>
      )}
    </div>
  );
}

function GroupBlock({
  plan,
  group,
  isEditing,
  isFirst,
  isLast,
  onChange,
}: {
  plan: TrainingPlan;
  group: TrainingGroup;
  isEditing: boolean;
  isFirst: boolean;
  isLast: boolean;
  onChange: (plan: TrainingPlan) => void;
}) {
  const { t } = useTranslation(["training", "common"]);
  const [newExercise, setNewExercise] = useState("");

  return (
    <section className="focus-plan-group">
      <div className="focus-plan-group__head">
        {isEditing ? (
          <input
            className="form-control form-control-sm focus-plan-group__title-input"
            dir="auto"
            aria-label={t("training:plan.groupTitle")}
            value={group.title}
            onChange={(event) => onChange(updateGroup(plan, group.id, { title: event.target.value }))}
          />
        ) : (
          <h3 className="focus-plan-group__title" dir="auto">
            {group.title}
          </h3>
        )}

        {isEditing && (
          <div className="focus-plan-group__controls">
            <button
              type="button"
              className="focus-icon-button btn btn-sm btn-link text-secondary"
              aria-label={t("training:plan.moveGroupUp", { name: group.title })}
              disabled={isFirst}
              onClick={() => onChange(moveGroup(plan, group.id, -1))}
            >
              <Icon name="chevronUp" size={15} />
            </button>
            <button
              type="button"
              className="focus-icon-button btn btn-sm btn-link text-secondary"
              aria-label={t("training:plan.moveGroupDown", { name: group.title })}
              disabled={isLast}
              onClick={() => onChange(moveGroup(plan, group.id, 1))}
            >
              <Icon name="chevronDown" size={15} />
            </button>
            <OverflowMenu
              label={t("common:actions.moreFor", { name: group.title })}
              actions={[
                {
                  id: "remove",
                  label: t("training:plan.removeGroup"),
                  danger: true,
                  onSelect: () => onChange(removeGroup(plan, group.id)),
                },
              ]}
            />
          </div>
        )}
      </div>

      {group.description && !isEditing && (
        <p className="focus-plan-group__lead" dir="auto">
          {group.description}
        </p>
      )}

      {group.exercises.length === 0 && !isEditing ? (
        <p className="focus-dash-empty">{t("training:plan.noExercises")}</p>
      ) : (
        <ul className="focus-plan-exercises list-unstyled mb-0">
          {group.exercises.map((exercise, index) => (
            <ExerciseRow
              key={exercise.id}
              plan={plan}
              groupId={group.id}
              exercise={exercise}
              isEditing={isEditing}
              isFirst={index === 0}
              isLast={index === group.exercises.length - 1}
              onChange={onChange}
            />
          ))}
        </ul>
      )}

      {isEditing && (
        <form
          className="focus-plan-add"
          onSubmit={(event) => {
            event.preventDefault();
            if (!newExercise.trim()) return;
            onChange(addExercise(plan, group.id, newExercise));
            setNewExercise("");
          }}
        >
          <label className="visually-hidden" htmlFor={`new-ex-${group.id}`}>
            {t("training:plan.newExercise")}
          </label>
          <input
            id={`new-ex-${group.id}`}
            className="form-control form-control-sm"
            dir="auto"
            placeholder={t("training:plan.newExercise")}
            value={newExercise}
            onChange={(event) => setNewExercise(event.target.value)}
          />
          <Button type="submit" size="sm" variant="outline-primary" disabled={!newExercise.trim()}>
            {t("common:actions.add")}
          </Button>
        </form>
      )}
    </section>
  );
}

function ExerciseRow({
  plan,
  groupId,
  exercise,
  isEditing,
  isFirst,
  isLast,
  onChange,
}: {
  plan: TrainingPlan;
  groupId: string;
  exercise: TrainingExercise;
  isEditing: boolean;
  isFirst: boolean;
  isLast: boolean;
  onChange: (plan: TrainingPlan) => void;
}) {
  const { t } = useTranslation(["training", "common"]);

  const patch = (change: Partial<TrainingExercise>): void =>
    onChange(updateExercise(plan, groupId, exercise.id, change));

  if (!isEditing) {
    /*
     * Sets, reps and weight are one quiet line under the name rather than three
     * columns. Columns look tidy with four exercises and fall apart at 320px,
     * where "4 × 8 · 60 ק״ג" reads perfectly well on one line.
     */
    const facts = [
      exercise.sets && exercise.reps
        ? `${exercise.sets} × ${exercise.reps}`
        : exercise.sets || exercise.reps,
      exercise.lastWeight,
    ].filter(Boolean);

    return (
      <li className="focus-plan-exercise">
        <p className="focus-plan-exercise__name" dir="auto">
          {exercise.name}
        </p>
        {facts.length > 0 && (
          <p className="focus-plan-exercise__facts" dir="auto">
            {facts.join(" · ")}
          </p>
        )}
        {exercise.note && (
          <p className="focus-plan-exercise__note" dir="auto">
            {exercise.note}
          </p>
        )}
      </li>
    );
  }

  return (
    <li className="focus-plan-exercise focus-plan-exercise--editing">
      <div className="focus-plan-exercise__fields">
        <input
          className="form-control form-control-sm"
          dir="auto"
          aria-label={t("training:fields.exerciseName")}
          value={exercise.name}
          onChange={(event) => patch({ name: event.target.value })}
        />
        <input
          className="form-control form-control-sm focus-plan-exercise__small"
          dir="auto"
          placeholder={t("training:fields.sets")}
          aria-label={t("training:fields.sets")}
          value={exercise.sets ?? ""}
          onChange={(event) => patch({ sets: event.target.value || undefined })}
        />
        <input
          className="form-control form-control-sm focus-plan-exercise__small"
          dir="auto"
          placeholder={t("training:fields.reps")}
          aria-label={t("training:fields.reps")}
          value={exercise.reps ?? ""}
          onChange={(event) => patch({ reps: event.target.value || undefined })}
        />
        <input
          className="form-control form-control-sm focus-plan-exercise__small"
          dir="auto"
          placeholder={t("training:fields.lastWeight")}
          aria-label={t("training:fields.lastWeight")}
          value={exercise.lastWeight ?? ""}
          onChange={(event) => patch({ lastWeight: event.target.value || undefined })}
        />
      </div>

      <input
        className="form-control form-control-sm"
        dir="auto"
        placeholder={t("training:fields.exerciseNote")}
        aria-label={t("training:fields.exerciseNote")}
        value={exercise.note ?? ""}
        onChange={(event) => patch({ note: event.target.value || undefined })}
      />

      <div className="focus-plan-exercise__controls">
        <button
          type="button"
          className="focus-icon-button btn btn-sm btn-link text-secondary"
          aria-label={t("training:plan.moveExerciseUp", { name: exercise.name })}
          disabled={isFirst}
          onClick={() => onChange(moveExercise(plan, groupId, exercise.id, -1))}
        >
          <Icon name="chevronUp" size={15} />
        </button>
        <button
          type="button"
          className="focus-icon-button btn btn-sm btn-link text-secondary"
          aria-label={t("training:plan.moveExerciseDown", { name: exercise.name })}
          disabled={isLast}
          onClick={() => onChange(moveExercise(plan, groupId, exercise.id, 1))}
        >
          <Icon name="chevronDown" size={15} />
        </button>
        <button
          type="button"
          className="focus-icon-button btn btn-sm btn-link text-danger"
          aria-label={t("training:plan.removeExercise", { name: exercise.name })}
          onClick={() => onChange(removeExercise(plan, groupId, exercise.id))}
        >
          <Icon name="trash" size={15} />
        </button>
      </div>
    </li>
  );
}
