import { useId } from "react";
import { useTranslation } from "react-i18next";

export interface FilterOption<T extends string> {
  value: T;
  /** Interface copy, already translated by the caller. */
  label: string;
  /** Shown after the label when there is something to count. */
  count?: number;
}

interface FilterChipsProps<T extends string> {
  /** Accessible name for the whole group. */
  label: string;
  options: FilterOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

/**
 * One filter, two presentations, no duplicated state.
 *
 * Above `sm` it renders a row of real `<button>`s with `aria-pressed`. Below
 * `sm` it renders a `<select>` instead — a horizontal strip of chips on a
 * 320px screen either overflows the viewport or becomes a scroll surface with
 * no scrollbar, and both are worse than a native picker that a thumb can hit.
 *
 * The two are alternates of each other, not two controls: exactly one is in the
 * accessibility tree at a time, because `d-none` removes an element from it.
 */
export function FilterChips<T extends string>({
  label,
  options,
  value,
  onChange,
}: FilterChipsProps<T>) {
  const id = useId();
  const { t } = useTranslation();

  return (
    <>
      <div className="focus-chips d-none d-sm-flex" role="group" aria-label={label}>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`focus-chip-button${option.value === value ? " is-active" : ""}`}
            aria-pressed={option.value === value}
            onClick={() => onChange(option.value)}
          >
            {option.label}
            {option.count !== undefined && (
              <span className="focus-chip-button__count">{option.count}</span>
            )}
          </button>
        ))}
      </div>

      <div className="d-sm-none">
        <label htmlFor={id} className="visually-hidden">
          {label}
        </label>
        <select
          id={id}
          className="form-select form-select-sm"
          value={value}
          onChange={(event) => onChange(event.target.value as T)}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.count !== undefined
                ? t("filters.optionWithCount", { label: option.label, count: option.count })
                : option.label}
            </option>
          ))}
        </select>
      </div>
    </>
  );
}
