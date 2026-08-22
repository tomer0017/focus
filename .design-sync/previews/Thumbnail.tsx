import { Thumbnail } from "focus-client";

/**
 * A picture at the start of a row — or nothing at all.
 *
 * The "or nothing at all" is the whole component. A row that reserves a 56px
 * square for a picture the item does not have leaves an empty box in every
 * list, and a list of mostly-pictureless things then reads as broken rather
 * than plain. The empty cell below renders literally nothing, which is correct.
 */

export const TwoSizes = () => (
  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
    <Thumbnail thumb="city" size="md" />
    <Thumbnail thumb="city" size="sm" />
  </div>
);

/** Nothing to show: the component returns null and the row closes the gap. */
export const NoPicture = () => (
  <div style={{ display: "flex", gap: 12, alignItems: "center", minHeight: 24 }}>
    <Thumbnail />
    <span className="text-secondary small">אין תמונה — הרכיב לא מרנדר דבר</span>
  </div>
);

/**
 * A remote address that fails. It shows the neutral "did not load" placeholder
 * rather than quietly swapping in artwork — a drawing where a photograph should
 * be looks like the photograph, and the broken link is never discovered.
 */
export const BrokenAddress = () => (
  <Thumbnail imageUrl="https://example.invalid/missing.jpg" size="md" />
);
