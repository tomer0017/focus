import { useTranslation } from "react-i18next";
import { CompactRow } from "../../components/ui/CompactRow";
import { OverflowMenu } from "../../components/ui/OverflowMenu";
import { Thumbnail } from "../../components/ui/Thumbnail";
import { useLocale } from "../../i18n/useLocale";
import { formatRelativeDay } from "../../lib/format";
import { exerciseCount } from "../../lib/training";
import type { TrainingPlan, TrainingPlanStatus } from "../../types";

interface PlanRowProps {
  plan: TrainingPlan;
  onEdit: (plan: TrainingPlan) => void;
  onDuplicate: (plan: TrainingPlan) => void;
  onSetStatus: (plan: TrainingPlan, status: TrainingPlanStatus) => void;
  onDelete: (plan: TrainingPlan) => void;
}

const STATUS_CHIP: Record<TrainingPlanStatus, string> = {
  active: "success",
  paused: "muted",
  completed: "info",
};

/**
 * One plan, on one line.
 *
 * The design decision worth naming: when a plan has no picture, the row leads
 * with its **label** — "A", "B", "בית" — set as a small sigil in the slot a
 * thumbnail would occupy. That is not decoration filling a gap. "Today is B" is
 * how these are referred to out loud, so the letter is the most recognisable
 * thing about the plan, and using it means the row never reserves an empty
 * square for a picture that does not exist.
 */
export function PlanRow({ plan, onEdit, onDuplicate, onSetStatus, onDelete }: PlanRowProps) {
  const { t } = useTranslation(["training", "common"]);
  const { locale } = useLocale();

  const count = exerciseCount(plan);

  const leading = plan.imageUrl ? (
    <Thumbnail imageUrl={plan.imageUrl} size="sm" />
  ) : plan.label ? (
    <span className="focus-plan-sigil" aria-hidden="true" dir="auto">
      {plan.label}
    </span>
  ) : undefined;

  return (
    <CompactRow
      title={plan.title}
      href={`/training/plans/${plan.id}`}
      eyebrow={plan.environment ? t(`training:environments.${plan.environment}`) : undefined}
      detail={plan.description}
      leading={leading}
      badges={
        <span className={`focus-chip focus-chip--${STATUS_CHIP[plan.status]}`}>
          {t(`training:status.${plan.status}`)}
        </span>
      }
      meta={
        <>
          {plan.groups.length > 0 && (
            <span>{t("training:plan.groupCount", { count: plan.groups.length })}</span>
          )}
          {count > 0 && <span>{t("training:plan.exerciseCount", { count })}</span>}
          <time dateTime={plan.updatedAt}>{formatRelativeDay(plan.updatedAt, locale)}</time>
        </>
      }
      actions={
        <OverflowMenu
          label={t("common:actions.moreFor", { name: plan.title })}
          actions={[
            { id: "edit", label: t("common:actions.edit"), onSelect: () => onEdit(plan) },
            {
              id: "duplicate",
              label: t("training:actions.duplicate"),
              onSelect: () => onDuplicate(plan),
            },
            // Only the statuses this plan is not already in.
            ...(["active", "paused", "completed"] as TrainingPlanStatus[])
              .filter((status) => status !== plan.status)
              .map((status) => ({
                id: `status-${status}`,
                label: t(`training:actions.moveTo.${status}`),
                onSelect: () => onSetStatus(plan, status),
              })),
            {
              id: "delete",
              label: t("common:actions.delete"),
              danger: true,
              onSelect: () => onDelete(plan),
            },
          ]}
        />
      }
    />
  );
}
