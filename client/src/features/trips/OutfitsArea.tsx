import { useState } from "react";
import { useTranslation } from "react-i18next";
import { OutfitBoard } from "./OutfitBoard";
import { OutfitTimeline } from "./OutfitTimeline";
import { PackingSuggestions } from "./PackingSuggestions";
import { SegmentedNav, type SegmentedItem } from "../../components/ui/SegmentedNav";
import { packingSuggestions } from "../../lib/outfits";
import type { SavedItem, Trip, TripOutfit } from "../../types";

type View = "looks" | "days" | "packing";

interface OutfitsAreaProps {
  trip: Trip;
  savedItems: SavedItem[];
  onCreate: (dayId?: string) => void;
  onEdit: (outfit: TripOutfit) => void;
  onRemove: (outfit: TripOutfit) => void;
  onMove: (outfit: TripOutfit, direction: -1 | 1) => void;
  onSelect: (outfit: TripOutfit) => void;
}

/**
 * Looks, the days they cover, and what they add up to — three views, not three
 * sections stacked.
 *
 * They answered different questions and were being scrolled past to reach each
 * other. "What have I got for Kyoto evenings" is the board; "which day still
 * has nothing" is the day view, whose whole point is the gaps; "what do I
 * therefore need to pack" is the third. Only one is ever the question.
 */
export function OutfitsArea({
  trip,
  savedItems,
  onCreate,
  onEdit,
  onRemove,
  onMove,
  onSelect,
}: OutfitsAreaProps) {
  const { t } = useTranslation(["trips"]);
  const [view, setView] = useState<View>("looks");

  const suggestions = packingSuggestions(trip);
  const unplanned = trip.days.filter(
    (day) => !trip.outfits.some((outfit) => outfit.status === "selected" && outfit.dayIds.includes(day.id))
  ).length;

  const views: SegmentedItem[] = [
    { id: "looks", label: t("trips:outfits.looks"), badge: String(trip.outfits.length || "") },
    {
      id: "days",
      label: t("trips:outfits.timeline"),
      // The count is the number of days still without a look — the one fact
      // this view exists to surface, so it belongs on the way in.
      badge: unplanned > 0 ? String(unplanned) : undefined,
    },
    {
      id: "packing",
      label: t("trips:outfits.suggestions"),
      badge: String(suggestions.length || ""),
    },
  ];

  return (
    <div className="focus-outfits">
      <SegmentedNav
        label={t("trips:outfits.choose")}
        items={views}
        value={view}
        onChange={(id) => setView(id as View)}
        variant="pills"
        collapse
      />

      {view === "looks" && (
        <OutfitBoard
          trip={trip}
          savedItems={savedItems}
          onCreate={() => onCreate()}
          onEdit={onEdit}
          onRemove={onRemove}
          onMove={onMove}
          onSelect={onSelect}
        />
      )}

      {view === "days" && (
        <OutfitTimeline trip={trip} savedItems={savedItems} onPick={(dayId) => onCreate(dayId)} />
      )}

      {view === "packing" && <PackingSuggestions trip={trip} />}
    </div>
  );
}
