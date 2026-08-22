import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { CompactList, CompactRow } from "../../components/ui/CompactRow";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { Icon } from "../../components/ui/Icon";
import { InfoNote } from "../../components/ui/InfoNote";
import { ShowMore } from "../../components/ui/ShowMore";
import { useLocale } from "../../i18n/useLocale";
import { formatClockTime } from "../../lib/format";
import { todayKey } from "../../lib/dateKey";
import { dosesForDay, needsRefill } from "../../lib/medications";
import { byDueDate, isOpen } from "../../lib/scheduled";
import { useManage } from "../../state/manageContext";
import type { Medication, ScheduledItem } from "../../types";
import { MedicationFormModal } from "./MedicationFormModal";
import { ScheduledFormModal } from "./ScheduledFormModal";
import { ScheduledRow } from "./ScheduledRow";

const LIMIT = 5;

/**
 * Appointments, follow-ups and today's medicines.
 *
 * The disclaimer sits **once**, at the bottom of this panel, rather than on
 * every row. A caution printed twelve times is furniture: people stop reading
 * it, which is the opposite of what a caution is for. It is placed here because
 * this is where the claim is being made.
 */
export function HealthPanel() {
  const { t } = useTranslation(["manage", "common"]);
  const { locale } = useLocale();
  const { scheduled, medications, toggleDoseTaken, deleteMedication } = useManage();

  const [editingMedication, setEditingMedication] = useState<Medication | undefined>(undefined);
  const [creatingMedication, setCreatingMedication] = useState(false);
  const [editingScheduled, setEditingScheduled] = useState<ScheduledItem | undefined>(undefined);
  const [confirming, setConfirming] = useState<Medication | undefined>(undefined);

  const today = todayKey();
  const doses = useMemo(() => dosesForDay(medications, today), [medications, today]);

  const appointments = scheduled
    .filter((item) => isOpen(item) && (item.category === "appointment" || item.category === "vaccination"))
    .sort(byDueDate);
  const checkups = scheduled
    .filter((item) => isOpen(item) && item.category === "checkup")
    .sort(byDueDate);

  const listPanel = (titleKey: string, items: ScheduledItem[]) =>
    items.length === 0 ? null : (
      <div className="focus-panel">
        <h3 className="focus-panel__title">{t(titleKey)}</h3>
        <ShowMore items={items} limit={LIMIT}>
          {(visible) => (
            <CompactList>
              {visible.map((item) => (
                <ScheduledRow key={item.id} item={item} onEdit={setEditingScheduled} />
              ))}
            </CompactList>
          )}
        </ShowMore>
      </div>
    );

  return (
    <>
      <div className="focus-panel-grid">
        <div className="focus-panel">
          <div className="d-flex align-items-center justify-content-between gap-2 mb-1">
            <h3 className="focus-panel__title mb-0">{t("manage:health.medications")}</h3>
            <button
              type="button"
              className="btn btn-sm btn-link text-decoration-none p-0"
              onClick={() => setCreatingMedication(true)}
            >
              {t("manage:health.addMedication")}
            </button>
          </div>

          <p className="focus-panel__lead">{t("manage:health.today")}</p>

          {doses.length === 0 ? (
            <p className="focus-panel__lead mb-0">{t("manage:health.noDoses")}</p>
          ) : (
            <CompactList>
              {doses.map((dose) => (
                <li key={dose.key}>
                  <CompactRow
                    title={dose.name}
                    detail={[dose.dosage, dose.withFood].filter(Boolean).join(" · ") || undefined}
                    tone={dose.taken ? "done" : "neutral"}
                    meta={<span dir="ltr">{formatClockTime(dose.time, locale)}</span>}
                    badges={
                      dose.taken ? (
                        <span className="focus-chip focus-chip--info">
                          {t("manage:health.taken")}
                        </span>
                      ) : undefined
                    }
                    actions={
                      <button
                        type="button"
                        className="focus-icon-button btn btn-sm btn-link text-secondary"
                        aria-label={`${
                          dose.taken
                            ? t("manage:health.markNotTaken")
                            : t("manage:health.markTaken")
                        } — ${dose.name} ${dose.time}`}
                        aria-pressed={dose.taken}
                        onClick={() => toggleDoseTaken(dose.medicationId, dose.key)}
                      >
                        <Icon name="check" size={16} />
                      </button>
                    }
                  />
                </li>
              ))}
            </CompactList>
          )}

          {medications.length > 0 && (
            <ul className="focus-dense-rows list-unstyled mb-0 mt-2">
              {medications.map((medication) => (
                <li key={medication.id}>
                  <CompactRow
                    title={medication.name}
                    eyebrow={t(`manage:medicationForms.${medication.form}`)}
                    detail={medication.dosage}
                    badges={
                      <>
                        {medication.status === "stopped" && (
                          <span className="focus-chip focus-chip--muted">
                            {t("manage:health.stopped")}
                          </span>
                        )}
                        {needsRefill(medication) && (
                          <span className="focus-chip focus-chip--warning">
                            {t("manage:health.refillDue")}
                          </span>
                        )}
                      </>
                    }
                    actions={
                      <>
                        <button
                          type="button"
                          className="focus-icon-button btn btn-sm btn-link text-secondary"
                          aria-label={t("common:actions.editNamed", { name: medication.name })}
                          onClick={() => setEditingMedication(medication)}
                        >
                          <Icon name="edit" size={15} />
                        </button>
                        <button
                          type="button"
                          className="focus-icon-button btn btn-sm btn-link text-secondary"
                          aria-label={t("common:actions.deleteNamed", { name: medication.name })}
                          onClick={() => setConfirming(medication)}
                        >
                          <Icon name="trash" size={15} />
                        </button>
                      </>
                    }
                  />
                </li>
              ))}
            </ul>
          )}
        </div>

        {listPanel("manage:health.appointments", appointments)}
        {listPanel("manage:health.checkups", checkups)}
      </div>

      <div className="mt-2">
        <InfoNote tone="caution">{t("manage:health.disclaimer")}</InfoNote>
      </div>

      <MedicationFormModal
        show={Boolean(editingMedication) || creatingMedication}
        medication={editingMedication}
        onClose={() => {
          setEditingMedication(undefined);
          setCreatingMedication(false);
        }}
      />

      <ScheduledFormModal
        show={Boolean(editingScheduled)}
        item={editingScheduled}
        onClose={() => setEditingScheduled(undefined)}
      />

      <ConfirmDialog
        show={Boolean(confirming)}
        title={t("manage:health.deleteTitle")}
        body={t("manage:health.deleteBody", { title: confirming?.name ?? "" })}
        confirmLabel={t("common:actions.delete")}
        onConfirm={() => {
          if (confirming) deleteMedication(confirming.id);
          setConfirming(undefined);
        }}
        onCancel={() => setConfirming(undefined)}
      />
    </>
  );
}
