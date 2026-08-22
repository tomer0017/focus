import { useState } from "react";
import { useTranslation } from "react-i18next";
import Button from "react-bootstrap/Button";
import { Icon } from "../../components/ui/Icon";
import { ExternalLink } from "../../components/ui/ExternalLink";
import { isExternalUrl } from "../../lib/links";
import type { FoodKind, FoodStatus, TripFood } from "../../types";

const KINDS: FoodKind[] = ["restaurant", "cafe", "market", "dish"];
const STATUSES: FoodStatus[] = ["option", "planned", "visited"];

interface TripFoodListProps {
  destinationId: string;
  food: TripFood[];
  onUpdate: (foodId: string, patch: Partial<TripFood>) => void;
  onAdd: (food: Omit<TripFood, "id">) => void;
  onRemove: (foodId: string) => void;
}

/**
 * Where to eat in a city.
 *
 * A list with an address and a note, not a map: the address is what you paste
 * into whatever navigation app you already use, and an interactive map would
 * be a different product with a different bill.
 */
export function TripFoodList({
  destinationId,
  food,
  onUpdate,
  onAdd,
  onRemove,
}: TripFoodListProps) {
  const { t } = useTranslation(["trips", "common"]);
  const [name, setName] = useState("");
  const [kind, setKind] = useState<FoodKind>("restaurant");

  return (
    <div className="focus-food">
      <ul className="list-unstyled focus-food__list mb-2">
        {food.map((entry) => (
          <li key={entry.id} className="focus-food__item">
            <div className="focus-food__main">
              <p className="focus-food__name mb-0" dir="auto">
                <Icon name="food" size={14} />
                {entry.name}
                <span className="focus-food__kind">{t(`trips:food.kinds.${entry.kind}`)}</span>
              </p>
              {entry.address && (
                <p className="focus-food__address mb-0" dir="auto">
                  {entry.address}
                </p>
              )}
              {entry.note && (
                <p className="focus-food__note mb-0" dir="auto">
                  {entry.note}
                </p>
              )}
              {isExternalUrl(entry.url) && (
                <ExternalLink href={entry.url}>{t("trips:food.openLink")}</ExternalLink>
              )}
            </div>

            <div className="focus-food__controls">
              <label className="visually-hidden" htmlFor={`food-status-${entry.id}`}>
                {t("trips:food.statusFor", { name: entry.name })}
              </label>
              <select
                id={`food-status-${entry.id}`}
                className="form-select form-select-sm"
                value={entry.status}
                onChange={(event) =>
                  onUpdate(entry.id, { status: event.target.value as FoodStatus })
                }
              >
                {STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {t(`trips:food.statuses.${status}`)}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="focus-icon-button text-secondary"
                onClick={() => onRemove(entry.id)}
                aria-label={t("trips:food.remove", { name: entry.name })}
              >
                <Icon name="trash" size={14} />
              </button>
            </div>
          </li>
        ))}
      </ul>

      <form
        className="focus-inline-form"
        onSubmit={(event) => {
          event.preventDefault();
          const trimmed = name.trim();
          if (!trimmed) return;
          onAdd({ destinationId, name: trimmed, kind, status: "option" });
          setName("");
        }}
      >
        <label className="visually-hidden" htmlFor={`food-add-${destinationId}`}>
          {t("trips:food.add")}
        </label>
        <input
          id={`food-add-${destinationId}`}
          className="form-control form-control-sm"
          dir="auto"
          placeholder={t("trips:food.add")}
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <label className="visually-hidden" htmlFor={`food-kind-${destinationId}`}>
          {t("trips:food.kind")}
        </label>
        <select
          id={`food-kind-${destinationId}`}
          className="form-select form-select-sm"
          value={kind}
          onChange={(event) => setKind(event.target.value as FoodKind)}
        >
          {KINDS.map((value) => (
            <option key={value} value={value}>
              {t(`trips:food.kinds.${value}`)}
            </option>
          ))}
        </select>
        <Button type="submit" size="sm" variant="outline-primary">
          {t("common:actions.save")}
        </Button>
      </form>
    </div>
  );
}
