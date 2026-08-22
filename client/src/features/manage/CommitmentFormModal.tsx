import { useEffect, useState } from "react";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import { useTranslation } from "react-i18next";
import { InfoNote } from "../../components/ui/InfoNote";
import { useManage } from "../../state/manageContext";
import { todayKey } from "../../lib/dateKey";
import type { BillingCycle, Commitment, CommitmentKind } from "../../types";

interface CommitmentFormModalProps {
  show: boolean;
  onClose: () => void;
  commitment?: Commitment;
  defaultKind?: CommitmentKind;
}

const CYCLES: BillingCycle[] = ["monthly", "quarterly", "yearly", "oneOff"];

/** ISO 8601 → the `YYYY-MM-DD` a date input wants, in local time. */
function toDateInput(iso: string | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (value: number): string => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** A date key back to an ISO timestamp at local midday, not midnight. */
function fromDateInput(value: string): string | undefined {
  if (!value) return undefined;
  const [year, month, day] = value.split("-").map(Number);
  // Midday rather than midnight: a charge "on the 4th" must not slide to the
  // 3rd for anyone whose timezone is behind UTC when it is formatted back.
  return new Date(year, (month ?? 1) - 1, day ?? 1, 12, 0, 0).toISOString();
}

/**
 * One form for a policy and for a subscription.
 *
 * Only two things differ, and neither is worth a second form: the labels, and
 * whether the contact field appears. Everything else — cost, cycle, next
 * charge, where to cancel — is the same question asked of the same record.
 */
export function CommitmentFormModal({
  show,
  onClose,
  commitment,
  defaultKind,
}: CommitmentFormModalProps) {
  const { t } = useTranslation(["manage", "common"]);
  const { createCommitment, updateCommitment } = useManage();

  const kind: CommitmentKind = commitment?.kind ?? defaultKind ?? "subscription";

  const [title, setTitle] = useState("");
  const [provider, setProvider] = useState("");
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [cycle, setCycle] = useState<BillingCycle>("monthly");
  const [nextChargeAt, setNextChargeAt] = useState("");
  const [renewalAt, setRenewalAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [contact, setContact] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [manageUrl, setManageUrl] = useState("");
  const [remindDaysBefore, setRemindDaysBefore] = useState("");
  const [cancelled, setCancelled] = useState(false);
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!show) return;
    setTitle(commitment?.title ?? "");
    setProvider(commitment?.provider ?? "");
    setCategory(commitment?.category ?? "");
    setAmount(commitment?.amount !== undefined ? String(commitment.amount) : "");
    setCycle(commitment?.cycle ?? "monthly");
    setNextChargeAt(toDateInput(commitment?.nextChargeAt) || todayKey());
    setRenewalAt(toDateInput(commitment?.renewalAt));
    setEndsAt(toDateInput(commitment?.endsAt));
    setContact(commitment?.contact ?? "");
    setPaymentMethod(commitment?.paymentMethod ?? "");
    setManageUrl(commitment?.manageUrl ?? "");
    setRemindDaysBefore(
      commitment?.remindDaysBefore !== undefined ? String(commitment.remindDaysBefore) : ""
    );
    setCancelled(commitment?.status === "cancelled");
    setNote(commitment?.note ?? "");
  }, [show, commitment]);

  const canSave = title.trim().length > 0;

  const submit = (event: React.FormEvent): void => {
    event.preventDefault();
    if (!canSave) return;

    const payload = {
      kind,
      title: title.trim(),
      provider: provider.trim() || undefined,
      category: category.trim() || undefined,
      amount: amount.trim() ? Number(amount) : undefined,
      cycle,
      nextChargeAt: fromDateInput(nextChargeAt),
      renewalAt: fromDateInput(renewalAt),
      endsAt: fromDateInput(endsAt),
      contact: contact.trim() || undefined,
      paymentMethod: paymentMethod.trim() || undefined,
      manageUrl: manageUrl.trim() || undefined,
      remindDaysBefore: remindDaysBefore.trim() ? Number(remindDaysBefore) : undefined,
      status: (cancelled ? "cancelled" : "active") as Commitment["status"],
      note: note.trim() || undefined,
      savedItemIds: commitment?.savedItemIds ?? [],
    };

    if (commitment) {
      updateCommitment(commitment.id, payload);
    } else {
      createCommitment(payload);
    }
    onClose();
  };

  const titleKey = commitment
    ? "manage:commitments.edit"
    : kind === "insurance"
      ? "manage:commitments.addInsurance"
      : "manage:commitments.addSubscription";

  return (
    <Modal show={show} onHide={onClose} scrollable centered size="lg">
      <form onSubmit={submit}>
        <Modal.Header closeButton closeLabel={t("common:actions.close")}>
          <Modal.Title as="h2" className="h5 mb-0">
            {t(titleKey)}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <div className="focus-form-stack">
            <div className="focus-field-row">
              <div>
                <label htmlFor="com-title" className="form-label fw-medium">
                  {t("manage:scheduled.titleField")}
                </label>
                <input
                  id="com-title"
                  className="form-control"
                  dir="auto"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  required
                />
              </div>
              <div>
                <label htmlFor="com-provider" className="form-label fw-medium">
                  {t("manage:commitments.provider")}
                </label>
                <input
                  id="com-provider"
                  className="form-control"
                  dir="auto"
                  value={provider}
                  onChange={(event) => setProvider(event.target.value)}
                />
              </div>
            </div>

            <div className="focus-field-row">
              <div>
                <label htmlFor="com-amount" className="form-label fw-medium">
                  {t("manage:commitments.amount")}
                </label>
                <input
                  id="com-amount"
                  type="number"
                  min={0}
                  step="1"
                  className="form-control"
                  dir="ltr"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                />
              </div>
              <div>
                <label htmlFor="com-cycle" className="form-label fw-medium">
                  {t("manage:commitments.cycle")}
                </label>
                <select
                  id="com-cycle"
                  className="form-select"
                  value={cycle}
                  onChange={(event) => setCycle(event.target.value as BillingCycle)}
                >
                  {CYCLES.map((option) => (
                    <option key={option} value={option}>
                      {t(`manage:cycles.${option}`)}
                    </option>
                  ))}
                </select>
              </div>
              {kind === "insurance" && (
                <div>
                  <label htmlFor="com-category" className="form-label fw-medium">
                    {t("manage:commitments.category")}
                  </label>
                  <input
                    id="com-category"
                    className="form-control"
                    dir="auto"
                    value={category}
                    onChange={(event) => setCategory(event.target.value)}
                  />
                </div>
              )}
            </div>

            <div className="focus-field-row">
              <div>
                <label htmlFor="com-next" className="form-label fw-medium">
                  {t("manage:commitments.nextChargeAt")}
                </label>
                <input
                  id="com-next"
                  type="date"
                  className="form-control"
                  dir="ltr"
                  value={nextChargeAt}
                  onChange={(event) => setNextChargeAt(event.target.value)}
                />
              </div>
              <div>
                <label htmlFor="com-renewal" className="form-label fw-medium">
                  {t("manage:commitments.renewalAt")}
                </label>
                <input
                  id="com-renewal"
                  type="date"
                  className="form-control"
                  dir="ltr"
                  value={renewalAt}
                  onChange={(event) => setRenewalAt(event.target.value)}
                />
              </div>
              <div>
                <label htmlFor="com-ends" className="form-label fw-medium">
                  {t("manage:commitments.endsAt")}
                </label>
                <input
                  id="com-ends"
                  type="date"
                  className="form-control"
                  dir="ltr"
                  value={endsAt}
                  onChange={(event) => setEndsAt(event.target.value)}
                />
              </div>
            </div>

            <div className="focus-field-row">
              <div>
                <label htmlFor="com-remind" className="form-label fw-medium">
                  {t("manage:commitments.remindDaysBefore")}
                </label>
                <input
                  id="com-remind"
                  type="number"
                  min={0}
                  max={365}
                  className="form-control"
                  dir="ltr"
                  value={remindDaysBefore}
                  onChange={(event) => setRemindDaysBefore(event.target.value)}
                />
              </div>
              {kind === "insurance" && (
                <div>
                  <label htmlFor="com-contact" className="form-label fw-medium">
                    {t("manage:commitments.contact")}
                  </label>
                  <input
                    id="com-contact"
                    className="form-control"
                    dir="auto"
                    value={contact}
                    onChange={(event) => setContact(event.target.value)}
                  />
                </div>
              )}
            </div>

            <div>
              <label htmlFor="com-payment" className="form-label fw-medium">
                {t("manage:commitments.paymentMethod")}
              </label>
              <input
                id="com-payment"
                className="form-control"
                dir="auto"
                value={paymentMethod}
                onChange={(event) => setPaymentMethod(event.target.value)}
                aria-describedby="com-payment-hint"
              />
              <p id="com-payment-hint" className="form-text mb-0">
                {t("manage:commitments.paymentMethodHint")}
              </p>
            </div>

            <div>
              <label htmlFor="com-url" className="form-label fw-medium">
                {t("manage:commitments.manageUrl")}
              </label>
              <input
                id="com-url"
                type="url"
                className="form-control"
                dir="ltr"
                placeholder="https://"
                value={manageUrl}
                onChange={(event) => setManageUrl(event.target.value)}
              />
            </div>

            <div>
              <label htmlFor="com-note" className="form-label fw-medium">
                {t("manage:scheduled.note")}
              </label>
              <textarea
                id="com-note"
                className="form-control"
                dir="auto"
                rows={2}
                value={note}
                onChange={(event) => setNote(event.target.value)}
              />
            </div>

            <div className="form-check">
              <input
                id="com-cancelled"
                type="checkbox"
                className="form-check-input"
                checked={cancelled}
                onChange={(event) => setCancelled(event.target.checked)}
              />
              <label htmlFor="com-cancelled" className="form-check-label">
                {t("manage:commitments.cancelled")}
              </label>
            </div>

            <InfoNote tone="caution">{t("manage:privacy.noCards")}</InfoNote>
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
