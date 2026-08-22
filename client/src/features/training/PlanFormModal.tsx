import { useEffect, useState } from "react";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import { useTranslation } from "react-i18next";
import { UrlImageField } from "../../components/ui/UrlImageField";
import { ENVIRONMENTS, PLAN_STATUSES } from "../../lib/training";
import { useTraining } from "../../state/trainingContext";
import type { TrainingEnvironment, TrainingPlan, TrainingPlanStatus } from "../../types";

interface PlanFormModalProps {
  show: boolean;
  onClose: () => void;
  /** Editing an existing plan. Absent means creating one. */
  plan?: TrainingPlan;
  /** Pre-selects the status of the tab the user is looking at. */
  defaultStatus?: TrainingPlanStatus;
}

/**
 * A plan's facts — short by default.
 *
 * Four fields to create one: what it is called, whether it is running, where it
 * happens, and the short name you call it by. The description and the picture
 * are behind "more details", because a plan you are about to fill with
 * exercises does not need a paragraph first, and a form that asks for one is a
 * form people abandon.
 *
 * A draft dialog, so Cancel genuinely discards.
 */
export function PlanFormModal({ show, onClose, plan, defaultStatus }: PlanFormModalProps) {
  const { t } = useTranslation(["training", "common"]);
  const { createPlan, updatePlan } = useTraining();

  const [title, setTitle] = useState("");
  const [status, setStatus] = useState<TrainingPlanStatus>("active");
  const [environment, setEnvironment] = useState<TrainingEnvironment | "">("");
  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [showMore, setShowMore] = useState(false);

  useEffect(() => {
    if (!show) return;
    setTitle(plan?.title ?? "");
    setStatus(plan?.status ?? defaultStatus ?? "active");
    setEnvironment(plan?.environment ?? "");
    setLabel(plan?.label ?? "");
    setDescription(plan?.description ?? "");
    setImageUrl(plan?.imageUrl ?? "");
    // Opened already expanded when there is something in there to see.
    setShowMore(Boolean(plan?.description || plan?.imageUrl));
  }, [show, plan, defaultStatus]);

  const canSave = title.trim().length > 0;

  const submit = (event: React.FormEvent): void => {
    event.preventDefault();
    if (!canSave) return;

    const draft = {
      title: title.trim(),
      status,
      environment: environment || undefined,
      label: label.trim() || undefined,
      description: description.trim() || undefined,
      imageUrl: imageUrl.trim() || undefined,
    };

    if (plan) updatePlan(plan.id, draft);
    else createPlan(draft);
    onClose();
  };

  return (
    <Modal show={show} onHide={onClose} scrollable centered size="lg">
      <form onSubmit={submit}>
        <Modal.Header closeButton closeLabel={t("common:actions.close")}>
          <Modal.Title as="h2" className="h5 mb-0">
            {plan ? t("training:form.editTitle") : t("training:form.createTitle")}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <div className="focus-form-stack">
            <div>
              <label htmlFor="plan-title" className="form-label fw-medium">
                {t("training:fields.title")}
              </label>
              <input
                id="plan-title"
                className="form-control"
                dir="auto"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                required
              />
            </div>

            <div className="focus-field-row">
              <div>
                <label htmlFor="plan-status" className="form-label fw-medium">
                  {t("training:fields.status")}
                </label>
                <select
                  id="plan-status"
                  className="form-select"
                  value={status}
                  onChange={(event) => setStatus(event.target.value as TrainingPlanStatus)}
                >
                  {PLAN_STATUSES.map((value) => (
                    <option key={value} value={value}>
                      {t(`training:status.${value}`)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="plan-environment" className="form-label fw-medium">
                  {t("training:fields.environment")}
                </label>
                <select
                  id="plan-environment"
                  className="form-select"
                  value={environment}
                  onChange={(event) =>
                    setEnvironment(event.target.value as TrainingEnvironment | "")
                  }
                >
                  <option value="">{t("training:fields.environmentUnset")}</option>
                  {ENVIRONMENTS.map((value) => (
                    <option key={value} value={value}>
                      {t(`training:environments.${value}`)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="plan-label" className="form-label fw-medium">
                {t("training:fields.label")}
              </label>
              <input
                id="plan-label"
                className="form-control"
                dir="auto"
                value={label}
                onChange={(event) => setLabel(event.target.value)}
              />
              <p className="form-text mb-0">{t("training:fields.labelHint")}</p>
            </div>

            {showMore ? (
              <>
                <div>
                  <label htmlFor="plan-description" className="form-label fw-medium">
                    {t("training:fields.description")}
                  </label>
                  <textarea
                    id="plan-description"
                    className="form-control"
                    rows={2}
                    dir="auto"
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                  />
                </div>

                <UrlImageField
                  id="plan-image"
                  label={t("training:fields.imageUrl")}
                  hint={t("training:fields.imageHint")}
                  value={imageUrl}
                  onChange={setImageUrl}
                />
              </>
            ) : (
              <Button
                type="button"
                variant="link"
                size="sm"
                className="p-0 text-decoration-none align-self-start"
                onClick={() => setShowMore(true)}
              >
                {t("training:form.moreDetails")}
              </Button>
            )}
          </div>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="outline-secondary" type="button" onClick={onClose}>
            {t("common:actions.cancel")}
          </Button>
          <Button variant="primary" type="submit" disabled={!canSave}>
            {t("common:actions.save")}
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
}
