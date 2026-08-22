import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CompactList, CompactRow } from "../../components/ui/CompactRow";
import { Thumbnail } from "../../components/ui/Thumbnail";
import type { DashboardSlice, FocusRow } from "../../lib/dashboard";

interface FocusListProps {
  title: string;
  slice: DashboardSlice<FocusRow>;
  /** Where "all of them" leads. */
  allHref: string;
  allLabel: string;
  emptyLabel: string;
  /** Turns a category or subject id into a word. */
  labelFor?: (categoryId: string | undefined) => string | undefined;
  /** Learning only: turns a level into a word. */
  levelLabel?: (level: string) => string;
}

/**
 * "What am I working on" — three rows, one line each.
 *
 * One component for projects and for learning because a row is a row: a name, a
 * label, and the single line that tells you where to pick it up. What differs
 * is which label sits in the eyebrow, and that is a prop.
 *
 * Deliberately not here: descriptions, notes, checklists, saved material,
 * progress bars. All of that is one tap away on the page itself, and none of it
 * changes which project you open next.
 */
export function FocusList({
  title,
  slice,
  allHref,
  allLabel,
  emptyLabel,
  labelFor,
  levelLabel,
}: FocusListProps) {
  const { t } = useTranslation(["dashboard", "common"]);

  return (
    <section className="focus-dash-area">
      <div className="focus-dash-area__head">
        <h2 className="focus-section-title mb-0">{title}</h2>
        {slice.visible.length > 0 && <Link to={allHref}>{allLabel}</Link>}
      </div>

      {slice.visible.length === 0 ? (
        <p className="focus-dash-empty">{emptyLabel}</p>
      ) : (
        <CompactList>
          {slice.visible.map((row) => (
            <li key={row.id}>
              <CompactRow
                title={row.title}
                href={row.href}
                eyebrow={
                  [
                    labelFor?.(row.categoryId),
                    row.level && levelLabel ? levelLabel(row.level) : undefined,
                  ]
                    .filter(Boolean)
                    .join(" · ") || undefined
                }
                detail={row.line}
                leading={<Thumbnail imageUrl={row.imageUrl} size="sm" />}
                badges={
                  /*
                   * Blocked is written out, not just coloured — and it is the
                   * only state worth a chip here. "Active" on every row of a
                   * list of active projects is a word that says nothing.
                   */
                  row.state === "blocked" ? (
                    <span className="focus-chip focus-chip--warning">
                      {t("common:status.blocked")}
                    </span>
                  ) : undefined
                }
              />
            </li>
          ))}
        </CompactList>
      )}
    </section>
  );
}
