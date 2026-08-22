import type { ReactNode } from "react";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import { useTranslation } from "react-i18next";

interface ConfirmDialogProps {
  show: boolean;
  title: string;
  /** What will happen, in plain words. Say the count, not "some items". */
  body: string;
  /** An extra warning under the body, for a cascade or a permanent removal. */
  caution?: string;
  confirmLabel: string;
  /**
   * One extra control, at most — a single opt-in checkbox such as "also delete
   * the 4 records that point at this". Deliberately narrow: a dialog that
   * accepts arbitrary children becomes a form, and a form is not something to
   * fill in on the way to a destructive action.
   */
  extra?: ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * The one confirmation dialog.
 *
 * Used only where the action is genuinely hard to undo — deleting a profile,
 * deleting a record. Everything else either saves as it goes or has an obvious
 * way back, and asking "are you sure?" about a reversible action is how people
 * learn to click through the ones that matter.
 *
 * The body states the consequence with real numbers. "This will also delete 3
 * appointments and 1 medication" is a decision; "are you sure?" is a reflex.
 */
export function ConfirmDialog({
  show,
  title,
  body,
  caution,
  confirmLabel,
  extra,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const { t } = useTranslation();

  return (
    <Modal show={show} onHide={onCancel} centered>
      <Modal.Header closeButton closeLabel={t("actions.close")}>
        <Modal.Title as="h2" className="h5 mb-0">
          {title}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p className="mb-0">{body}</p>
        {extra && <div className="mt-3">{extra}</div>}
        {caution && <p className="focus-inline-error mb-0 mt-2">{caution}</p>}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="light" onClick={onCancel}>
          {t("actions.cancel")}
        </Button>
        <Button variant="danger" onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
