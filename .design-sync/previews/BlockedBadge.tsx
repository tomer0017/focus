import { BlockedBadge, StatusBadge, SpaceBadge, CompactRow, CompactList } from "focus-client";

/**
 * Blocked is not a status — it is a separate fact that sits beside one. A
 * project can be active *and* stuck, so this badge never replaces a
 * `StatusBadge`; it appears next to it, with an icon so the meaning is not
 * carried by colour alone.
 */

export const Blocked = () => <BlockedBadge />;

export const BesideAStatus = () => (
  <div className="d-flex flex-wrap gap-2 align-items-center">
    <StatusBadge status="active" />
    <BlockedBadge />
  </div>
);

export const OnABoardCard = () => (
  <div className="focus-card p-3">
    <p className="mb-2 fw-semibold" dir="auto">
      Sorcol
    </p>
    <div className="d-flex flex-wrap gap-2 align-items-center mb-2">
      <SpaceBadge spaceId="work-tech" />
      <BlockedBadge />
    </div>
    <p className="mb-0 small text-secondary" dir="auto">
      Waiting on the size chart data from the supplier — nothing else can move
      until it arrives.
    </p>
  </div>
);

export const InAnAttentionRow = () => (
  <CompactList>
    <li>
      <CompactRow
        title="החלפת הספה בסלון"
        eyebrow="פרויקט"
        detail="המידות של הפינה לא מסתדרות — צריך למדוד שוב לפני שמזמינים"
        badges={
          <>
            <StatusBadge status="active" />
            <BlockedBadge />
          </>
        }
        meta={<span>עודכן לפני 9 ימים</span>}
        tone="due"
      />
    </li>
  </CompactList>
);
