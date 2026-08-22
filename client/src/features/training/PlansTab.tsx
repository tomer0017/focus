import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CompactList } from "../../components/ui/CompactRow";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { EmptyState } from "../../components/ui/EmptyState";
import { FilterChips, type FilterOption } from "../../components/ui/FilterChips";
import { PagedList } from "../../components/ui/PagedList";
import { SearchField } from "../../components/ui/SearchField";
import { ENVIRONMENTS, countByStatus, filterPlans, sortPlans } from "../../lib/training";
import { useTraining } from "../../state/trainingContext";
import type { TrainingEnvironment, TrainingPlan, TrainingPlanStatus } from "../../types";
import { PlanFormModal } from "./PlanFormModal";
import { PlanRow } from "./PlanRow";

const ALL = "all";
const STATUSES: TrainingPlanStatus[] = ["active", "paused", "completed"];

function isStatus(value: string | null): value is TrainingPlanStatus {
  return STATUSES.includes(value as TrainingPlanStatus);
}

interface PlansTabProps {
  creating: boolean;
  onCloseCreate: () => void;
}

/**
 * Every plan, one row each.
 *
 * The screen this replaces had exactly one "active plan" — whichever training
 * document happened to be newest — so running Plan A and Plan B in the same
 * week could not be represented. Status is a filter here, not a slot: as many
 * plans can be active as the user says are.
 *
 * Status, environment and the search term all live in the URL, so a refresh and
 * the back button land on the same list.
 */
export function PlansTab({ creating, onCloseCreate }: PlansTabProps) {
  const { t } = useTranslation(["training", "common"]);
  const { plans, updatePlan, duplicate, deletePlan } = useTraining();
  const [params, setParams] = useSearchParams();

  const [editing, setEditing] = useState<TrainingPlan | undefined>(undefined);
  const [deleting, setDeleting] = useState<TrainingPlan | undefined>(undefined);

  const statusParam = params.get("status");
  const status: TrainingPlanStatus | typeof ALL = isStatus(statusParam)
    ? statusParam
    : statusParam === ALL
      ? ALL
      : "active";
  const environment = params.get("where") ?? ALL;
  const query = params.get("q") ?? "";

  const setParam = (key: string, value: string): void => {
    const next = new URLSearchParams(params);
    if (value && value !== ALL) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  const counts = useMemo(() => countByStatus(plans), [plans]);

  const visible = useMemo(
    () =>
      sortPlans(
        filterPlans(plans, {
          status: status === ALL ? undefined : status,
          environment: environment === ALL ? undefined : (environment as TrainingEnvironment),
          query: query || undefined,
        })
      ),
    [plans, status, environment, query]
  );

  const statusOptions: FilterOption<string>[] = [
    ...STATUSES.map((value) => ({
      value,
      label: t(`training:status.${value}`),
      count: counts[value],
    })),
    { value: ALL, label: t("training:filters.all"), count: plans.length },
  ];

  /* Only the places this user's plans actually happen. */
  const environmentOptions: FilterOption<string>[] = [
    { value: ALL, label: t("training:filters.anywhere") },
    ...ENVIRONMENTS.map((value) => ({
      value,
      label: t(`training:environments.${value}`),
      count: plans.filter((plan) => plan.environment === value).length,
    })).filter((option) => option.count > 0),
  ];

  return (
    <>
      <div className="focus-collection__toolbar">
        <FilterChips
          label={t("training:filters.status")}
          options={statusOptions}
          value={status}
          onChange={(value) => setParam("status", value)}
        />
        {environmentOptions.length > 2 && (
          <FilterChips
            label={t("training:filters.where")}
            options={environmentOptions}
            value={environment}
            onChange={(value) => setParam("where", value)}
          />
        )}
        <SearchField
          label={t("training:searchPlans")}
          value={query}
          onChange={(value) => setParam("q", value)}
          resultCount={query ? visible.length : undefined}
        />
      </div>

      {visible.length === 0 ? (
        <EmptyState
          title={
            query || environment !== ALL
              ? t("training:noMatches")
              : t(`training:emptyIn.${status === ALL ? "active" : status}`)
          }
          hint={query || environment !== ALL ? undefined : t("training:emptyHint")}
        />
      ) : (
        <PagedList items={visible} pageSize={20} resetKey={`${status}:${environment}:${query}`}>
          {(shown) => (
            <CompactList>
              {shown.map((plan) => (
                <li key={plan.id}>
                  <PlanRow
                    plan={plan}
                    onEdit={setEditing}
                    onDuplicate={(entry) =>
                      duplicate(entry.id, t("training:actions.copyOf", { title: entry.title }))
                    }
                    onSetStatus={(entry, next) => updatePlan(entry.id, { status: next })}
                    onDelete={setDeleting}
                  />
                </li>
              ))}
            </CompactList>
          )}
        </PagedList>
      )}

      <PlanFormModal
        show={creating || Boolean(editing)}
        plan={editing}
        defaultStatus={status === ALL ? "active" : status}
        onClose={() => {
          onCloseCreate();
          setEditing(undefined);
        }}
      />

      <ConfirmDialog
        show={Boolean(deleting)}
        title={t("training:actions.deleteTitle")}
        body={t("training:actions.deleteBody", { title: deleting?.title ?? "" })}
        confirmLabel={t("common:actions.delete")}
        onConfirm={() => {
          if (deleting) deletePlan(deleting.id);
          setDeleting(undefined);
        }}
        onCancel={() => setDeleting(undefined)}
      />
    </>
  );
}
