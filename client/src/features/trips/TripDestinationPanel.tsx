import { useState } from "react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { usePages } from "../../state/pagesContext";
import { useTrips } from "../../state/tripsContext";
import { useLocale } from "../../i18n/useLocale";
import { formatDayKey } from "../../lib/format";
import { daysForDestination, nightsAt } from "../../lib/trips";
import Button from "react-bootstrap/Button";
import { Icon } from "../../components/ui/Icon";
import { BoardImage } from "../../components/ui/BoardImage";
import { SavedItemCard } from "../../components/ui/SavedItemCard";
import { Section } from "../sections/Section";
import { TripFoodList } from "./TripFoodList";
import { TripDayCard } from "./TripDayCard";
import type { Trip, TripDestination } from "../../types";

interface TripDestinationPanelProps {
  trip: Trip;
  destination: TripDestination;
  onEdit?: () => void;
  onRemove?: () => void;
  onMove?: (direction: -1 | 1) => void;
  onAddDay?: () => void;
  onRemoveDay?: (dayId: string) => void;
  onMoveDay?: (dayId: string, direction: -1 | 1) => void;
  /** Builds the "what to wear" block for one day. */
  renderOutfits?: (dayId: string) => ReactNode;
  isFirst?: boolean;
  isLast?: boolean;
}

/**
 * Everything about one city.
 *
 * "Good to know" is deliberately the loudest block: closing days, market hours
 * and transport quirks are the facts that ruin an afternoon when you forget
 * them, and they are exactly what nobody writes down.
 */
