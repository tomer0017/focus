import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import { SPACES } from "../../mocks/spaces";
import { useLocale } from "../../i18n/useLocale";
import { formatWeekdayLong } from "../../lib/format";
import { todayKey } from "../../lib/dateKey";
import { weekdayOrder, weekStartFor } from "../../lib/monthGrid";
import type {
  Routine,
  RoutineDomain,
  RoutineDraft,
  RoutineScheduleKind,
  RoutineScheduleRule,
  SpaceId,
} from "../../types";

const DOMAINS: RoutineDomain[] = ["training", "health", "home", "vehicle", "personal", "other"];

const SCHEDULE_KINDS: RoutineScheduleKind[] = [
  "everyNDays",
  "weekdays",
  "monthly",
  "none",
  "reminderOnly",
];

interface RoutineFormModalProps {
  show: boolean;
  /** Present when editing; absent when creating. */
  routine?: Routine;
  onClose: () => void;
  onSubmit: (draft: RoutineDraft) => void;
}

/**
 * Create or edit a recurring activity.
 *
 * The five schedule kinds are the point: a gym block, a monthly appointment,
 * a car service every 180 days and a "sometime, remind me" all need to live in
 * the same list. Forcing them into one weekly grid is what makes habit apps
 * useless for everything except habits.
 */
