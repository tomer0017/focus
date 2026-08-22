import { useEffect, useState } from "react";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import { useTranslation } from "react-i18next";
import { TokenListField } from "../../components/ui/TokenListField";
import { UrlImageField } from "../../components/ui/UrlImageField";
import {
  AXIS_BY_KIND,
  OWNERSHIP_STATUSES,
  setPrimaryStatus,
  statusKeyFor,
  statusValuesFor,
  tracksOwnership,
} from "../../lib/leisureCollections";
import { LEISURE_KINDS } from "../../types/leisure";
import { useLeisure } from "../../state/leisureContext";
import type {
  LeisureCompany,
  LeisureCost,
  LeisureEnergy,
  LeisureItem,
  LeisureKind,
  LeisurePlace,
  OwnershipStatus,
} from "../../types";

interface LeisureFormModalProps {
  show: boolean;
  onClose: () => void;
  /** Editing an existing item. Absent means creating one. */
  item?: LeisureItem;
  /** Which collection the user is currently looking at, pre-selected on create. */
  defaultKind?: LeisureKind;
}

const COMPANIES: LeisureCompany[] = ["alone", "partner", "family", "friends"];
const COSTS: LeisureCost[] = ["free", "cheap", "moderate", "expensive"];
const ENERGIES: LeisureEnergy[] = ["low", "medium", "high"];
const PLACES: LeisurePlace[] = ["home", "out"];

/**
 * One saved thing — short to create, fuller to edit.
 *
 * Creating asks five things: which collection, what it is called, where it has
 * got to, a picture and a line about it. That is the whole form. Showing a
 * book's ownership beside a destination's region beside a purchase's budget
 * would be one form with four products' worth of fields, most of them
 * irrelevant to whatever the user is actually adding.
 *
 * Editing shows the fields this kind has, and nothing else — a book has no
 * region and a destination has no budget, so neither is rendered.
 *
 * This is a draft dialog, so Cancel genuinely discards: nothing is written
 * until Save.
 */
