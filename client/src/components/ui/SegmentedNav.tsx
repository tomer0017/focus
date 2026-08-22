import { useId } from "react";

export interface SegmentedItem {
  id: string;
  /** Interface copy, already translated. */
  label: string;
  /** True when the label is the user's own words — a city, a look, a list. */
  isUserContent?: boolean;
  /** A count or a short state word beside the label. Never the only signal. */
  badge?: string;
}

interface SegmentedNavProps {
  /** Accessible name for the whole control. Interface copy. */
  label: string;
  items: SegmentedItem[];
  value: string;
  onChange: (id: string) => void;
  /**
   * `tabs` underlines the active item and drives a panel below it; `pills` is a
   * filter over content that is already on screen.
   */
  variant?: "tabs" | "pills";
  /**
   * Prefix for the `id`/`aria-controls` pair when this drives tab panels. Given
   * only by callers that actually render `role="tabpanel"` — inventing the
   * relationship without the panel is worse than plain buttons.
   */
  idPrefix?: string;
  /**
   * Below `sm`, swap the strip for a `<select>`. Six labels in a horizontal
   * scroller at 320px is a control with no visible scrollbar and half its
   * options off-screen; a select is one tap and shows all of them.
   */
  collapse?: boolean;
}

/**
 * One item chosen out of a few — the app's primary tab strip.
 *
 * Every collection screen picks a category with it, every detail screen picks a
 * topic with it, and a handful of places use the pill variant as a view switch.
 * They are one component rather than a dozen strips that drift apart; what
 * differs between them is whether they drive a panel and whether they collapse
 * on a phone, and both are props.
 *
 * For a *secondary* status filter, use `FilterChips` instead: it carries
 * `aria-pressed` group semantics, which is the right reading for "narrow what is
 * listed" as opposed to "switch which panel is shown".
 *
 * Exactly one of the two renderings is in the accessibility tree at a time —
 * `d-none`/`d-sm-flex` removes the other from the tree entirely, so a screen
 * reader never announces the same six options twice.
 */
export function SegmentedNav({
  label,
  items,
  value,
  onChange,
  variant = "tabs",
  idPrefix,
  collapse = false,
}: SegmentedNavProps) {
  const generated = useId();
  const selectId = `${generated}-select`;

  const strip = (
    <div
      className={`focus-seg focus-seg--${variant}${collapse ? " d-none d-sm-flex" : ""}`}
      role={idPrefix ? "tablist" : undefined}
      aria-label={idPrefix ? label : undefined}
    >
      {items.map((item) => {
        const active = item.id === value;
        return (
          <button
            key={item.id}
            type="button"
            role={idPrefix ? "tab" : undefined}
            id={idPrefix ? `${idPrefix}-tab-${item.id}` : undefined}
            aria-controls={idPrefix ? `${idPrefix}-panel-${item.id}` : undefined}
            aria-selected={idPrefix ? active : undefined}
            aria-pressed={idPrefix ? undefined : active}
            className={`focus-seg__item${active ? " is-active" : ""}`}
            onClick={() => onChange(item.id)}
          >
            <span dir={item.isUserContent ? "auto" : undefined}>{item.label}</span>
            {item.badge && <span className="focus-seg__badge">{item.badge}</span>}
          </button>
        );
      })}
    </div>
  );

  if (!collapse) return strip;

  return (
    <>
      {strip}
      <div className="focus-seg-select d-sm-none">
        <label className="visually-hidden" htmlFor={selectId}>
          {label}
        </label>
        <select
          id={selectId}
          className="form-select form-select-sm"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        >
          {items.map((item) => (
            <option key={item.id} value={item.id}>
              {item.badge ? `${item.label} (${item.badge})` : item.label}
            </option>
          ))}
        </select>
      </div>
    </>
  );
}
