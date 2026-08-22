import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import { SPACES } from "../../mocks/spaces";
import { EVENT_KINDS, EVENT_TEMPLATES } from "../../lib/eventTemplates";
import { todayKey } from "../../lib/dateKey";
import type { EventKind, SpaceId } from "../../types";
import type { EventDraft } from "../../state/eventsContext";

interface NewEventModalProps {
  show: boolean;
  onClose: () => void;
  onCreate: (draft: EventDraft) => void;
}

/**
 * Create an event from a template — or from nothing.
 *
 * The preview under the picker is the honest part: it shows exactly which
 * sections the template will create, so choosing "Wedding" is a decision about
 * a starting point rather than a guess. "Start blank" is always available.
 */
export function NewEventModal({ show, onClose, onCreate }: NewEventModalProps) {
  const { t } = useTranslation(["events", "common", "pages"]);

  const [kind, setKind] = useState<EventKind>("birthday");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(todayKey());
  const [time, setTime] = useState("19:00");
  const [spaceId, setSpaceId] = useState<SpaceId>("personal");
  const [useTemplate, setUseTemplate] = useState(true);

  useEffect(() => {
    if (!show) return;
    setKind("birthday");
    setTitle("");
    setDate(todayKey());
    setTime("19:00");
    setSpaceId("personal");
    setUseTemplate(true);
  }, [show]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;

    const [year, month, day] = date.split("-").map(Number);
    const [hour, minute] = time.split(":").map(Number);
    const startsAt = new Date(year, (month ?? 1) - 1, day ?? 1, hour ?? 0, minute ?? 0);

    onCreate({
      kind,
      title: trimmed,
      startsAt: startsAt.toISOString(),
      spaceId,
      useTemplate,
    });
    onClose();
  };

  return (
    <Modal show={show} onHide={onClose} centered scrollable>
      <form onSubmit={handleSubmit}>
        <Modal.Header closeButton closeLabel={t("common:actions.cancel")}>
          <Modal.Title as="h2" className="h5">
            {t("events:create.title")}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <div className="mb-3">
            <label htmlFor="event-title" className="form-label fw-medium">
              {t("events:create.name")}
            </label>
            <input
              id="event-title"
              className="form-control"
              value={title}
              dir="auto"
              required
              onChange={(event) => setTitle(event.target.value)}
            />
          </div>

          <div className="focus-form-row">
            <div>
              <label htmlFor="event-kind" className="form-label fw-medium">
                {t("events:create.kind")}
              </label>
              <select
                id="event-kind"
                className="form-select"
                value={kind}
                onChange={(event) => setKind(event.target.value as EventKind)}
              >
                {EVENT_KINDS.map((value) => (
                  <option key={value} value={value}>
                    {t(`events:kinds.${value}`)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="event-space" className="form-label fw-medium">
                {t("pages:quickSave.space")}
              </label>
              <select
                id="event-space"
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
              <label htmlFor="event-date" className="form-label fw-medium">
                {t("events:create.date")}
              </label>
              <input
                id="event-date"
                type="date"
                className="form-control"
                value={date}
                required
                onChange={(event) => setDate(event.target.value)}
              />
            </div>

            <div>
              <label htmlFor="event-time" className="form-label fw-medium">
                {t("events:create.time")}
              </label>
              <input
                id="event-time"
                type="time"
                className="form-control"
                value={time}
                onChange={(event) => setTime(event.target.value)}
              />
            </div>
          </div>

          <div className="form-check mt-3">
            <input
              id="event-template"
              type="checkbox"
              className="form-check-input"
              checked={useTemplate}
              onChange={(event) => setUseTemplate(event.target.checked)}
            />
            <label htmlFor="event-template" className="form-check-label">
              {t("events:create.useTemplate")}
            </label>
          </div>

          <p className="form-text mb-1">{t("events:create.templatePreview")}</p>
          <ul className="focus-template-preview">
            {useTemplate ? (
              EVENT_TEMPLATES[kind].map((sectionKind) => (
                <li key={sectionKind}>{t(`events:sectionKinds.${sectionKind}`)}</li>
              ))
            ) : (
              <li>{t("events:create.blank")}</li>
            )}
          </ul>
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