export function LeisureFormModal({ show, onClose, item, defaultKind }: LeisureFormModalProps) {
  const { t } = useTranslation(["leisure", "common"]);
  const { createItem, updateItem } = useLeisure();

  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<LeisureKind>("book");
  const [status, setStatus] = useState("");
  const [ownership, setOwnership] = useState<OwnershipStatus | "">("");
  const [note, setNote] = useState("");
  const [url, setUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [region, setRegion] = useState("");
  const [budget, setBudget] = useState("");
  const [currency, setCurrency] = useState("");
  const [minutes, setMinutes] = useState("");
  const [energy, setEnergy] = useState<LeisureEnergy | "">("");
  const [company, setCompany] = useState<LeisureCompany[]>([]);
  const [place, setPlace] = useState<LeisurePlace | "">("");
  const [cost, setCost] = useState<LeisureCost | "">("");
  const [tags, setTags] = useState<string[]>([]);

  useEffect(() => {
    if (!show) return;
    const startingKind = item?.kind ?? defaultKind ?? "book";
    setTitle(item?.title ?? "");
    setKind(startingKind);
    setStatus(
      (item
        ? statusValuesFor(startingKind).find((value) => value === primaryOf(item))
        : undefined) ?? statusValuesFor(startingKind)[0]
    );
    setOwnership(item?.ownershipStatus ?? "");
    setNote(item?.note ?? "");
    setUrl(item?.url ?? "");
    setImageUrl(item?.imageUrl ?? "");
    setRegion(item?.region ?? "");
    setBudget(item?.estimatedBudget !== undefined ? String(item.estimatedBudget) : "");
    setCurrency(item?.currency ?? "");
    setMinutes(item?.minutes !== undefined ? String(item.minutes) : "");
    setEnergy(item?.energy ?? "");
    setCompany(item?.company ?? []);
    setPlace(item?.place ?? "");
    setCost(item?.cost ?? "");
    setTags(item?.tags ?? []);
  }, [show, item, defaultKind]);

  // Switching collection changes which statuses exist, so the old one cannot
  // carry over — "visited" is not a state a book can be in.
  const changeKind = (next: LeisureKind): void => {
    setKind(next);
    setStatus(statusValuesFor(next)[0]);
  };

  const canSave = title.trim().length > 0;
  const isEditing = Boolean(item);

  const submit = (event: React.FormEvent): void => {
    event.preventDefault();
    if (!canSave) return;

    const payload: Partial<LeisureItem> = {
      kind,
      title: title.trim(),
      note: note.trim() || undefined,
      url: url.trim() || undefined,
      imageUrl: imageUrl.trim() || undefined,
      tags,
      ...setPrimaryStatus(kind, status),
      // Two independent axes. Setting how far through a book you are can never
      // change whether you own it, and vice versa.
      ownershipStatus: tracksOwnership(kind) ? ownership || undefined : item?.ownershipStatus,
      region: kind === "destination" ? region.trim() || undefined : item?.region,
      estimatedBudget:
        kind === "future_purchase" && budget.trim() ? Number(budget) : item?.estimatedBudget,
      currency: kind === "future_purchase" ? currency.trim() || undefined : item?.currency,
      minutes: minutes.trim() ? Number(minutes) : undefined,
      energy: energy || undefined,
      company,
      place: place || undefined,
      cost: cost || undefined,
    };

    if (item) {
      updateItem(item.id, payload);
    } else {
      createItem({
        ...payload,
        kind,
        title: title.trim(),
        tags,
        // The legacy axis the suggester still reads. A new item is an idea
        // until somebody plans or finishes it.
        status: "idea",
      } as Parameters<typeof createItem>[0]);
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
                <label htmlFor="leisure-kind" className="form-label fw-medium">
                  {t("leisure:fields.kind")}
                </label>
                <select
                  id="leisure-kind"
                  className="form-select"
                  value={kind}
                  onChange={(event) => changeKind(event.target.value as LeisureKind)}
                >
                  {LEISURE_KINDS.map((value) => (
                    <option key={value} value={value}>
                      {t(`leisure:kinds.${value}`)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="leisure-status" className="form-label fw-medium">
                  {t("leisure:fields.status")}
                </label>
                <select
                  id="leisure-status"
                  className="form-select"
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                >
                  {statusValuesFor(kind).map((value) => (
                    <option key={value} value={value}>
                      {t(`leisure:${statusKeyFor(kind)}.${value}`)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

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

            {/* A book's second, independent fact. Never derived from progress. */}
            {tracksOwnership(kind) && (
              <div>
                <label htmlFor="leisure-ownership" className="form-label fw-medium">
                  {t("leisure:fields.ownership")}
                </label>
                <select
                  id="leisure-ownership"
                  className="form-select"
                  value={ownership}
                  onChange={(event) => setOwnership(event.target.value as OwnershipStatus | "")}
                >
                  <option value="">{t("leisure:ownership.unset")}</option>
                  {OWNERSHIP_STATUSES.map((value) => (
                    <option key={value} value={value}>
                      {t(`leisure:ownership.${value}`)}
                    </option>
                  ))}
                </select>
                <p className="form-text mb-0">{t("leisure:fields.ownershipHint")}</p>
              </div>
            )}

            <div>
              <label htmlFor="leisure-note" className="form-label fw-medium">
                {t("leisure:fields.note")}
              </label>
              <textarea
                id="leisure-note"
                className="form-control"
                rows={2}
                dir="auto"
                value={note}
                onChange={(event) => setNote(event.target.value)}
              />
            </div>

            <UrlImageField
              id="leisure-image"
              label={t("leisure:fields.imageUrl")}
              value={imageUrl}
              onChange={setImageUrl}
            />

            {/*
              Everything past this point is only shown when editing. A new item
              needs a name and a state; the rest is detail somebody adds when
              they have it, and asking for all of it up front is how a two-second
              save becomes a form nobody fills in.
            */}
            {isEditing && (
              <>
                <div>
                  <label htmlFor="leisure-url" className="form-label fw-medium">
                    {t("leisure:fields.url")}
                  </label>
                  <input
                    id="leisure-url"
                    type="url"
                    dir="ltr"
                    className="form-control"
                    placeholder="https://"
                    value={url}
                    onChange={(event) => setUrl(event.target.value)}
                  />
                </div>

                {kind === "destination" && (
                  <div>
                    <label htmlFor="leisure-region" className="form-label fw-medium">
                      {t("leisure:fields.region")}
                    </label>
                    <input
                      id="leisure-region"
                      className="form-control"
                      dir="auto"
                      value={region}
                      onChange={(event) => setRegion(event.target.value)}
                    />
                  </div>
                )}

                {kind === "future_purchase" && (
                  <div className="focus-field-row">
                    <div>
                      <label htmlFor="leisure-budget" className="form-label fw-medium">
                        {t("leisure:fields.budget")}
                      </label>
                      <input
                        id="leisure-budget"
                        type="number"
                        min="0"
                        className="form-control"
                        value={budget}
                        onChange={(event) => setBudget(event.target.value)}
                      />
                      <p className="form-text mb-0">{t("leisure:fields.budgetHint")}</p>
                    </div>
                    <div>
                      <label htmlFor="leisure-currency" className="form-label fw-medium">
                        {t("leisure:fields.currency")}
                      </label>
                      <input
                        id="leisure-currency"
                        className="form-control"
                        dir="auto"
                        value={currency}
                        onChange={(event) => setCurrency(event.target.value)}
                      />
                    </div>
                  </div>
                )}

                <div className="focus-field-row">
                  <div>
                    <label htmlFor="leisure-minutes" className="form-label fw-medium">
                      {t("leisure:fields.minutes")}
                    </label>
                    <input
                      id="leisure-minutes"
                      type="number"
                      min="0"
                      className="form-control"
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
                      <option value="">{t("leisure:filters.all")}</option>
                      {ENERGIES.map((value) => (
                        <option key={value} value={value}>
                          {t(`leisure:energy.${value}`)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="focus-field-row">
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
                      <option value="">{t("leisure:filters.all")}</option>
                      {PLACES.map((value) => (
                        <option key={value} value={value}>
                          {t(`leisure:place.${value}`)}
                        </option>
                      ))}
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
                      <option value="">{t("leisure:filters.all")}</option>
                      {COSTS.map((value) => (
                        <option key={value} value={value}>
                          {t(`leisure:cost.${value}`)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <fieldset>
                  <legend className="form-label fw-medium">{t("leisure:fields.company")}</legend>
                  <div className="focus-chips">
                    {COMPANIES.map((value) => {
                      const checked = company.includes(value);
                      return (
                        <div className="form-check" key={value}>
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id={`leisure-company-${value}`}
                            checked={checked}
                            onChange={() =>
                              setCompany((current) =>
                                checked
                                  ? current.filter((entry) => entry !== value)
                                  : [...current, value]
                              )
                            }
                          />
                          <label className="form-check-label" htmlFor={`leisure-company-${value}`}>
                            {t(`leisure:company.${value}`)}
                          </label>
                        </div>
                      );
                    })}
                  </div>
                </fieldset>

                <TokenListField
                  label={t("leisure:fields.tags")}
                  hint={t("leisure:fields.tagsHint")}
                  values={tags}
                  onChange={setTags}
                  removeLabel={(value) => t("leisure:removeTag", { tag: value })}
                />
              </>
            )}
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

/** The item's current primary status, whichever field holds it. */
function primaryOf(item: LeisureItem): string | undefined {
  switch (AXIS_BY_KIND[item.kind]) {
    case "consumption":
      return item.consumptionStatus;
    case "destination":
      return item.destinationStatus;
    case "purchase":
      return item.purchaseStatus;
    case "none":
      return item.status;
  }
}