export function TripDestinationPanel({
  trip,
  destination,
  onEdit,
  onRemove,
  onMove,
  onAddDay,
  onRemoveDay,
  onMoveDay,
  renderOutfits,
  isFirst,
  isLast,
}: TripDestinationPanelProps) {
  const { t } = useTranslation(["trips", "common"]);
  const { locale } = useLocale();
  const [editingNotes, setEditingNotes] = useState(false);
  const { savedItems } = usePages();
  const { updateDestination, updateDay, updateFood, addFood, removeFood } = useTrips();

  const days = daysForDestination(trip, destination.id);
  const nights = nightsAt(destination);
  const saved = savedItems.filter((item) => destination.savedItemIds.includes(item.id));
  const food = trip.food.filter((entry) => entry.destinationId === destination.id);

  return (
    <div className="focus-destination">
      <header className="focus-destination__head">
        <BoardImage
          className="focus-destination__image"
          imageUrl={destination.imageUrl}
          thumb={destination.thumb}
        />
        <div className="focus-destination__facts">
          <div className="focus-destination__title-row">
            <h2 className="focus-destination__name mb-0" dir="auto">
              {destination.name}
            </h2>
            {/* Editing a city belongs beside its name, not repeated on every
                row inside it. */}
            {onEdit && (
              <span className="focus-destination__actions">
                <Button variant="outline-primary" size="sm" onClick={onEdit}>
                  <Icon name="edit" size={14} />
                  {t("trips:edit.editDestination")}
                </Button>
                {onMove && (
                  <>
                    <button
                      type="button"
                      className="focus-icon-button border"
                      disabled={isFirst}
                      onClick={() => onMove(-1)}
                      aria-label={t("trips:edit.moveDestinationEarlier")}
                    >
                      <Icon name="arrowBack" size={13} flipForRtl />
                    </button>
                    <button
                      type="button"
                      className="focus-icon-button border"
                      disabled={isLast}
                      onClick={() => onMove(1)}
                      aria-label={t("trips:edit.moveDestinationLater")}
                    >
                      <Icon name="arrowForward" size={13} flipForRtl />
                    </button>
                  </>
                )}
                {onRemove && (
                  <button
                    type="button"
                    className="focus-icon-button border"
                    onClick={onRemove}
                    aria-label={t("trips:edit.removeDestination")}
                  >
                    <Icon name="trash" size={13} />
                  </button>
                )}
              </span>
            )}
          </div>
          <p className="focus-destination__dates mb-0">
            {destination.arriveOn && destination.leaveOn && (
              <>
                {formatDayKey(destination.arriveOn, locale)} –{" "}
                {formatDayKey(destination.leaveOn, locale)}
              </>
            )}
            {nights !== null && (
              <span className="focus-destination__nights">
                {t("trips:nights", { count: nights })}
              </span>
            )}
          </p>
        </div>
      </header>

      {/* The block that saves the trip. */}
      <section className="focus-goodtoknow">
        <h3 className="focus-goodtoknow__title">
          <Icon name="flag" size={15} />
          {t("trips:goodToKnow")}
        </h3>
        {/* The list and its editor are never on screen together: the same three
            lines rendered twice is exactly the duplication this app avoids. */}
        {editingNotes ? (
          <>
            <label className="visually-hidden" htmlFor={`gtk-${destination.id}`}>
              {t("trips:goodToKnowEdit")}
            </label>
            <textarea
              id={`gtk-${destination.id}`}
              className="form-control form-control-sm"
              rows={Math.max(3, destination.goodToKnow.length + 1)}
              dir="auto"
              autoFocus
              placeholder={t("trips:goodToKnowEdit")}
              value={destination.goodToKnow.join("\n")}
              onChange={(event) =>
                updateDestination(trip.id, destination.id, {
                  goodToKnow: event.target.value.split("\n").filter((line) => line.trim()),
                })
              }
            />
          </>
        ) : destination.goodToKnow.length > 0 ? (
          <ul className="focus-goodtoknow__list" dir="auto">
            {destination.goodToKnow.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        ) : (
          <p className="mb-2 text-secondary small">{t("trips:goodToKnowEmpty")}</p>
        )}

        <button
          type="button"
          className="focus-goodtoknow__edit"
          aria-expanded={editingNotes}
          onClick={() => setEditingNotes((current) => !current)}
        >
          <Icon name={editingNotes ? "check" : "edit"} size={13} />
          {editingNotes ? t("common:actions.save") : t("trips:goodToKnowEdit")}
        </button>
      </section>

      <Section title={t("trips:clothing")} hasContent span="auto">
        <label className="visually-hidden" htmlFor={`clothing-${destination.id}`}>
          {t("trips:clothing")}
        </label>
        <textarea
          id={`clothing-${destination.id}`}
          className="form-control form-control-sm"
          rows={2}
          dir="auto"
          value={destination.clothing ?? ""}
          onChange={(event) =>
            updateDestination(trip.id, destination.id, { clothing: event.target.value })
          }
        />
      </Section>

      <Section title={t("trips:food.title")} hasContent span="full">
        <TripFoodList
          destinationId={destination.id}
          food={food}
          onUpdate={(foodId, patch) => updateFood(trip.id, foodId, patch)}
          onAdd={(entry) => addFood(trip.id, entry)}
          onRemove={(foodId) => removeFood(trip.id, foodId)}
        />
      </Section>

      <Section title={t("trips:inspiration")} hasContent={saved.length > 0} span="full">
        <ul className="list-unstyled focus-grid focus-grid--saved mb-0">
          {saved.map((item) => (
            <li key={item.id}>
              <SavedItemCard item={item} />
            </li>
          ))}
        </ul>
      </Section>

      <Section
        title={t("trips:daysHere")}
        hasContent
        span="full"
        action={
          onAddDay ? (
            <Button variant="outline-primary" size="sm" onClick={onAddDay}>
              <Icon name="plus" size={14} />
              {t("trips:edit.addDay")}
            </Button>
          ) : undefined
        }
      >
        {days.length === 0 ? (
          <p className="focus-tab-empty mb-0">{t("trips:edit.noDays")}</p>
        ) : (
          <div className="focus-day-list">
            {days.map((day) => (
              <TripDayCard
                key={day.id}
                day={day}
                destination={destination}
                destinations={trip.destinations}
                index={trip.days.findIndex((entry) => entry.id === day.id)}
                onChange={(patch) => updateDay(trip.id, day.id, patch)}
                onRemove={onRemoveDay ? () => onRemoveDay(day.id) : undefined}
                onMove={onMoveDay ? (direction) => onMoveDay(day.id, direction) : undefined}
                outfitSection={renderOutfits?.(day.id)}
              />
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}
