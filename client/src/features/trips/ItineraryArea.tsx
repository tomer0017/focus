import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import Button from "react-bootstrap/Button";
import { Icon } from "../../components/ui/Icon";
import { BoardImage } from "../../components/ui/BoardImage";
import { SavedItemCard } from "../../components/ui/SavedItemCard";
import { ShowMore } from "../../components/ui/ShowMore";
import { useLocale } from "../../i18n/useLocale";
import { formatDayKey } from "../../lib/format";
import { daysForDestination, nightsAt } from "../../lib/trips";
import { TripFoodList } from "./TripFoodList";
import { DayRail } from "./DayRail";
import { DayPanel } from "./DayPanel";
import type { SavedItem, Trip, TripDayPlan, TripDestination, TripFood } from "../../types";

interface ItineraryAreaProps {
  trip: Trip;
  savedItems: SavedItem[];
  /**
   * The leg on screen. Owned by the trip page, because the route strip above
   * the tabs is what selects it — a second switcher in here would be two
   * controls disagreeing about one fact.
   */
  legId: string;
  onEditDestination: (destinationId: string) => void;
  onChangeDestination: (destinationId: string, patch: Partial<TripDestination>) => void;
  onAddDestination: () => void;
  onRemoveDestination: (destinationId: string) => void;
  onMoveDestination: (destinationId: string, direction: -1 | 1) => void;
  onAddDay: (destinationId: string) => void;
  onRemoveDay: (dayId: string) => void;
  onMoveDay: (dayId: string, direction: -1 | 1) => void;
  onChangeDay: (dayId: string, patch: Partial<TripDayPlan>) => void;
  onFoodUpdate: (foodId: string, patch: Partial<TripFood>) => void;
  onFoodAdd: (food: Omit<TripFood, "id">) => void;
  onFoodRemove: (foodId: string) => void;
  onAssignOutfit: (outfitId: string, dayId: string) => void;
  onUnassignOutfit: (outfitId: string, dayId: string) => void;
  onSelectOutfit: (outfitId: string, dayId: string) => void;
  onCreateOutfit: (dayId: string) => void;
}

/**
 * Where you are, on which day, and what that day holds.
 *
 * Three levels, narrowing: the leg, then the day, then the topic. Each level
 * shows one thing at a time, and the level above stays visible so you always
 * know where you are. The screen this replaces rendered every day of a leg as
 * a card in a masonry grid — eleven days meant eleven cards and seventy-seven
 * textareas, and no way to answer "what are we doing on Thursday" without
 * scrolling past Wednesday.
 *
 * With one destination there is no destination switcher: a control with one
 * option is furniture.
 */
