import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import type { PageSummary } from "../../types";

interface PauseReasonModalProps {
  page: PageSummary | null;
  onClose: () => void;
  onSave: (reason: string) => void;
}

/**
 * Why a project is parked — optional, and asked *after* the move rather than
 * as a gate in front of it. Blocking a drag on a form is the fastest way to
 * make people stop using a board.
 */
export function PauseReasonModal({ page, onClose, onSave }: PauseReasonModalProps) {
  const { t } = useTranslation(["projects", "common"]);
  const [reason, setReason] = useState("");

  useEffect(() => {
    setReason(page?.pausedReason ?? "");
  }, [page]);

  return (
    <Modal show={page !== null} onHide={onClose} centered>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSave(reason.trim());
          onClose();
        }}
      >
        <Modal.Header closeButton closeLabel={t("common:actions.cancel")}>
          <Modal.Title as="h2" className="h5">
            {t("projects:pauseReason.title")}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <label htmlFor="pause-reason" className="form-label fw-medium">
            {t("projects:pauseReason.label")}
          </label>
          <textarea
            id="pause-reason"
            className="form-control"
            rows={3}
            dir="auto"
            value={reason}
            aria-describedby="pause-reason-hint"
            onChange={(event) => setReason(event.target.value)}
          />
          <p id="pause-reason-hint" className="form-text mb-0">
            {t("projects:pauseReason.hint")}
          </p>
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
