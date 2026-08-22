import { useTranslation } from "react-i18next";
import Button from "react-bootstrap/Button";
import { Icon } from "../../components/ui/Icon";
import { useChecklists } from "../../state/checklistsContext";
import { useLocale } from "../../i18n/useLocale";
import { formatDayKey } from "../../lib/format";
import { addSuggestionsToChecklist, checklistNames, packingSuggestions } from "../../lib/outfits";
import type { Trip } from "../../types";

/**
 * What the chosen looks add up to, and a way to put it on the packing list.
 *
 * Nothing is added without being asked. Once an item is on the checklist it is
 * an ordinary item: changing or deleting a look later never reaches back and
 * removes it, because by then it is the user's line, not a derived one.
 */
export function PackingSuggestions({ trip }: { trip: Trip }) {
  const { t } = useTranslation(["trips", "checklist", "common"]);
  const { locale } = useLocale();
  const { getChecklist, update } = useChecklists();

  const ownerId = `trip:${trip.id}`;
  const checklist = getChecklist(ownerId);
  const suggestions = packingSuggestions(trip);
  const already = checklistNames(checklist);
  const missing = suggestions.filter((suggestion) => !already.has(suggestion.key));

  const dayLabel = (dayId: string): string => {
    const day = trip.days.find((entry) => entry.id === dayId);
    return day ? formatDayKey(day.date, locale) : "";
  };

  if (suggestions.length === 0) {
    return <p className="focus-tab-empty mb-0">{t("trips:outfits.noSuggestions")}</p>;
  }

  return (
    <div className="focus-packing">
      <div className="focus-packing__head">
        <p className="mb-0 text-secondary small">{t("trips:outfits.suggestionsHint")}</p>
        <Button
          variant="primary"
          size="sm"
          disabled={missing.length === 0 || !checklist}
          onClick={() => update(ownerId, (current) => addSuggestionsToChecklist(current, missing))}
        >
          <Icon name="plus" size={14} />
          {t("trips:outfits.addToPacking", { count: missing.length })}
        </Button>
      </div>

      {!checklist && <p className="form-text">{t("trips:outfits.needChecklist")}</p>}

      <ul className="list-unstyled focus-packing__list mb-0">
        {suggestions.map((suggestion) => {
          const onList = already.has(suggestion.key);
          return (
            <li key={suggestion.key} className={onList ? "is-packed" : ""}>
              <span className="focus-packing__name" dir="auto">
                {suggestion.name}
                {suggestion.quantity > 1 && (
                  <span className="focus-packing__qty">×{suggestion.quantity}</span>
                )}
              </span>
              <span className="focus-packing__days">
                {suggestion.dayIds.map(dayLabel).filter(Boolean).join(" · ") ||
                  t("trips:outfits.noDaysYet")}
              </span>
              {onList && (
                <span className="focus-packing__on-list">
                  <Icon name="check" size={12} />
                  {t("trips:outfits.onPackingList")}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