export function ItineraryArea({
  trip,
  savedItems,
  legId,
  onEditDestination,
  onChangeDestination,
  onAddDestination,
  onRemoveDestination,
  onMoveDestination,
  onAddDay,
  onRemoveDay,
  onMoveDay,
  onChangeDay,
  onFoodUpdate,
  onFoodAdd,
  onFoodRemove,
  onAssignOutfit,
  onUnassignOutfit,
  onSelectOutfit,
  onCreateOutfit,
}: ItineraryAreaProps) {
  const { t } = useTranslation(["trips", "common"]);
  const { locale } = useLocale();

  const [dayId, setDayId] = useState<string>("");
  const [editingLeg, setEditingLeg] = useState(false);
  const [editingFacts, setEditingFacts] = useState(false);

  const destination: TripDestination | undefined =
    trip.destinations.find((entry) => entry.id === legId) ?? trip.destinations[0];

  const days = useMemo(
    () => (destination ? daysForDestination(trip, destination.id) : []),
    [trip, destination]
  );

  /*
   * Exactly one day is selected, always. Adding, deleting or reordering days
   * can invalidate the choice, so it is repaired here rather than each caller
   * remembering to — an itinerary with no day selected renders nothing at all.
   */
  useEffect(() => {
    if (days.length === 0) {
      if (dayId) setDayId("");
      return;
    }
    if (!days.some((day) => day.id === dayId)) setDayId(days[0].id);
  }, [days, dayId]);

  const day = days.find((entry) => entry.id === dayId) ?? days[0];
  const orderedTripDays = useMemo(
    () => [...trip.days].sort((a, b) => a.date.localeCompare(b.date)),
    [trip.days]
  );
  const numberOf = (entry: TripDayPlan): number =>
    orderedTripDays.findIndex((candidate) => candidate.id === entry.id) + 1;

  const nights = destination ? nightsAt(destination) : null;
  const legSaved = destination
    ? savedItems.filter((item) => destination.savedItemIds.includes(item.id))
    : [];
  const legFood = destination
    ? trip.food.filter((entry) => entry.destinationId === destination.id)
    : [];

  if (!destination) {
    return (
      <div className="focus-trip-empty">
        <p className="mb-2">{t("trips:itinerary.noDestinations")}</p>
        <Button variant="primary" size="sm" onClick={onAddDestination}>
          <Icon name="plus" size={14} />
          {t("trips:edit.addDestination")}
        </Button>
      </div>
    );
  }

  const index = trip.destinations.findIndex((entry) => entry.id === destination.id);

  return (
    <div className="focus-itinerary">
      <section className="focus-leg">
        <header className="focus-leg__head">
          <BoardImage
            className="focus-leg__image"
            imageUrl={destination.imageUrl}
            thumb={destination.thumb}
          />
          <div className="focus-leg__facts">
            <h2 className="focus-leg__name mb-0" dir="auto">
              {destination.name}
            </h2>
            <p className="focus-leg__dates mb-0">
              {destination.arriveOn && destination.leaveOn && (
                <span>
                  {formatDayKey(destination.arriveOn, locale)} –{" "}
                  {formatDayKey(destination.leaveOn, locale)}
                </span>
              )}
              {nights !== null && <span>{t("trips:nights", { count: nights })}</span>}
              {destination.country && <span dir="auto">{destination.country}</span>}
            </p>
          </div>

          <div className="focus-leg__actions">
            {editingLeg && (
              <>
                <Button variant="outline-primary" size="sm" onClick={() => onEditDestination(destination.id)}>
                  <Icon name="edit" size={13} />
                  {t("trips:edit.editDestination")}
                </Button>
                <button
                  type="button"
                  className="focus-icon-button border"
                  disabled={index === 0}
                  onClick={() => onMoveDestination(destination.id, -1)}
                  aria-label={t("trips:edit.moveDestinationEarlier")}
                >
                  <Icon name="arrowBack" size={13} flipForRtl />
                </button>
                <button
                  type="button"
                  className="focus-icon-button border"
                  disabled={index === trip.destinations.length - 1}
                  onClick={() => onMoveDestination(destination.id, 1)}
                  aria-label={t("trips:edit.moveDestinationLater")}
                >
                  <Icon name="arrowForward" size={13} flipForRtl />
                </button>
                <button
                  type="button"
                  className="focus-icon-button border"
                  onClick={() => onRemoveDestination(destination.id)}
                  aria-label={t("trips:edit.removeDestination")}
                >
                  <Icon name="trash" size={13} />
                </button>
                <Button variant="outline-primary" size="sm" onClick={onAddDestination}>
                  <Icon name="plus" size={13} />
                  {t("trips:edit.addDestination")}
                </Button>
              </>
            )}
            <Button
              variant={editingLeg ? "primary" : "outline-secondary"}
              size="sm"
              onClick={() => setEditingLeg((current) => !current)}
            >
              <Icon name={editingLeg ? "check" : "edit"} size={13} />
              {editingLeg ? t("common:actions.doneEditing") : t("common:actions.edit")}
            </Button>
          </div>
        </header>

        {/* The block that saves the trip: what nobody writes down and everybody
            needs. Loudest thing about a leg, and never hidden behind a tab. */}
        {(destination.goodToKnow.length > 0 || editingFacts) && (
          <div className="focus-goodtoknow">
            <h3 className="focus-goodtoknow__title">
              <Icon name="flag" size={15} />
              {t("trips:goodToKnow")}
            </h3>
            {editingFacts ? (
              <>
                <label className="visually-hidden" htmlFor={`gtk-${destination.id}`}>
                  {t("trips:goodToKnowEdit")}
                </label>
                <textarea
                  id={`gtk-${destination.id}`}
                  className="form-control form-control-sm"
                  rows={Math.max(3, destination.goodToKnow.length + 1)}
                  dir="auto"
                  placeholder={t("trips:goodToKnowEdit")}
                  value={destination.goodToKnow.join("\n")}
                  onChange={(event) =>
                    onChangeDestination(destination.id, {
                      goodToKnow: event.target.value.split("\n").filter((line) => line.trim()),
                    })
                  }
                />
              </>
            ) : (
              <ul className="focus-goodtoknow__list" dir="auto">
                {destination.goodToKnow.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="focus-leg__strip">
          <button
            type="button"
            className="focus-chip-button"
            aria-expanded={editingFacts}
            onClick={() => setEditingFacts((current) => !current)}
          >
            <Icon name={editingFacts ? "check" : "edit"} size={13} />
            {editingFacts ? t("common:actions.doneEditing") : t("trips:goodToKnowEdit")}
          </button>
          {legFood.length > 0 && (
            <span className="focus-leg__stat">
              <Icon name="food" size={13} />
              {t("trips:food.count", { count: legFood.length })}
            </span>
          )}
          {destination.clothing && (
            <span className="focus-leg__stat focus-clamp-1" dir="auto">
              <Icon name="tag" size={13} />
              {destination.clothing}
            </span>
          )}
        </div>

        {legSaved.length > 0 && (
          <ShowMore items={legSaved} limit={3}>
            {(visible) => (
              <ul className="list-unstyled focus-grid focus-grid--saved mb-0">
                {visible.map((item) => (
                  <li key={item.id}>
                    <SavedItemCard item={item} />
                  </li>
                ))}
              </ul>
            )}
          </ShowMore>
        )}
      </section>

      <div className="focus-itinerary__days">
        {days.length === 0 ? (
          <>
            <div className="focus-trip-empty">
              <p className="mb-2">{t("trips:edit.noDays")}</p>
              <Button variant="primary" size="sm" onClick={() => onAddDay(destination.id)}>
                <Icon name="plus" size={14} />
                {t("trips:edit.addDay")}
              </Button>
            </div>

            {/* Without days there is no day panel, and the leg's food would be
                unreachable. A camping trip that never plans a Tuesday still has
                a list of things to cook. */}
            <section className="focus-leg-food">
              <h3 className="focus-trip-block__title">{t("trips:food.title")}</h3>
              <TripFoodList
                destinationId={destination.id}
                food={legFood}
                onUpdate={onFoodUpdate}
                onAdd={onFoodAdd}
                onRemove={onFoodRemove}
              />
            </section>
          </>
        ) : (
          <>
            <div className="focus-itinerary__rail-row">
              <DayRail
                days={days}
                value={day?.id ?? ""}
                onChange={setDayId}
                numberOf={numberOf}
                idPrefix="trip-day"
              />
              <Button
                variant="outline-primary"
                size="sm"
                className="focus-itinerary__add-day"
                onClick={() => onAddDay(destination.id)}
              >
                <Icon name="plus" size={13} />
                {t("trips:edit.addDay")}
              </Button>
            </div>

            {day && (
              <DayPanel
                key={day.id}
                trip={trip}
                day={day}
                number={numberOf(day)}
                destination={destination}
                destinations={trip.destinations}
                savedItems={savedItems}
                onChange={(patch) => onChangeDay(day.id, patch)}
                onRemove={() => onRemoveDay(day.id)}
                onMove={(direction) => onMoveDay(day.id, direction)}
                isFirst={days[0]?.id === day.id}
                isLast={days[days.length - 1]?.id === day.id}
                food={legFood}
                onFoodUpdate={onFoodUpdate}
                onFoodAdd={onFoodAdd}
                onFoodRemove={onFoodRemove}
                onAssignOutfit={onAssignOutfit}
                onUnassignOutfit={onUnassignOutfit}
                onSelectOutfit={(outfitId) => onSelectOutfit(outfitId, day.id)}
                onCreateOutfit={onCreateOutfit}
              />
            )}
          </>
        )}
      </div>
    </div>
  );

}
