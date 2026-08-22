import { useState } from "react";
import { SegmentedNav } from "focus-client";

/**
 * One item chosen out of a few — the app's primary tab strip.
 *
 * It started in the trips domain and now drives project categories, manage
 * areas, event groups, learning groups, space topics, family profile topics and
 * a trip's areas. One control, eight uses.
 *
 * Two variants, and they mean different things. `tabs` underlines the active
 * item and drives a panel below it; `pills` filters content that is already on
 * screen. `collapse` swaps the strip for a `<select>` below `sm`, and exactly
 * one of the two is in the accessibility tree at a time — so at the capture
 * width the strip is what renders.
 *
 * It is controlled, so each cell holds its own state; that is also the only way
 * a sheet can show a *chosen* item rather than a default one.
 */

export const Tabs = () => {
  const [value, setValue] = useState("itinerary");
  return (
    <SegmentedNav
      label="חלקי הטיול"
      value={value}
      onChange={setValue}
      variant="tabs"
      items={[
        { id: "overview", label: "סקירה" },
        { id: "itinerary", label: "מסלול" },
        { id: "bookings", label: "הזמנות" },
        { id: "outfits", label: "לוקים" },
        { id: "checklist", label: "צ׳קליסט", badge: "11/42" },
        { id: "saved", label: "השראה", badge: "4" },
      ]}
    />
  );
};

/** Filters over content already on screen, with counts. */
export const Pills = () => {
  const [value, setValue] = useState("looks");
  return (
    <SegmentedNav
      label="מה להציג"
      value={value}
      onChange={setValue}
      variant="pills"
      items={[
        { id: "looks", label: "לוקים", badge: "4" },
        { id: "days", label: "יום אחר יום", badge: "7" },
        { id: "packing", label: "מה הלוקים דורשים", badge: "10" },
      ]}
    />
  );
};

/**
 * User content in the labels — city names the user typed. `isUserContent` puts
 * `dir="auto"` on them, so a Latin name inside a Hebrew strip keeps its own
 * direction instead of borrowing the interface's.
 */
export const UserContentLabels = () => {
  const [value, setValue] = useState("kyoto");
  return (
    <SegmentedNav
      label="בחירת יעד"
      value={value}
      onChange={setValue}
      variant="pills"
      items={[
        { id: "tokyo", label: "Tokyo", isUserContent: true, badge: "4" },
        { id: "kyoto", label: "Kyoto", isUserContent: true, badge: "4" },
        { id: "osaka", label: "אוסקה", isUserContent: true, badge: "3" },
      ]}
    />
  );
};

/**
 * A long strip scrolls rather than wrapping. Above `sm` this is what renders;
 * `collapse` swaps it for a `<select>` below that, and exactly one of the two is
 * ever in the accessibility tree.
 */
export const ManyItemsAndLongLabels = () => {
  const [value, setValue] = useState("commitments");
  return (
    <SegmentedNav
      label="ניהול שוטף"
      value={value}
      onChange={setValue}
      variant="tabs"
      collapse
      items={[
        { id: "overview", label: "סקירה", badge: "3" },
        { id: "reminders", label: "תזכורות", badge: "7" },
        { id: "money", label: "כספים" },
        { id: "commitments", label: "ביטוחים ומנויים" },
        { id: "health", label: "בריאות" },
        { id: "shopping", label: "קניות ותפריטים" },
      ]}
    />
  );
};

/** English, to check the strip reads the same way with the direction flipped. */
export const InEnglish = () => {
  const [value, setValue] = useState("itinerary");
  return (
    <SegmentedNav
      label="Parts of the trip"
      value={value}
      onChange={setValue}
      variant="tabs"
      items={[
        { id: "itinerary", label: "Itinerary" },
        { id: "bookings", label: "Bookings" },
        { id: "checklist", label: "Checklist", badge: "11/42" },
        { id: "notes", label: "Notes" },
      ]}
    />
  );
};
