import { useState } from "react";
import { useTranslation } from "react-i18next";
import Button from "react-bootstrap/Button";
import { Icon } from "../../components/ui/Icon";
import { useLocale } from "../../i18n/useLocale";
import { formatDayKeyLong } from "../../lib/format";
import { dateKeyToIso } from "../../lib/dateKey";
import { SegmentedNav, type SegmentedItem } from "../../components/ui/SegmentedNav";
import { TripFoodList } from "./TripFoodList";
import { OutfitDaySection } from "./OutfitDaySection";
import type { SavedItem, Trip, TripDayPlan, TripDestination, TripFood } from "../../types";

/** The three parts of a day everybody fills in, in the order they happen. */
const PLAN_SLOTS = ["morning", "afternoon", "evening"] as const;

type Topic = "plan" | "food" | "wear" | "bookings" | "notes";

interface DayPanelProps {
  trip: Trip;
  day: TripDayPlan;
  /** Which day of the whole trip this is. */
  number: number;
  destination?: TripDestination;
  destinations: TripDestination[];
  savedItems: SavedItem[];
  onChange: (patch: Partial<TripDayPlan>) => void;
  onRemove?: () => void;
  onMove?: (direction: -1 | 1) => void;
  isFirst?: boolean;
  isLast?: boolean;
  food: TripFood[];
  onFoodUpdate: (foodId: string, patch: Partial<TripFood>) => void;
  onFoodAdd: (food: Omit<TripFood, "id">) => void;
  onFoodRemove: (foodId: string) => void;
  onAssignOutfit: (outfitId: string, dayId: string) => void;
  onUnassignOutfit: (outfitId: string, dayId: string) => void;
  onSelectOutfit: (outfitId: string) => void;
  onCreateOutfit: (dayId: string) => void;
}

/**
 * One day, one topic at a time.
 *
 * The screen this replaces put morning, afternoon, evening, alternatives,
 * bookings, clothing and notes on screen together as seven open textareas — and
 * did it for every day of the leg at once. Nothing about a day needs to be read
 * beside anything else: you are either reading the plan, or deciding what to
 * eat, or checking what is booked.
 *
 * View mode shows what is written; it does not show a form. The one explicit
 * edit action beside the date is what turns the slots into fields and brings
 * out reorder and delete — ticking and reading are not editing.
 */
