import { useEffect, useState } from "react";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import { useTranslation } from "react-i18next";
import { RecurrenceField } from "../../components/ui/RecurrenceField";
import { InfoNote } from "../../components/ui/InfoNote";
import { useFamily } from "../../state/familyContext";
import { useManage } from "../../state/manageContext";
import { SCHEDULED_CATEGORIES } from "../../types/scheduled";
import type { EntityReference, RecurrenceRule, ScheduledItem, ScheduledItemCategory } from "../../types";

interface ScheduledFormModalProps {
  show: boolean;
  onClose: () => void;
  /** Absent creates; present edits. */
  item?: ScheduledItem;
  /** Preselected category when the modal was opened from a template. */
  defaultCategory?: ScheduledItemCategory;
  /** Preselected owner when opened from inside a family profile. */
  defaultRelated?: EntityReference;
}

/** Minutes before, offered as reminder offsets. Wide first — earlier is safer. */
const OFFSET_PRESETS = [0, 60, 24 * 60, 3 * 24 * 60, 7 * 24 * 60];

/** `datetime-local` wants `YYYY-MM-DDTHH:MM` in local time, not an ISO string. */
function toLocalInput(iso: string | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (value: number): string => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

function fromLocalInput(value: string): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

/**
 * Create or edit one scheduled item.
 *
 * The appointment block is revealed only for the categories that use it, so
 * "call the garage" is three fields and a booked eye test is eight. That is the
 * whole reason `AppointmentDetails` is a nested optional block rather than
 * eight more fields on the type.
 *
 * A draft modal, so Cancel genuinely discards — unlike the in-place editors,
 * which save as they go and end with "Done editing".
 */
export function ScheduledFormModal({
  show,
  onClose,
  item,
  defaultCategory,
  defaultRelated,
}: ScheduledFormModalProps) {
  const { t } = useTranslation(["manage", "common", "family"]);
  const { createScheduled, updateScheduled } = useManage();
  const { profiles } = useFamily();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<ScheduledItemCategory>("reminder");
  const [dueAt, setDueAt] = useState("");
  const [allDay, setAllDay] = useState(false);
  const [recurrence, setRecurrence] = useState<RecurrenceRule | undefined>(undefined);
  const [offsets, setOffsets] = useState<number[]>([]);
  const [note, setNote] = useState("");
  const [result, setResult] = useState("");
  const [location, setLocation] = useState("");
  const [bring, setBring] = useState("");
  const [prepare, setPrepare] = useState("");
  const [followUp, setFollowUp] = useState("");
  const [relatedId, setRelatedId] = useState("");

  // Re-seeded whenever the dialog opens, so a cancelled edit leaves nothing behind.
  useEffect(() => {
    if (!show) return;
    setTitle(item?.title ?? "");
    setCategory(item?.category ?? defaultCategory ?? "reminder");
    setDueAt(toLocalInput(item?.dueAt));
    setAllDay(item?.allDay ?? false);
    setRecurrence(item?.recurrence);
    setOffsets(item?.reminderOffsets ?? []);
    setNote(item?.note ?? "");
    setResult(item?.result ?? "");
    setLocation(item?.appointment?.location ?? "");
    setBring(item?.appointment?.bring ?? "");
    setPrepare(item?.appointment?.prepare ?? "");
    setFollowUp(item?.appointment?.followUp ?? "");
    setRelatedId(
      item?.relatedEntity?.kind === "family"
        ? item.relatedEntity.id
        : defaultRelated?.kind === "family"
          ? defaultRelated.id
          : ""
    );
  }, [show, item, defaultCategory, defaultRelated]);

  const isAppointment =
    category === "appointment" || category === "checkup" || category === "vaccination";
  const isMoney = category === "bill";
  const canSave = title.trim().length > 0;

  const submit = (event: React.FormEvent): void => {
    event.preventDefault();
    if (!canSave) return;

    const appointment = isAppointment
      ? {
          location: location.trim() || undefined,
          bring: bring.trim() || undefined,
          prepare: prepare.trim() || undefined,
          followUp: followUp.trim() || undefined,
        }
      : undefined;

    const payload = {
      title: title.trim(),
      category,
      dueAt: fromLocalInput(dueAt),
      allDay,
      recurrence,
      reminderOffsets: offsets,
      note: note.trim() || undefined,
      result: result.trim() || undefined,
      // An appointment block with nothing in it is dropped rather than stored
      // as four empty strings.
      appointment:
        appointment && Object.values(appointment).some(Boolean) ? appointment : undefined,
      relatedEntity: relatedId ? ({ kind: "family", id: relatedId } as const) : undefined,
      status: item?.status ?? ("active" as const),
      savedItemIds: item?.savedItemIds ?? [],
    };

    if (item) {
      updateScheduled(item.id, payload);
    } else {
      createScheduled(payload);
    }
    onClose();
  };

  return (
    <Modal show={show} onHide={onClose} scrollable centered size="lg">
      <form onSubmit={submit}>
        <Modal.Header closeButton closeLabel={t("common:actions.close")}>
          <Modal.Title as="h2" className="h5 mb-0">
            {item ? t("manage:scheduled.edit") : t("manage:scheduled.add")}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <div className="focus-form-stack">
            <div>
              <label htmlFor="sched-title" className="form-label fw-medium">
                {t("manage:scheduled.titleField")}
              </label>
              <input
                id="sched-title"
                className="form-control"
                dir="auto"
                value={title}
                placeholder={t("manage:scheduled.titlePlaceholder")}
                onChange={(event) => setTitle(event.target.value)}
                required
              />
            </div>

            <div className="focus-field-row">
              <div>
                <label htmlFor="sched-category" className="form-label fw-medium">
                  {t("manage:scheduled.category")}
                </label>
                <select
                  id="sched-category"
                  className="form-select"
                  value={category}
                  onChange={(event) => setCategory(event.target.value as ScheduledItemCategory)}
                >
                  {SCHEDULED_CATEGORIES.map((option) => (
                    <option key={option} value={option}>
                      {t(`manage:categories.${option}`)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="sched-due" className="form-label fw-medium">
                  {t("manage:scheduled.dueAt")}
                </label>
                <input
                  id="sched-due"
                  type="datetime-local"
                  className="form-control"
                  dir="ltr"
                  value={dueAt}
                  onChange={(event) => setDueAt(event.target.value)}
                />
              </div>
            </div>

            <div className="form-check">
              <input
                id="sched-allday"
                type="checkbox"
                className="form-check-input"
                checked={allDay}
                onChange={(event) => setAllDay(event.target.checked)}
              />
              <label htmlFor="sched-allday" className="form-check-label">
                {t("manage:scheduled.allDay")}
              </label>
            </div>

            <RecurrenceField value={recurrence} onChange={setRecurrence} />

            <fieldset>
              <legend className="form-label fw-medium">
                {t("manage:scheduled.reminderOffsets")}
              </legend>
              <div className="focus-chips">
                {OFFSET_PRESETS.map((minutes) => {
                  const active = offsets.includes(minutes);
                  const label =
                    minutes === 0
                      ? t("manage:categories.reminder")
                      : minutes < 24 * 60
                        ? t("manage:reminders.snoozeHours", { count: minutes / 60 })
                        : t("manage:reminders.snoozeDays", { count: minutes / (24 * 60) });
                  return (
                    <button
                      key={minutes}
                      type="button"
                      className={`focus-chip-button${active ? " is-active" : ""}`}
                      aria-pressed={active}
                      onClick={() =>
                        setOffsets((current) =>
                          active
                            ? current.filter((entry) => entry !== minutes)
                            : [...current, minutes].sort((a, b) => a - b)
                        )
                      }
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
              <div className="mt-2">
                <InfoNote>{t("manage:reminders.localOnly")}</InfoNote>
              </div>
            </fieldset>

            {profiles.length > 0 && (
              <div>
                <label htmlFor="sched-related" className="form-label fw-medium">
                  {t("manage:scheduled.relatedTo")}
                </label>
                <select
                  id="sched-related"
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

            {isAppointment && (
              <>
                <div className="focus-field-row">
                  <div>
                    <label htmlFor="sched-location" className="form-label fw-medium">
                      {t("manage:scheduled.location")}
                    </label>
                    <input
                      id="sched-location"
                      className="form-control"
                      dir="auto"
                      value={location}
                      onChange={(event) => setLocation(event.target.value)}
                    />
                  </div>
                  <div>
                    <label htmlFor="sched-bring" className="form-label fw-medium">
                      {t("manage:scheduled.bring")}
                    </label>
                    <input
                      id="sched-bring"
                      className="form-control"
                      dir="auto"
                      value={bring}
                      onChange={(event) => setBring(event.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="sched-prepare" className="form-label fw-medium">
                    {t("manage:scheduled.prepare")}
                  </label>
                  <input
                    id="sched-prepare"
                    className="form-control"
                    dir="auto"
                    value={prepare}
                    onChange={(event) => setPrepare(event.target.value)}
                  />
                </div>

                <div>
                  <label htmlFor="sched-followup" className="form-label fw-medium">
                    {t("manage:scheduled.followUp")}
                  </label>
                  <input
                    id="sched-followup"
                    className="form-control"
                    dir="auto"
                    value={followUp}
                    onChange={(event) => setFollowUp(event.target.value)}
                  />
                </div>

                <div>
                  <label htmlFor="sched-result" className="form-label fw-medium">
                    {t("manage:scheduled.result")}
                  </label>
                  <textarea
                    id="sched-result"
                    className="form-control"
                    dir="auto"
                    rows={2}
                    value={result}
                    onChange={(event) => setResult(event.target.value)}
                  />
                  <p className="form-text mb-0">{t("manage:scheduled.resultHint")}</p>
                </div>
              </>
            )}

            {isMoney && (
              <InfoNote>{t("manage:money.noBank")}</InfoNote>
            )}

            <div>
              <label htmlFor="sched-note" className="form-label fw-medium">
                {t("manage:scheduled.note")}
              </label>
              <textarea
                id="sched-note"
                className="form-control"
                dir="auto"
                rows={2}
                value={note}
                onChange={(event) => setNote(event.target.value)}
              />
            </div>
          </div>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="outline-secondary" onClick={onClose} type="button">
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
