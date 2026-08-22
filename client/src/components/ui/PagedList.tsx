import { useEffect, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";

interface PagedListProps<T> {
  items: T[];
  /** How many to render at once. 20 unless a row is unusually tall. */
  pageSize?: number;
  /**
   * Anything that changes which items these are — a tab, a filter, a search
   * term. Changing it resets the page, so switching to "finished" never lands
   * you 60 rows deep in a list you have not scrolled yet.
   */
  resetKey?: string;
  children: (visible: T[]) => ReactNode;
}

/**
 * A long list, disclosed a page at a time.
 *
 * `ShowMore` reveals *everything* behind one button, which is right for six
 * saved links and wrong for seventy finished projects: one press and the
 * browser lays out seventy rows nobody asked to see. This keeps the same
 * interaction — a real button that says how many are left — and grows the list
 * in fixed steps instead.
 *
 * It is not pagination. There are no numbered pages and no arithmetic to do:
 * what is on screen only ever grows, so nothing you have already read moves or
 * disappears. Rows land in the DOM when the button is pressed, so keyboard and
 * screen-reader users follow exactly the path a mouse does.
 */
export function PagedList<T>({ items, pageSize = 20, resetKey, children }: PagedListProps<T>) {
  const { t } = useTranslation();
  const [shown, setShown] = useState(pageSize);

  useEffect(() => {
    setShown(pageSize);
  }, [resetKey, pageSize]);

  const visible = items.slice(0, shown);
  const remaining = items.length - visible.length;

  return (
    <>
      {children(visible)}

      {remaining > 0 && (
        <div className="focus-paged__more">
          <button
            type="button"
            className="focus-show-more"
            onClick={() => setShown((current) => current + pageSize)}
          >
            {t("actions.showMore", { count: Math.min(remaining, pageSize) })}
          </button>
          {/* The honest total, so "show more" is never a guess about depth. */}
          <span className="focus-paged__count">
            {t("actions.showingCount", { shown: visible.length, total: items.length })}
          </span>
        </div>
      )}
    </>
  );
}
