import { DemoBadgeInline, SavedItemCard } from "focus-client";
import type { SavedItem } from "../../client/src/types";

/**
 * Marks a saved item that has nowhere to send you. Being honest about it is
 * the whole point: the alternative — pointing the card at a placeholder host
 * so it "has a link" — looks like a working link and lands the user on a
 * parking page.
 */

const NO_LINK: SavedItem = {
  id: "saved-sideboard",
  kind: "product",
  title: "שידה נמוכה לסלון",
  note: "ראיתי בחנות ברחוב דיזנגוף, לא מצאתי אותה באתר",
  source: "store",
  spaceId: "home",
  thumb: "sideboard",
  category: "ריהוט",
  contextIds: ["page-living-room"],
  savedAt: "2024-05-12T09:20:00.000Z",
};

export const NoLink = () => <DemoBadgeInline />;

export const OnACardFoot = () => (
  <p className="mb-0 d-flex align-items-center gap-2 small text-secondary">
    <span>לפני 3 ימים</span>
    <span dir="auto">ריהוט</span>
    <DemoBadgeInline />
  </p>
);

export const OnASavedItemCard = () => (
  <ul className="list-unstyled focus-grid focus-grid--saved mb-0">
    <li>
      <SavedItemCard item={NO_LINK} />
    </li>
  </ul>
);
