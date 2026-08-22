import { useTranslation } from "react-i18next";
import { Icon } from "../../components/ui/Icon";
import { OutfitImage } from "./OutfitImage";
import { useLocale } from "../../i18n/useLocale";
import { formatDayKey } from "../../lib/format";
import { outfitsForDay, selectedOutfitForDay } from "../../lib/outfits";
import type { SavedItem, Trip } from "../../types";

interface OutfitTimelineProps {
  trip: Trip;
  savedItems: SavedItem[];
  onPick: (dayId: string) => void;
}

/**
 * Day, place, plan, look — one row each.
 *
 * The point is the gaps: a day with no look is the thing you want to spot, and
 * a look used on four days is the other. Both are invisible in a grid of
 * outfit cards, which is why this exists alongside the board rather than
 * instead of it.
 *
 * A table on a phone is unreadable, so below `md` the same rows render as
 * cards.
 */
export function OutfitTimeline({ trip, savedItems, onPick }: OutfitTimelineProps) {
  const { t } = useTranslation(["trips"]);
  const { locale } = useLocale();

  const days = [...trip.days].sort((a, b) => a.date.localeCompare(b.date));

  if (days.length === 0) {
    return <p className="focus-tab-empty mb-0">{t("trips:edit.noDays")}</p>;
  }

  const rows = days.map((day) => {
    const destination = trip.destinations.find((entry) => entry.id === day.destinationId);
    const selected = selectedOutfitForDay(trip.outfits, day.id);
    const options = outfitsForDay(trip.outfits, day.id);
    const plan = day.morning ?? day.afternoon ?? day.evening ?? "";
    return { day, destination, selected, options, plan };
  });

  return (
    <div className="focus-timeline-table">
      <table className="focus-outfit-table">
        <caption className="visually-hidden">{t("trips:outfits.timeline")}</caption>
        <thead>
          <tr>
            <th scope="col">{t("trips:outfits.tableDay")}</th>
            <th scope="col">{t("trips:outfits.tableDestination")}</th>
            <th scope="col">{t("trips:outfits.tablePlan")}</th>
            <th scope="col">{t("trips:outfits.tableOutfit")}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ day, destination, selected, options, plan }) => (
            <tr key={day.id} className={selected ? "" : "is-missing"}>
              <td data-label={t("trips:outfits.tableDay")}>{formatDayKey(day.date, locale)}</td>
              <td data-label={t("trips:outfits.tableDestination")} dir="auto">
                {destination?.name ?? "—"}
              </td>
              <td data-label={t("trips:outfits.tablePlan")} dir="auto" className="focus-clamp-2">
                {plan || "—"}
              </td>
              <td data-label={t("trips:outfits.tableOutfit")}>
                {selected ? (
                  <span className="focus-outfit-cell">
                    <OutfitImage
                      outfit={selected}
                      savedItems={savedItems}
                      className="focus-outfit-cell__image"
                    />
                    <span dir="auto">{selected.title ?? t("trips:outfits.untitled")}</span>
                  </span>
                ) : (
                  <button type="button" className="focus-outfit-cell__pick" onClick={() => onPick(day.id)}>
                    <Icon name="plus" size={13} />
                    {options.length > 0
                      ? t("trips:outfits.chooseFrom", { count: options.length })
                      : t("trips:outfits.pickOutfit")}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
