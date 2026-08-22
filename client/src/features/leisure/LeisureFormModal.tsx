import { useEffect, useState } from "react";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import { useTranslation } from "react-i18next";
import { TokenListField } from "../../components/ui/TokenListField";
import { LEISURE_KINDS } from "../../types/leisure";
import { useLeisure } from "../../state/leisureContext";
import type {
  LeisureCompany,
  LeisureCost,
  LeisureEnergy,
  LeisureItem,
  LeisureKind,
  LeisurePlace,
  LeisureStatus,
} from "../../types";

interface LeisureFormModalProps {
  show: boolean;
  onClose: () => void;
  item?: LeisureItem;
}

const COMPANIES: LeisureCompany[] = ["alone", "partner", "family", "friends"];
const COSTS: LeisureCost[] = ["free", "cheap", "moderate", "expensive"];
const STATUSES: LeisureStatus[] = ["idea", "planned", "done"];

/**
 * One leisure item.
 *
 * Only the title is required. Every tag is optional because a half-tagged list
 * is still useful — the suggester treats a missing constraint as "no
 * constraint" rather than as a failure to match, so an item with nothing but a
 * name can still be offered when the user asks for anything.
 */
export function LeisureFormModal({ show, onClose, item }: LeisureFormModalProps) {
  const { t } = useTranslation(["leisure", "common"]);
  const { createItem, updateItem } = useLeisure();

  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<LeisureKind>("movie");
  const [note, setNote] = useState("");
  const [url, setUrl] = useState("");
  const [minutes, setMinutes] = useState("");
  const [energy, setEnergy] = useState<LeisureEnergy | "">("");
  const [company, setCompany] = useState<LeisureCompany[]>([]);
  const [place, setPlace] = useState<LeisurePlace | "">("");
  const [cost, setCost] = useState<LeisureCost | "">("");
  const [tags, setTags] = useState<string[]>([]);
  const [status, setStatus] = useState<LeisureStatus>("idea");

  useEffect(() => {
    if (!show) return;
    setTitle(item?.title ?? "");
    setKind(item?.kind ?? "movie");
    setNote(item?.note ?? "");
    setUrl(item?.url ?? "");
    setMinutes(item?.minutes !== undefined ? String(item.minutes) : "");
    setEnergy(item?.energy ?? "");
    setCompany(item?.company ?? []);
    setPlace(item?.place ?? "");
    setCost(item?.cost ?? "");
    setTags(item?.tags ?? []);
    setStatus(item?.status ?? "idea");
  }, [show, item]);

  const canSave = title.trim().length > 0;

  const submit = (event: React.FormEvent): void => {
    event.preventDefault();
    if (!canSave) return;

    const payload = {
      kind,
      title: title.trim(),
      note: note.trim() || undefined,
      url: url.trim() || undefined,
      minutes: minutes.trim() ? Number(minutes) : undefined,
      energy: energy || undefined,
      company,
      place: place || undefined,
      cost: cost || undefined,
      tags,
      status,
      thumb: item?.thumb,
      imageUrl: item?.imageUrl,
    };

    if (item) {
      updateItem(item.id, payload);
    } else {
      createItem(payload);
    }
    onClose();
  };

  return (
    <Modal show={show} onHide={onClose} scrollable centered size="lg">
      <form onSubmit={submit}>
        <Modal.Header closeButton closeLabel={t("common:actions.close")}>
          <Modal.Title as="h2" className="h5 mb-0">
            {item ? t("leisure:edit") : t("leisure:add")}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <div className="focus-form-stack">
            <div className="focus-field-row">
              <div>
                <label htmlFor="leisure-title" className="form-label fw-medium">
                  {t("leisure:fields.title")}
                </label>
                <input
                  id="leisure-title"
                  className="form-control"
                  dir="auto"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  required
                />
              </div>
              <div>
                <label htmlFor="leisure-kind" className="form-label fw-medium">
                  {t("leisure:fields.kind")}
                </label>
                <select
                  id="leisure-kind"
                  className="form-select"
                  value={kind}
                  onChange={(event) => setKind(event.target.value as LeisureKind)}
                >
                  {LEISURE_KINDS.map((option) => (
                    <option key={option} value={option}>
                      {t(`leisure:kinds.${option}`)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="leisure-note" className="form-label fw-medium">
                {t("leisure:fields.note")}
              </label>
              <input
                id="leisure-note"
                className="form-control"
                dir="auto"
                value={note}
                onChange={(event) => setNote(event.target.value)}
              />
            </div>

            <div>
              <label htmlFor="leisure-url" className="form-label fw-medium">
                {t("leisure:fields.url")}
              </label>
              <input
                id="leisure-url"
                type="url"
                className="form-control"
                dir="ltr"
                placeholder="https://"
                value={url}
                onChange={(event) => setUrl(event.target.value)}
              />
            </div>

            <div className="focus-field-row">
              <div>
                <label htmlFor="leisure-minutes" className="form-label fw-medium">
                  {t("leisure:fields.minutes")}
                </label>
                <input
                  id="leisure-minutes"
                  type="number"
                  min={1}
                  className="form-control"
                  dir="ltr"
                  value={minutes}
                  onChange={(event) => setMinutes(event.target.value)}
                />
              </div>
              <div>
                <label htmlFor="leisure-energy" className="form-label fw-medium">
                  {t("leisure:fields.energy")}
                </label>
                <select
                  id="leisure-energy"
                  className="form-select"
                  value={energy}
                  onChange={(event) => setEnergy(event.target.value as LeisureEnergy | "")}
                >
                  <option value="">{t("common:actions.none")}</option>
                  <option value="low">{t("leisure:energy.low")}</option>
                  <option value="medium">{t("leisure:energy.medium")}</option>
                  <option value="high">{t("leisure:energy.high")}</option>
                </select>
              </div>
              <div>
                <label htmlFor="leisure-place" className="form-label fw-medium">
                  {t("leisure:fields.place")}
                </label>
                <select
                  id="leisure-place"
                  className="form-select"
                  value={place}
                  onChange={(event) => setPlace(event.target.value as LeisurePlace | "")}
                >
                  <option value="">{t("common:actions.none")}</option>
                  <option value="home">{t("leisure:place.home")}</option>
                  <option value="out">{t("leisure:place.out")}</option>
                </select>
              </div>
              <div>
                <label htmlFor="leisure-cost" className="form-label fw-medium">
                  {t("leisure:fields.cost")}
                </label>
                <select
                  id="leisure-cost"
                  className="form-select"
                  value={cost}
                  onChange={(event) => setCost(event.target.value as LeisureCost | "")}
                >
                  <option value="">{t("common:actions.none")}</option>
                  {COSTS.map((option) => (
                    <option key={option} value={option}>
                      {t(`leisure:cost.${option}`)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <fieldset>
              <legend className="form-label fw-medium">{t("leisure:fields.company")}</legend>
              <div className="focus-chips">
                {COMPANIES.map((option) => {
                  const active = company.includes(option);
                  return (
                    <button
                      key={option}
                      type="button"
                      className={`focus-chip-button${active ? " is-active" : ""}`}
                      aria-pressed={active}
                      onClick={() =>
                        setCompany((current) =>
                          active
                            ? current.filter((entry) => entry !== option)
                            : [...current, option]
                        )
                      }
                    >
                      {t(`leisure:company.${option}`)}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <TokenListField
              label={t("leisure:fields.tags")}
              hint={t("leisure:fields.tagsHint")}
              values={tags}
              onChange={setTags}
              removeLabel={(value) => t("common:actions.deleteNamed", { name: value })}
            />

            <div>
              <label htmlFor="leisure-status" className="form-label fw-medium">
                {t("leisure:fields.status")}
              </label>
              <select
                id="leisure-status"
                className="form-select"
                value={status}
                onChange={(event) => setStatus(event.target.value as LeisureStatus)}
              >
                {STATUSES.map((option) => (
                  <option key={option} value={option}>
                    {t(`leisure:status.${option}`)}
                  </option>
                ))}
              </select>
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
