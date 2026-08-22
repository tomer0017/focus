import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";

interface ShowMoreProps<T> {
  items: T[];
  /** How many to show before the button appears. */
  limit: number;
  children: (visible: T[]) => ReactNode;
}

/**
 * Progressive disclosure for a long list.
 *
 * A list of forty rows is not information, it is a wall. Three or six, then a
 * button that says how many are behind it, keeps the screen readable and tells
 * the truth about what is there — which "…" does not.
 *
 * The button is a real button and the extra rows land in the DOM when it is
 * pressed, so keyboard focus and screen readers follow the same path a mouse
 * does. There is no pagination anywhere in this app: a personal data set never
 * gets big enough to need one, and pages hide things behind arithmetic.
 */
export function ShowMore<T>({ items, limit, children }: ShowMoreProps<T>) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  const hidden = items.length - limit;
  const visible = expanded ? items : items.slice(0, limit);

  return (
    <>
      {children(visible)}
      {hidden > 0 && (
        <button
          type="button"
          className="focus-show-more"
          onClick={() => setExpanded((current) => !current)}
        >
          {expanded ? t("actions.showLess") : t("actions.showMore", { count: hidden })}
        </button>
      )}
    </>
  );
}
