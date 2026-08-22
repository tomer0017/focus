import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import Button from "react-bootstrap/Button";
import { Icon } from "../../components/ui/Icon";
import { ExternalLink } from "../../components/ui/ExternalLink";
import { Section } from "../sections/Section";
import { OutfitImage } from "./OutfitImage";
import { useLocale } from "../../i18n/useLocale";
import { formatDayKey } from "../../lib/format";
import { sortedOutfits } from "../../lib/outfits";
import { isExternalUrl } from "../../lib/links";
import type { OutfitOccasion, SavedItem, Trip, TripOutfit } from "../../types";

interface OutfitBoardProps {
  trip: Trip;
  savedItems: SavedItem[];
  onCreate: () => void;
  onEdit: (outfit: TripOutfit) => void;
  onRemove: (outfit: TripOutfit) => void;
  onMove: (outfit: TripOutfit, direction: -1 | 1) => void;
  onSelect: (outfit: TripOutfit) => void;
}

/**
 * Every look for the trip, split into what you are actually wearing and what
 * is still an idea.
 *
 * The filters are the point of the screen: "what have I got for Kyoto
 * evenings" is the question, and scrolling one long list to answer it is why
 * people plan outfits in a photo album instead.
 */
export function OutfitBoard({
  trip,
  savedItems,
  onCreate,
  onEdit,
  onRemove,
  onMove,
  onSelect,
}: OutfitBoardProps) {
  const { t } = useTranslation(["trips", "common"]);
  const { locale } = useLocale();

  const [destinationId, setDestinationId] = useState("");
  const [dayId, setDayId] = useState("");
  const [occasion, setOccasion] = useState<OutfitOccasion | "">("");
  const [editing, setEditing] = useState(false);

  /*
   * Three filters over five looks is more control than content. They appear
   * once there is enough to sift — until then the whole board fits on screen
   * and filtering it is a way of hiding things from yourself.
   */
  const showFilters = trip.outfits.length >= 6;

  const days = useMemo(
    () => [...trip.days].sort((a, b) => a.date.localeCompare(b.date)),
    [trip.days]
  );

  const filtered = useMemo(
    () =>
      sortedOutfits(trip.outfits).filter(
        (outfit) =>
          (!destinationId || outfit.destinationId === destinationId) &&
          (!dayId || outfit.dayIds.includes(dayId)) &&
          (!occasion || outfit.occasion === occasion)
      ),
    [trip.outfits, destinationId, dayId, occasion]
  );

  const dayLabel = (id: string): string => {
    const day = days.find((entry) => entry.id === id);
    return day ? formatDayKey(day.date, locale) : "";
  };

  const renderGroup = (status: TripOutfit["status"]) => {
    const list = filtered.filter((outfit) => outfit.status === status);

    return (
      <Section
        key={status}
        title={t(`trips:outfits.statuses.${status}`)}
        hasContent={list.length > 0}
        span="full"
      >
        <ul className="list-unstyled focus-outfit-grid mb-0">
          {list.map((outfit, index) => {
            const destination = trip.destinations.find(
              (entry) => entry.id === outfit.destinationId
            );

            return (
              <li key={outfit.id}>
                <article className="focus-outfit-card">
                  <OutfitImage
                    outfit={outfit}
                    savedItems={savedItems}
                    className="focus-outfit-card__image"
                  />

                  <div className="focus-outfit-card__body">
                    <h3 className="focus-outfit-card__title" dir="auto">
                      {outfit.title ?? t("trips:outfits.untitled")}
                    </h3>

                    <p className="focus-outfit-card__meta mb-0">
                      {destination && (
                        <span className="focus-chip focus-chip--info" dir="auto">
                          {destination.name}
                        </span>
                      )}
                      {outfit.occasion && (
                        <span className="focus-chip focus-chip--muted">
                          {t(`trips:outfits.occasions.${outfit.occasion}`)}
                        </span>
                      )}
                      <span className="focus-outfit-card__count">
                        {t("trips:outfits.pieceCount", { count: outfit.clothingItems.length })}
                      </span>
                    </p>

                    {outfit.dayIds.length > 0 && (
                      <p className="focus-outfit-card__days mb-0">
                        <Icon name="calendar" size={12} />
                        {outfit.dayIds.map(dayLabel).filter(Boolean).join(" · ")}
                      </p>
                    )}

                    {outfit.note && (
                      <p className="focus-outfit-card__note focus-clamp-2" dir="auto">
                        {outfit.note}
                      </p>
                    )}

                    {isExternalUrl(outfit.pinterestUrl) && (
                      <p className="mb-0">
                        <ExternalLink href={outfit.pinterestUrl}>
                          {t("trips:outfits.openReference")}
                        </ExternalLink>
                      </p>
                    )}

                    <div className="focus-outfit-card__actions">
                      {/* Choosing a look records a decision, so it stays live in
                          view mode. Renaming, reordering and deleting are edits. */}
                      {outfit.status === "idea" && (
                        <Button variant="outline-primary" size="sm" onClick={() => onSelect(outfit)}>
                          <Icon name="check" size={13} />
                          {t("trips:outfits.markSelected")}
                        </Button>
                      )}
                      {editing && (
                      <>
                      <button
                        type="button"
                        className="focus-icon-button border"
                        onClick={() => onEdit(outfit)}
                        aria-label={t("trips:outfits.editNamed", {
                          name: outfit.title ?? t("trips:outfits.untitled"),
                        })}
                      >
                        <Icon name="edit" size={13} />
                      </button>
                      <button
                        type="button"
                        className="focus-icon-button border"
                        disabled={index === 0}
                        onClick={() => onMove(outfit, -1)}
                        aria-label={t("trips:outfits.moveUp")}
                      >
                        <Icon name="chevronUp" size={13} />
                      </button>
                      <button
                        type="button"
                        className="focus-icon-button border"
                        disabled={index === list.length - 1}
                        onClick={() => onMove(outfit, 1)}
                        aria-label={t("trips:outfits.moveDown")}
                      >
                        <Icon name="chevronDown" size={13} />
                      </button>
                      <button
                        type="button"
                        className="focus-icon-button border"
                        onClick={() => onRemove(outfit)}
                        aria-label={t("trips:outfits.remove")}
                      >
                        <Icon name="trash" size={13} />
                      </button>
                      </>
                      )}
                    </div>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      </Section>
    );
  };

  return (
    <>
      <div className="focus-outfit-filters">
        <Button variant="primary" size="sm" onClick={onCreate}>
          <Icon name="plus" size={14} />
          {t("trips:outfits.create")}
        </Button>

        <Button
          variant={editing ? "primary" : "outline-secondary"}
          size="sm"
          onClick={() => setEditing((current) => !current)}
        >
          <Icon name={editing ? "check" : "edit"} size={13} />
          {editing ? t("common:actions.doneEditing") : t("common:actions.edit")}
        </Button>

        {showFilters && (
        <>
        <label className="visually-hidden" htmlFor="outfit-filter-destination">
          {t("trips:outfits.destination")}
        </label>
        <select
          id="outfit-filter-destination"
          className="form-select form-select-sm"
          value={destinationId}
          onChange={(event) => setDestinationId(event.target.value)}
        >
          <option value="">{t("trips:outfits.allDestinations")}</option>
          {trip.destinations.map((entry) => (
            <option key={entry.id} value={entry.id}>
              {entry.name}
            </option>
          ))}
        </select>

        <label className="visually-hidden" htmlFor="outfit-filter-day">
          {t("trips:outfits.days")}
        </label>
        <select
          id="outfit-filter-day"
          className="form-select form-select-sm"
          value={dayId}
          onChange={(event) => setDayId(event.target.value)}
        >
          <option value="">{t("trips:outfits.allDays")}</option>
          {days.map((day) => (
            <option key={day.id} value={day.id}>
              {formatDayKey(day.date, locale)}
            </option>
          ))}
        </select>

        <label className="visually-hidden" htmlFor="outfit-filter-occasion">
          {t("trips:outfits.occasion")}
        </label>
        <select
          id="outfit-filter-occasion"
          className="form-select form-select-sm"
          value={occasion}
          onChange={(event) => setOccasion(event.target.value as OutfitOccasion | "")}
        >
          <option value="">{t("trips:outfits.allOccasions")}</option>
          {(["flight", "day", "evening", "restaurant", "beach", "walking", "custom"] as const).map(
            (value) => (
              <option key={value} value={value}>
                {t(`trips:outfits.occasions.${value}`)}
              </option>
            )
          )}
        </select>
        </>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="focus-tab-empty mb-0">{t("trips:outfits.empty")}</p>
      ) : (
        <div className="focus-sections">
          {renderGroup("selected")}
          {renderGroup("idea")}
        </div>
      )}
    </>
  );
}
