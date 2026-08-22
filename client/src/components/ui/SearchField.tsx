import { useId } from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "./Icon";

interface SearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  /** Accessible name, and the placeholder. Interface copy. */
  label: string;
  /** How many rows the current term matched, announced politely. */
  resultCount?: number;
}

/**
 * One line of search over a list that is already loaded.
 *
 * Filtering happens as you type, which means the number of results changes
 * without focus moving — so the count is announced through a polite live
 * region rather than left for the user to discover by scrolling. Clearing is a
 * real button, not an overloaded Escape.
 */
export function SearchField({ value, onChange, label, resultCount }: SearchFieldProps) {
  const { t } = useTranslation();
  const id = useId();

  return (
    <div className="focus-search-field">
      <label className="visually-hidden" htmlFor={id}>
        {label}
      </label>
      <span className="focus-search-field__icon" aria-hidden="true">
        <Icon name="search" size={15} />
      </span>
      <input
        id={id}
        type="search"
        className="form-control form-control-sm"
        dir="auto"
        placeholder={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      {value && (
        <button
          type="button"
          className="focus-search-field__clear"
          onClick={() => onChange("")}
          aria-label={t("actions.clearSearch")}
        >
          <Icon name="close" size={14} />
        </button>
      )}
      <span className="visually-hidden" role="status">
        {value && resultCount !== undefined ? t("actions.searchResults", { count: resultCount }) : ""}
      </span>
    </div>
  );
}
