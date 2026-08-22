import { useEffect, useState } from "react";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import { useTranslation } from "react-i18next";
import { InfoNote } from "../../components/ui/InfoNote";
import { useFamily } from "../../state/familyContext";
import type { EntityReference, QuickLogEntry, QuickLogKind } from "../../types";

interface QuickLogModalProps {
  show: boolean;
  onClose: () => void;
  kind: QuickLogKind;
  owner: EntityReference;
  entry?: QuickLogEntry;
}

const FEED_VARIANTS = ["breast", "bottle", "solids", "other"] as const;

function toLocalInput(iso: string): string {
  const date = new Date(iso);
  const pad = (value: number): string => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

/**
 * The quick log, as a dialog with as little in it as the entry allows.
 *
 * A feed is a time, a kind and optionally an amount. A first taste adds the
 * food, whether it was a first try, and what the parent noticed. Nothing is
 * required beyond the time, which is prefilled to now — the point of a quick
 * log is that recording something costs less effort than not recording it.
 *
 * The "what you noticed" field is the parent's own words and is stored, shown
 * and never interpreted. Focus does not have a reaction taxonomy and must not
 * grow one.
 */
export function QuickLogModal({ show, onClose, kind, owner, entry }: QuickLogModalProps) {
  const { t } = useTranslation(["family", "common"]);
  const { addLog, updateLog } = useFamily();

  const [occurredAt, setOccurredAt] = useState("");
  const [variant, setVariant] = useState<string>("bottle");
  const [title, setTitle] = useState("");
  const [value, setValue] = useState("");
  const [unit, setUnit] = useState("ml");
  const [note, setNote] = useState("");
  const [firstTime, setFirstTime] = useState(false);
  const [followUp, setFollowUp] = useState(false);
  const [followUpAt, setFollowUpAt] = useState("");

  useEffect(() => {
    if (!show) return;
    setOccurredAt(toLocalInput(entry?.occurredAt ?? new Date().toISOString()));
    setVariant(entry?.variant ?? "bottle");
    setTitle(entry?.title ?? "");
    setValue(entry?.value !== undefined ? String(entry.value) : "");
    setUnit(entry?.unit ?? "ml");
    setNote(entry?.note ?? "");
    setFirstTime(entry?.firstTime ?? true);
    setFollowUp(entry?.followUp ?? false);
    setFollowUpAt(entry?.followUpAt ? entry.followUpAt.slice(0, 10) : "");
  }, [show, entry]);

  const isFeeding = kind === "feeding";
  const isTasting = kind === "tasting";

  const submit = (event: React.FormEvent): void => {
    event.preventDefault();

    const payload: Omit<QuickLogEntry, "id"> = {
      kind,
      occurredAt: new Date(occurredAt).toISOString(),
      title: title.trim() || undefined,
      // Kept as a number when it is one and as text when it is not: "120" and
      // "a few spoonfuls" are both honest answers to "how much".
      value: value.trim() ? (Number.isNaN(Number(value)) ? value.trim() : Number(value)) : undefined,
      unit: value.trim() && !Number.isNaN(Number(value)) ? unit : undefined,
      variant: isFeeding ? variant : undefined,
      note: note.trim() || undefined,
      firstTime: isTasting ? firstTime : undefined,
      followUp: isTasting ? followUp : undefined,
      followUpAt: isTasting && followUp && followUpAt ? `${followUpAt}T12:00:00.000Z` : undefined,
      relatedEntity: owner,
    };

    if (entry) {
      updateLog(entry.id, payload);
    } else {
      addLog(payload);
    }
    onClose();
  };

  return (
    <Modal show={show} onHide={onClose} scrollable centered>
      <form onSubmit={submit}>
        <Modal.Header closeButton closeLabel={t("common:actions.close")}>
          <Modal.Title as="h2" className="h5 mb-0">
            {isFeeding ? t("family:log.addFeeding") : t("family:log.addTasting")}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <div className="focus-form-stack">
            <div>
              <label htmlFor="log-when" className="form-label fw-medium">
                {t("family:log.when")}
              </label>
              <input
                id="log-when"
                type="datetime-local"
                className="form-control"
                dir="ltr"
                value={occurredAt}
                onChange={(event) => setOccurredAt(event.target.value)}
                required
              />
            </div>

            {isFeeding && (
              <div>
                <label htmlFor="log-variant" className="form-label fw-medium">
                  {t("family:log.kindLabel")}
                </label>
                <select
                  id="log-variant"
                  className="form-select"
                  value={variant}
                  onChange={(event) => setVariant(event.target.value)}
                >
                  {FEED_VARIANTS.map((option) => (
                    <option key={option} value={option}>
                      {t(`family:log.variants.${option}`)}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {(isTasting || variant === "solids") && (
              <div>
                <label htmlFor="log-title" className="form-label fw-medium">
                  {t("family:log.food")}
                </label>
                <input
                  id="log-title"
                  className="form-control"
                  dir="auto"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                />
              </div>
            )}

            <div className="focus-field-row">
              <div>
                <label htmlFor="log-value" className="form-label fw-medium">
                  {t("family:log.amount")}
                </label>
                <input
                  id="log-value"
                  className="form-control"
                  dir="auto"
                  value={value}
                  onChange={(event) => setValue(event.target.value)}
                />
              </div>
              <div>
                <label htmlFor="log-unit" className="form-label fw-medium">
                  {t("family:log.unit")}
                </label>
                <input
                  id="log-unit"
                  className="form-control"
                  dir="auto"
                  value={unit}
                  onChange={(event) => setUnit(event.target.value)}
                />
              </div>
            </div>

            {isTasting && (
              <>
                <div className="form-check">
                  <input
                    id="log-first"
                    type="checkbox"
                    className="form-check-input"
                    checked={firstTime}
                    onChange={(event) => setFirstTime(event.target.checked)}
                  />
                  <label htmlFor="log-first" className="form-check-label">
                    {t("family:log.firstTime")}
                  </label>
                </div>

                <div className="form-check">
                  <input
                    id="log-followup"
                    type="checkbox"
                    className="form-check-input"
                    checked={followUp}
                    onChange={(event) => setFollowUp(event.target.checked)}
                  />
                  <label htmlFor="log-followup" className="form-check-label">
                    {t("family:log.followUp")}
                  </label>
                </div>

                {followUp && (
                  <div>
                    <label htmlFor="log-followup-at" className="form-label fw-medium">
                      {t("family:log.followUpAt")}
                    </label>
                    <input
                      id="log-followup-at"
                      type="date"
                      className="form-control"
                      dir="ltr"
                      value={followUpAt}
                      onChange={(event) => setFollowUpAt(event.target.value)}
                    />
                  </div>
                )}
              </>
            )}

            <div>
              <label htmlFor="log-note" className="form-label fw-medium">
                {isTasting ? t("family:log.reaction") : t("family:log.note")}
              </label>
              <textarea
                id="log-note"
                className="form-control"
                dir="auto"
                rows={2}
                value={note}
                aria-describedby="log-note-hint"
                onChange={(event) => setNote(event.target.value)}
              />
              {isTasting && (
                <p id="log-note-hint" className="form-text mb-0">
                  {t("family:log.reactionHint")}
                </p>
              )}
            </div>

            <InfoNote tone="caution">{t("family:safety.baby")}</InfoNote>
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
