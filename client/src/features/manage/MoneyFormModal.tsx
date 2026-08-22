import { useEffect, useState } from "react";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import { useTranslation } from "react-i18next";
import { todayKey } from "../../lib/dateKey";
import { useManage } from "../../state/manageContext";
import type { MoneyDirection, MoneyEntry } from "../../types";

interface MoneyFormModalProps {
  show: boolean;
  onClose: () => void;
  entry?: MoneyEntry;
  defaultDirection?: MoneyDirection;
  /** `YYYY-MM` of the month being viewed, so a new entry lands in it. */
  defaultMonth?: string;
}

/**
 * One income or expense line.
 *
 * Six fields, and only `amount` is required to mean anything. `paid` defaults
 * to true for income (money that arrived) and false for an expense, because an
 * expense you are recording is usually one you have not settled yet — that is
 * the whole reason the flag exists separately from the date.
 */
export function MoneyFormModal({
  show,
  onClose,
  entry,
  defaultDirection,
  defaultMonth,
}: MoneyFormModalProps) {
  const { t } = useTranslation(["manage", "common"]);
  const { createMoneyEntry, updateMoneyEntry } = useManage();

  const [direction, setDirection] = useState<MoneyDirection>("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [occurredOn, setOccurredOn] = useState(todayKey());
  const [recurring, setRecurring] = useState(false);
  const [paid, setPaid] = useState(false);
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!show) return;
    const next = entry?.direction ?? defaultDirection ?? "expense";
    setDirection(next);
    setAmount(entry?.amount !== undefined ? String(entry.amount) : "");
    setCategory(entry?.category ?? "");
    setOccurredOn(
      entry?.occurredOn ??
        // Keep a new entry inside the month being looked at, rather than
        // silently filing it under today when browsing last month.
        (defaultMonth && !todayKey().startsWith(defaultMonth)
          ? `${defaultMonth}-01`
          : todayKey())
    );
    setRecurring(entry?.recurring ?? false);
    setPaid(entry?.paid ?? next === "income");
    setNote(entry?.note ?? "");
  }, [show, entry, defaultDirection, defaultMonth]);

  const canSave = amount.trim().length > 0 && Number(amount) > 0;

  const submit = (event: React.FormEvent): void => {
    event.preventDefault();
    if (!canSave) return;

    const payload = {
      direction,
      amount: Number(amount),
      category: category.trim() || undefined,
      occurredOn,
      recurring,
      paid,
      note: note.trim() || undefined,
      relatedEntity: entry?.relatedEntity,
    };

    if (entry) {
      updateMoneyEntry(entry.id, payload);
    } else {
      createMoneyEntry(payload);
    }
    onClose();
  };

  return (
    <Modal show={show} onHide={onClose} scrollable centered>
      <form onSubmit={submit}>
        <Modal.Header closeButton closeLabel={t("common:actions.close")}>
          <Modal.Title as="h2" className="h5 mb-0">
            {entry
              ? t("manage:money.edit")
              : direction === "income"
                ? t("manage:money.addIncome")
                : t("manage:money.addExpense")}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <div className="focus-form-stack">
            <div className="focus-field-row">
              <div>
                <label htmlFor="money-direction" className="form-label fw-medium">
                  {t("manage:money.direction")}
                </label>
                <select
                  id="money-direction"
                  className="form-select"
                  value={direction}
                  onChange={(event) => setDirection(event.target.value as MoneyDirection)}
                >
                  <option value="income">{t("manage:money.income")}</option>
                  <option value="expense">{t("manage:money.expense")}</option>
                </select>
              </div>
              <div>
                <label htmlFor="money-amount" className="form-label fw-medium">
                  {t("manage:money.amount")}
                </label>
                <input
                  id="money-amount"
                  type="number"
                  min={0}
                  step="1"
                  className="form-control"
                  dir="ltr"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  required
                />
              </div>
            </div>

            <div className="focus-field-row">
              <div>
                <label htmlFor="money-category" className="form-label fw-medium">
                  {t("manage:money.category")}
                </label>
                <input
                  id="money-category"
                  className="form-control"
                  dir="auto"
                  placeholder={t("manage:money.categoryPlaceholder")}
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                />
              </div>
              <div>
                <label htmlFor="money-date" className="form-label fw-medium">
                  {t("manage:money.occurredOn")}
                </label>
                <input
                  id="money-date"
                  type="date"
                  className="form-control"
                  dir="ltr"
                  value={occurredOn}
                  onChange={(event) => setOccurredOn(event.target.value)}
                />
              </div>
            </div>

            <div>
              <label htmlFor="money-note" className="form-label fw-medium">
                {t("manage:scheduled.note")}
              </label>
              <input
                id="money-note"
                className="form-control"
                dir="auto"
                value={note}
                onChange={(event) => setNote(event.target.value)}
              />
            </div>

            <div className="form-check">
              <input
                id="money-recurring"
                type="checkbox"
                className="form-check-input"
                checked={recurring}
                onChange={(event) => setRecurring(event.target.checked)}
              />
              <label htmlFor="money-recurring" className="form-check-label">
                {t("manage:money.recurring")}
              </label>
            </div>

            <div className="form-check">
              <input
                id="money-paid"
                type="checkbox"
                className="form-check-input"
                checked={paid}
                onChange={(event) => setPaid(event.target.checked)}
              />
              <label htmlFor="money-paid" className="form-check-label">
                {t("manage:money.paid")}
              </label>
            </div>
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
