import { useEffect, useState } from "react";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import { useTranslation } from "react-i18next";
import { InfoNote } from "../../components/ui/InfoNote";
import { TokenListField } from "../../components/ui/TokenListField";
import { WeekdayField } from "../../components/ui/WeekdayField";
import { useFamily } from "../../state/familyContext";
import { useManage } from "../../state/manageContext";
import type { EntityReference, Medication, MedicationForm } from "../../types";

interface MedicationFormModalProps {
  show: boolean;
  onClose: () => void;
  medication?: Medication;
  defaultRelated?: EntityReference;
}

const FORMS: MedicationForm[] = ["medication", "vitamin", "supplement"];

/**
 * A medicine or vitamin, exactly as the user was told it.
 *
 * Every field here is free text or a time. Nothing is parsed, nothing is
 * validated against a drug list, and no field can produce a number the app then
 * reasons with — that boundary is the point, and it is stated in the dose hint
 * and again under the form.
 */
export function MedicationFormModal({
  show,
  onClose,
  medication,
  defaultRelated,
}: MedicationFormModalProps) {
  const { t } = useTranslation(["manage", "common"]);
  const { createMedication, updateMedication } = useManage();
  const { profiles } = useFamily();

  const [name, setName] = useState("");
  const [form, setForm] = useState<MedicationForm>("medication");
  const [dosage, setDosage] = useState("");
  const [times, setTimes] = useState<string[]>([]);
  const [weekdays, setWeekdays] = useState<number[]>([]);
  const [withFood, setWithFood] = useState("");
  const [startsOn, setStartsOn] = useState("");
  const [endsOn, setEndsOn] = useState("");
  const [stockCount, setStockCount] = useState("");
  const [refillRemindAt, setRefillRemindAt] = useState("");
  const [note, setNote] = useState("");
  const [stopped, setStopped] = useState(false);
  const [relatedId, setRelatedId] = useState("");

  useEffect(() => {
    if (!show) return;
    setName(medication?.name ?? "");
    setForm(medication?.form ?? "medication");
    setDosage(medication?.dosage ?? "");
    setTimes(medication?.times ?? []);
    setWeekdays(medication?.weekdays ?? []);
    setWithFood(medication?.withFood ?? "");
    setStartsOn(medication?.startsOn ?? "");
    setEndsOn(medication?.endsOn ?? "");
    setStockCount(medication?.stockCount !== undefined ? String(medication.stockCount) : "");
    setRefillRemindAt(medication?.refillRemindAt ? medication.refillRemindAt.slice(0, 10) : "");
    setNote(medication?.note ?? "");
    setStopped(medication?.status === "stopped");
    setRelatedId(
      medication?.relatedEntity?.kind === "family"
        ? medication.relatedEntity.id
        : defaultRelated?.kind === "family"
          ? defaultRelated.id
          : ""
    );
  }, [show, medication, defaultRelated]);

  const canSave = name.trim().length > 0 && times.length > 0;

  const submit = (event: React.FormEvent): void => {
    event.preventDefault();
    if (!canSave) return;

    const payload = {
      name: name.trim(),
      form,
      dosage: dosage.trim() || undefined,
      times: [...times].sort((a, b) => a.localeCompare(b)),
      // Left as an empty array rather than removed: empty means "every day",
      // which is what the user chose by not narrowing it.
      weekdays,
      withFood: withFood.trim() || undefined,
      startsOn: startsOn || undefined,
      endsOn: endsOn || undefined,
      stockCount: stockCount.trim() ? Number(stockCount) : undefined,
      refillRemindAt: refillRemindAt
        ? new Date(`${refillRemindAt}T09:00:00`).toISOString()
        : undefined,
      note: note.trim() || undefined,
      status: (stopped ? "stopped" : "active") as Medication["status"],
      relatedEntity: relatedId ? ({ kind: "family", id: relatedId } as const) : undefined,
    };

    if (medication) {
      updateMedication(medication.id, payload);
    } else {
      createMedication(payload);
    }
    onClose();
  };

  return (
    <Modal show={show} onHide={onClose} scrollable centered size="lg">
      <form onSubmit={submit}>
        <Modal.Header closeButton closeLabel={t("common:actions.close")}>
          <Modal.Title as="h2" className="h5 mb-0">
            {medication ? t("manage:health.editMedication") : t("manage:health.addMedication")}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <div className="focus-form-stack">
            <div className="focus-field-row">
              <div>
                <label htmlFor="med-name" className="form-label fw-medium">
                  {t("manage:health.name")}
                </label>
                <input
                  id="med-name"
                  className="form-control"
                  dir="auto"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                />
              </div>
              <div>
                <label htmlFor="med-form" className="form-label fw-medium">
                  {t("manage:health.form")}
                </label>
                <select
                  id="med-form"
                  className="form-select"
                  value={form}
                  onChange={(event) => setForm(event.target.value as MedicationForm)}
                >
                  {FORMS.map((option) => (
                    <option key={option} value={option}>
                      {t(`manage:medicationForms.${option}`)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="med-dosage" className="form-label fw-medium">
                {t("manage:health.dosage")}
              </label>
              <input
                id="med-dosage"
                className="form-control"
                dir="auto"
                value={dosage}
                aria-describedby="med-dosage-hint"
                onChange={(event) => setDosage(event.target.value)}
              />
              <p id="med-dosage-hint" className="form-text mb-0">
                {t("manage:health.dosageHint")}
              </p>
            </div>

            <TokenListField
              label={t("manage:health.times")}
              values={times}
              onChange={setTimes}
              inputType="time"
              removeLabel={(value) => t("manage:health.removeTime", { time: value })}
            />

            <WeekdayField
              label={t("manage:health.weekdays")}
              value={weekdays}
              onChange={setWeekdays}
              emptyLabel={t("manage:health.everyDay")}
            />

            <div>
              <label htmlFor="med-food" className="form-label fw-medium">
                {t("manage:health.withFood")}
              </label>
              <input
                id="med-food"
                className="form-control"
                dir="auto"
                placeholder={t("manage:health.withFoodPlaceholder")}
                value={withFood}
                onChange={(event) => setWithFood(event.target.value)}
              />
            </div>

            <div className="focus-field-row">
              <div>
                <label htmlFor="med-start" className="form-label fw-medium">
                  {t("manage:health.startsOn")}
                </label>
                <input
                  id="med-start"
                  type="date"
                  className="form-control"
                  dir="ltr"
                  value={startsOn}
                  onChange={(event) => setStartsOn(event.target.value)}
                />
              </div>
              <div>
                <label htmlFor="med-end" className="form-label fw-medium">
                  {t("manage:health.endsOn")}
                </label>
                <input
                  id="med-end"
                  type="date"
                  className="form-control"
                  dir="ltr"
                  value={endsOn}
                  onChange={(event) => setEndsOn(event.target.value)}
                />
              </div>
            </div>

            <div className="focus-field-row">
              <div>
                <label htmlFor="med-stock" className="form-label fw-medium">
                  {t("manage:health.stockCount")}
                </label>
                <input
                  id="med-stock"
                  type="number"
                  min={0}
                  className="form-control"
                  dir="ltr"
                  value={stockCount}
                  onChange={(event) => setStockCount(event.target.value)}
                />
              </div>
              <div>
                <label htmlFor="med-refill" className="form-label fw-medium">
                  {t("manage:health.refillRemindAt")}
                </label>
                <input
                  id="med-refill"
                  type="date"
                  className="form-control"
                  dir="ltr"
                  value={refillRemindAt}
                  onChange={(event) => setRefillRemindAt(event.target.value)}
                />
              </div>
            </div>

            {profiles.length > 0 && (
              <div>
                <label htmlFor="med-related" className="form-label fw-medium">
                  {t("manage:scheduled.relatedTo")}
                </label>
                <select
                  id="med-related"
                  className="form-select"
                  value={relatedId}
                  onChange={(event) => setRelatedId(event.target.value)}
                >
                  <option value="">{t("manage:scheduled.relatedNobody")}</option>
                  {profiles.map((profile) => (
                    <option key={profile.id} value={profile.id}>
                      {profile.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label htmlFor="med-note" className="form-label fw-medium">
                {t("manage:scheduled.note")}
              </label>
              <textarea
                id="med-note"
                className="form-control"
                dir="auto"
                rows={2}
                value={note}
                onChange={(event) => setNote(event.target.value)}
              />
            </div>

            <div className="form-check">
              <input
                id="med-stopped"
                type="checkbox"
                className="form-check-input"
                checked={stopped}
                onChange={(event) => setStopped(event.target.checked)}
              />
              <label htmlFor="med-stopped" className="form-check-label">
                {t("manage:health.stopped")}
              </label>
            </div>

            <InfoNote tone="caution">{t("manage:health.disclaimer")}</InfoNote>
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
