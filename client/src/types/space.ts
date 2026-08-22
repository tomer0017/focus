/**
 * Spaces are the top-level areas of life a page belongs to.
 * Kept as a closed union for now — spaces become user-defined data once the
 * database lands, at which point this becomes `string` plus a Space document.
 */
export type SpaceId = "work-tech" | "personal" | "home" | "cooking" | "trips";

export interface Space {
  id: SpaceId;
  /**
   * Display names are NOT stored here — they come from the `common:spaces`
   * translation namespace, keyed by id. Storing a label would hardcode one
   * language into the data model.
   */
  accent: "primary" | "success" | "warning" | "info" | "danger";
  /** Key into the local icon set. */
  icon: "work" | "personal" | "home" | "cooking" | "trips";
}
