import { useState } from "react";
import { useTranslation } from "react-i18next";
import Button from "react-bootstrap/Button";
import { Icon } from "../../components/ui/Icon";
import { OutfitImage } from "./OutfitImage";
import { outfitsForDay, selectedOutfitForDay, sortedOutfits } from "../../lib/outfits";
import type { SavedItem, Trip, TripDayPlan } from "../../types";

interface OutfitDaySectionProps {
  trip: Trip;
  day: TripDayPlan;
  savedItems: SavedItem[];
  onAssign: (outfitId: string, dayId: string) => void;
  onUnassign: (outfitId: string, dayId: string) => void;
  onSelect: (outfitId: string) => void;
  onCreate: (dayId: string) => void;
}

/**
 * "What to wear", inside a day.
 *
 * Closed by default and showing only the chosen look. Several options can hang
 * off one day while you decide; picking one marks it selected, and removing an
 * option unassigns it from the day without deleting the look — the same
 * reference is usually wanted for a different day.
 */
export function OutfitDaySection({
  trip,
  day,
  savedItems,
  onAssign,
  onUnassign,
  onSelect,
  onCreate,
}: OutfitDaySectionProps) {
  const { t } = useTranslation(["trips", "common"]);
  const [picking, setPicking] = useState(false);
  const [choice, setChoice] = useState("");

  const options = outfitsForDay(trip.outfits, day.id);
  const selected = selectedOutfitForDay(trip.outfits, day.id);
  const candidates = sortedOutfits(trip.outfits).filter(
    (outfit) => !outfit.dayIds.includes(day.id)
  );

  return (
    <section className="focus-day-outfit">
      <p className="focus-labelled__label">{t("trips:outfits.dayLabel")}</p>

      {selected ? (
        <div className="focus-day-outfit__chosen">
          <OutfitImage
            outfit={selected}
            savedItems={savedItems}
            className="focus-day-outfit__image"
          />
          <div>
            <p className="focus-day-outfit__name mb-0" dir="auto">
              {selected.title ?? t("trips:outfits.untitled")}
            </p>
            <p className="focus-day-outfit__pieces mb-0">
              {t("trips:outfits.pieceCount", { count: selected.clothingItems.length })}
            </p>
          </div>
          <button
            type="button"
            className="focus-icon-button border"
            onClick={() => onUnassign(selected.id, day.id)}
            aria-label={t("trips:outfits.unassign")}
          >
            <Icon name="trash" size={13} />
          </button>
        </div>
      ) : options.length > 0 ? (
        <ul className="list-unstyled focus-day-outfit__options mb-0">
          {options.map((outfit) => (
            <li key={outfit.id}>
              <span dir="auto">{outfit.title ?? t("trips:outfits.untitled")}</span>
              <span className="focus-day-outfit__option-actions">
                <Button variant="outline-primary" size="sm" onClick={() => onSelect(outfit.id)}>
                  {t("trips:outfits.chooseThis")}
                </Button>
                <button
                  type="button"
                  className="focus-icon-button border"
                  onClick={() => onUnassign(outfit.id, day.id)}
                  aria-label={t("trips:outfits.unassign")}
                >
                  <Icon name="trash" size={13} />
                </button>
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      {picking ? (
        <form
          className="focus-inline-form mt-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (choice) onAssign(choice, day.id);
            setChoice("");
            setPicking(false);
          }}
        >
          <label className="visually-hidden" htmlFor={`outfit-pick-${day.id}`}>
            {t("trips:outfits.pickOutfit")}
          </label>
          <select
            id={`outfit-pick-${day.id}`}
            className="form-select form-select-sm"
            value={choice}
            onChange={(event) => setChoice(event.target.value)}
          >
            <option value="">{t("trips:outfits.pickOutfit")}</option>
            {candidates.map((outfit) => (
              <option key={outfit.id} value={outfit.id}>
                {outfit.title ?? t("trips:outfits.untitled")}
              </option>
            ))}
          </select>
          <Button type="submit" size="sm" variant="outline-primary" disabled={!choice}>
            {t("trips:outfits.add")}
          </Button>
          <Button type="button" size="sm" variant="link" onClick={() => onCreate(day.id)}>
            {t("trips:outfits.createForDay")}
          </Button>
        </form>
      ) : (
        <button type="button" className="focus-day-card__more" onClick={() => setPicking(true)}>
          <Icon name="plus" size={13} />
          {selected ? t("trips:outfits.changeOutfit") : t("trips:outfits.pickOutfit")}
        </button>
      )}
    </section>
  );
}