export function DayPanel({
  trip,
  day,
  number,
  destination,
  destinations,
  savedItems,
  onChange,
  onRemove,
  onMove,
  isFirst,
  isLast,
  food,
  onFoodUpdate,
  onFoodAdd,
  onFoodRemove,
  onAssignOutfit,
  onUnassignOutfit,
  onSelectOutfit,
  onCreateOutfit,
}: DayPanelProps) {
  const { t } = useTranslation(["trips", "common"]);
  const { locale } = useLocale();
  const [topic, setTopic] = useState<Topic>("plan");
  const [editing, setEditing] = useState(false);

  const planned = PLAN_SLOTS.some((slot) => (day[slot] ?? "").trim());
  const dayFood = food.filter((entry) => !entry.day || entry.day === day.date);

  /*
   * A topic with nothing in it still appears — it is where you go to add the
   * first thing, and hiding it would leave no route to it. What it must not do
   * is render an empty panel, so each one carries its own small invitation.
   */
  const topics: SegmentedItem[] = [
    { id: "plan", label: t("trips:day.plan") },
    { id: "food", label: t("trips:food.title"), badge: dayFood.length ? String(dayFood.length) : undefined },
    { id: "wear", label: t("trips:outfits.dayLabel") },
    { id: "bookings", label: t("trips:slots.bookings") },
    { id: "notes", label: t("trips:notes") },
  ];

  type Slot = (typeof PLAN_SLOTS)[number] | "alternatives" | "bookings" | "clothing" | "notes";

  const renderSlot = (slot: Slot) => {
    const value = day[slot] ?? "";
    if (!editing) {
      if (!value.trim()) return null;
      return (
        <div key={slot} className="focus-day-slot">
          <p className="focus-day-slot__label mb-0">{t(`trips:slots.${slot}`)}</p>
          <p className="focus-day-slot__value mb-0" dir="auto">
            {value}
          </p>
        </div>
      );
    }
    return (
      <div key={slot} className="focus-day-slot focus-day-slot--editing">
        <label className="focus-day-slot__label" htmlFor={`day-${day.id}-${slot}`}>
          {t(`trips:slots.${slot}`)}
        </label>
        <textarea
          id={`day-${day.id}-${slot}`}
          className="form-control form-control-sm"
          rows={2}
          dir="auto"
          value={value}
          onChange={(event) => onChange({ [slot]: event.target.value })}
        />
      </div>
    );
  };

  const emptyNote = (text: string) => <p className="focus-day-empty mb-0">{text}</p>;

  return (
    <section
      className="focus-day-panel"
      id="trip-day-panel"
      role="tabpanel"
      aria-label={formatDayKeyLong(day.date, locale)}
    >
      <header className="focus-day-panel__head">
        <div className="focus-day-panel__identity">
          <p className="focus-day-panel__number mb-0">{t("trips:dayNumber", { count: number })}</p>
          <h3 className="focus-day-panel__date mb-0">
            <time dateTime={dateKeyToIso(day.date)}>{formatDayKeyLong(day.date, locale)}</time>
          </h3>
        </div>

        <div className="focus-day-panel__controls">
          {editing && destinations.length > 1 && (
            <>
              <label className="visually-hidden" htmlFor={`day-${day.id}-destination`}>
                {t("trips:edit.moveDayTo")}
              </label>
              <select
                id={`day-${day.id}-destination`}
                className="form-select form-select-sm focus-day-panel__destination"
                value={day.destinationId}
                onChange={(event) => onChange({ destinationId: event.target.value })}
              >
                {destinations.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.name}
                  </option>
                ))}
              </select>
            </>
          )}

          {editing && onMove && (
            <>
              <button
                type="button"
                className="focus-icon-button border"
                disabled={isFirst}
                onClick={() => onMove(-1)}
                aria-label={t("trips:edit.moveDayEarlier")}
              >
                <Icon name="chevronUp" size={13} />
              </button>
              <button
                type="button"
                className="focus-icon-button border"
                disabled={isLast}
                onClick={() => onMove(1)}
                aria-label={t("trips:edit.moveDayLater")}
              >
                <Icon name="chevronDown" size={13} />
              </button>
            </>
          )}

          {editing && onRemove && (
            <button
              type="button"
              className="focus-icon-button border"
              onClick={onRemove}
              aria-label={t("trips:edit.removeDay")}
            >
              <Icon name="trash" size={13} />
            </button>
          )}

          <Button
            variant={editing ? "primary" : "outline-secondary"}
            size="sm"
            onClick={() => setEditing((current) => !current)}
          >
            <Icon name={editing ? "check" : "edit"} size={13} />
            {editing ? t("common:actions.doneEditing") : t("trips:day.edit")}
          </Button>
        </div>
      </header>

      <SegmentedNav
        label={t("trips:day.topics")}
        items={topics}
        value={topic}
        onChange={(id) => setTopic(id as Topic)}
        variant="pills"
        collapse
      />

      <div className="focus-day-panel__body">
        {topic === "plan" && (
          <>
            {!planned && !editing && emptyNote(t("trips:day.nothingPlanned"))}
            <div className="focus-day-timeline">
              {PLAN_SLOTS.map(renderSlot)}
              {renderSlot("alternatives")}
            </div>
            {destination && (
              <p className="focus-day-panel__where mb-0">
                <Icon name="trips" size={13} />
                <span dir="auto">{destination.name}</span>
              </p>
            )}
          </>
        )}

        {topic === "food" && (
          <TripFoodList
            destinationId={day.destinationId}
            food={dayFood}
            onUpdate={onFoodUpdate}
            onAdd={(entry) => onFoodAdd({ ...entry, day: day.date })}
            onRemove={onFoodRemove}
          />
        )}

        {topic === "wear" && (
          <OutfitDaySection
            trip={trip}
            day={day}
            savedItems={savedItems}
            onAssign={onAssignOutfit}
            onUnassign={onUnassignOutfit}
            onSelect={onSelectOutfit}
            onCreate={onCreateOutfit}
          />
        )}

        {/* The day's own note about clothes, beside the look chosen for it. */}
        {topic === "wear" && renderSlot("clothing")}

        {topic === "bookings" && (
          <>
            {!day.bookings?.trim() && !editing && emptyNote(t("trips:day.noBookings"))}
            {renderSlot("bookings")}
          </>
        )}

        {topic === "notes" && (
          <>
            {!day.notes?.trim() && !editing && emptyNote(t("trips:day.noNotes"))}
            {renderSlot("notes")}
          </>
        )}
      </div>
    </section>
  );
}