export function RoutineFormModal({ show, routine, onClose, onSubmit }: RoutineFormModalProps) {
  const { t } = useTranslation(["pages", "common"]);
  const { locale, language } = useLocale();

  const [title, setTitle] = useState("");
  const [domain, setDomain] = useState<RoutineDomain>("training");
  const [spaceId, setSpaceId] = useState<SpaceId>("personal");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [startDate, setStartDate] = useState(todayKey());
  const [scheduleKind, setScheduleKind] = useState<RoutineScheduleKind>("everyNDays");
  const [everyDays, setEveryDays] = useState(3);
  const [weekdays, setWeekdays] = useState<number[]>([0, 3]);
  const [dayOfMonth, setDayOfMonth] = useState(1);

  useEffect(() => {
    if (!show) return;

    setTitle(routine?.title ?? "");
    setDomain(routine?.domain ?? "training");
    setSpaceId(routine?.spaceId ?? "personal");
    setDescription(routine?.description ?? "");
    setNotes(routine?.notes ?? "");
    setStartDate(routine?.startDate ?? todayKey());

    const rule = routine?.schedule;
    setScheduleKind(rule?.kind ?? "everyNDays");
    setEveryDays(rule?.kind === "everyNDays" ? rule.days : 3);
    setWeekdays(rule?.kind === "weekdays" ? rule.weekdays : [0, 3]);
    setDayOfMonth(rule?.kind === "monthly" ? rule.dayOfMonth : 1);
  }, [show, routine]);

  const buildRule = (): RoutineScheduleRule => {
    switch (scheduleKind) {
      case "everyNDays":
        return { kind: "everyNDays", days: Math.max(1, everyDays) };
      case "weekdays":
        return { kind: "weekdays", weekdays: [...weekdays].sort((a, b) => a - b) };
      case "monthly":
        return { kind: "monthly", dayOfMonth: Math.min(28, Math.max(1, dayOfMonth)) };
      case "none":
        return { kind: "none" };
      case "reminderOnly":
        return { kind: "reminderOnly" };
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;

    onSubmit({
      title: trimmed,
      domain,
      spaceId,
      description: description.trim() || undefined,
      notes: notes.trim() || undefined,
      schedule: buildRule(),
      startDate,
    });
    onClose();
  };

  const toggleWeekday = (weekday: number): void => {
    setWeekdays((current) =>
      current.includes(weekday)
        ? current.filter((value) => value !== weekday)
        : [...current, weekday]
    );
  };

  return (
    <Modal show={show} onHide={onClose} centered scrollable>
      <form onSubmit={handleSubmit}>
        <Modal.Header closeButton closeLabel={t("common:actions.cancel")}>
          <Modal.Title as="h2" className="h5">
            {routine ? t("pages:routineForm.editTitle") : t("pages:routineForm.createTitle")}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <div className="mb-3">
            <label htmlFor="routine-title" className="form-label fw-medium">
              {t("pages:routineForm.name")}
            </label>
            <input
              id="routine-title"
              className="form-control"
              value={title}
              dir="auto"
              required
              onChange={(event) => setTitle(event.target.value)}
            />
          </div>

          <div className="focus-form-row">
            <div>
              <label htmlFor="routine-domain" className="form-label fw-medium">
                {t("pages:routineForm.domain")}
              </label>
              <select
                id="routine-domain"
                className="form-select"
                value={domain}
                onChange={(event) => setDomain(event.target.value as RoutineDomain)}
              >
                {DOMAINS.map((value) => (
                  <option key={value} value={value}>
                    {t(`common:routineDomains.${value}`)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="routine-space" className="form-label fw-medium">
                {t("pages:quickSave.space")}
              </label>
              <select
                id="routine-space"
                className="form-select"
                value={spaceId}
                onChange={(event) => setSpaceId(event.target.value as SpaceId)}
              >
                {SPACES.map((space) => (
                  <option key={space.id} value={space.id}>
                    {t(`common:spaces.${space.id}`)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="routine-start" className="form-label fw-medium">
                {t("pages:routineForm.startDate")}
              </label>
              <input
                id="routine-start"
                type="date"
                className="form-control"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
              />
            </div>
          </div>

          <div className="mt-3">
            <label htmlFor="routine-description" className="form-label fw-medium">
              {t("pages:routineForm.description")}
            </label>
            <textarea
              id="routine-description"
              className="form-control"
              rows={2}
              dir="auto"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>

          <fieldset className="mt-3">
            <legend className="form-label fw-medium">{t("pages:routineForm.schedule")}</legend>
            <select
              className="form-select"
              value={scheduleKind}
              aria-label={t("pages:routineForm.schedule")}
              onChange={(event) => setScheduleKind(event.target.value as RoutineScheduleKind)}
            >
              {SCHEDULE_KINDS.map((kind) => (
                <option key={kind} value={kind}>
                  {t(`pages:schedule.${kind}`)}
                </option>
              ))}
            </select>

            {scheduleKind === "everyNDays" && (
              <div className="mt-2">
                <label htmlFor="routine-days" className="form-label">
                  {t("pages:routineForm.everyNDays")}
                </label>
                <input
                  id="routine-days"
                  type="number"
                  min={1}
                  max={365}
                  className="form-control focus-number"
                  value={everyDays}
                  onChange={(event) => setEveryDays(Number(event.target.value))}
                />
              </div>
            )}

            {scheduleKind === "weekdays" && (
              <div className="focus-weekday-picker mt-2">
                {weekdayOrder(weekStartFor(language)).map((weekday) => (
                  <label key={weekday} className="focus-weekday-picker__option">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      checked={weekdays.includes(weekday)}
                      onChange={() => toggleWeekday(weekday)}
                    />
                    <span>{formatWeekdayLong(weekday, locale)}</span>
                  </label>
                ))}
              </div>
            )}

            {scheduleKind === "monthly" && (
              <div className="mt-2">
                <label htmlFor="routine-dom" className="form-label">
                  {t("pages:routineForm.dayOfMonth")}
                </label>
                <input
                  id="routine-dom"
                  type="number"
                  min={1}
                  max={28}
                  className="form-control focus-number"
                  value={dayOfMonth}
                  onChange={(event) => setDayOfMonth(Number(event.target.value))}
                />
              </div>
            )}
          </fieldset>

          <div className="mt-3">
            <label htmlFor="routine-notes" className="form-label fw-medium">
              {t("pages:routineForm.notes")}
            </label>
            <textarea
              id="routine-notes"
              className="form-control"
              rows={2}
              dir="auto"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </div>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="outline-secondary" type="button" onClick={onClose}>
            {t("common:actions.cancel")}
          </Button>
          <Button variant="primary" type="submit">
            {t("common:actions.save")}
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
}
