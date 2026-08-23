import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { usePages } from "../../state/pagesContext";
import { BoardColumn } from "../projects/BoardColumn";
import { RecipeCard } from "./RecipeCard";
import { TagList } from "./TagList";
import { Icon } from "../../components/ui/Icon";
import { PagedList } from "../../components/ui/PagedList";
import { allTags, entriesInGroup, RECIPE_GROUPS, searchEntries, type RecipeGroup } from "../../lib/recipes";
import type { CollectionEntry } from "../../types";

/** Beyond this many recipes, the dense grid is the more useful default. */
const GRID_THRESHOLD = 24;

/** How many recipes render before "show more" — in either view. */
const PAGE_SIZE = 24;

interface CookingBoardProps {
  entries: CollectionEntry[];
}

/**
 * Three groups: want to try, tried, recommended.
 *
 * They are a view over two fields rather than three statuses — dropping a card
 * into "recommended" marks it tried *and* recommended, and taking it out again
 * clears only the flag. That is the whole reason `recommended` is not a status.
 *
 * Below `lg` the columns become tabs, for the same reason the project board
 * does: three narrow columns on a phone are three unreadable lists.
 */
export function CookingBoard({ entries }: CookingBoardProps) {
  const { t } = useTranslation(["cooking", "common"]);
  const { moveEntry, swapEntries } = usePages();

  const [dragging, setDragging] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<RecipeGroup>("want_to_try");
  /*
   * Board or grid, and which one leads depends on how much there is.
   *
   * Three columns are the right shape for deciding what to cook — the question
   * is "what have I been meaning to try?", which is a column. They are the
   * wrong shape for finding one recipe among eighty: at that size the board is
   * three unbounded stacks and the page runs to several thousand pixels. Past
   * this many recipes the grid leads instead, and the board is one press away.
   */
  const [view, setView] = useState<"board" | "grid">(
    entries.length > GRID_THRESHOLD ? "grid" : "board"
  );
  const [tag, setTag] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const tags = useMemo(() => allTags(entries), [entries]);

  const visible = useMemo(() => {
    const byTag = tag
      ? entries.filter((entry) => entry.tags.some((value) => value === tag))
      : entries;
    return searchEntries(byTag, query);
  }, [entries, tag, query]);

  const columns = RECIPE_GROUPS.map((group) => ({
    group,
    entries: entriesInGroup(visible, group),
  }));

  // Sorted by name: in a grid there is no column to tell you where to look.
  const flat = useMemo(
    () => [...visible].sort((a, b) => a.title.localeCompare(b.title)),
    [visible]
  );

  const renderColumn = (group: RecipeGroup, list: CollectionEntry[], scope: string) => (
    <BoardColumn
      key={group}
      title={t(`cooking:groups.${group}`)}
      count={list.length}
      onDropCard={(entryId, targetIndex) => moveEntry(entryId, group, targetIndex)}
    >
      <ul className="list-unstyled focus-board-column__list mb-0">
        {list.map((entry, index) => (
          <li key={entry.id}>
            <RecipeCard
              entry={entry}
              scope={scope}
              isFirst={index === 0}
              isLast={index === list.length - 1}
              isDragging={dragging === entry.id}
              onDragStart={() => setDragging(entry.id)}
              onDragEnd={() => setDragging(null)}
              onGroupChange={(next) => moveEntry(entry.id, next)}
              /*
               * Swap with the card beside it on screen, named rather than
               * indexed. The column merges every collection page and the
               * stored order is per page, so an on-screen index meant nothing
               * to the old renumbering — one nudge reshuffled recipes from
               * other collections that nobody had touched.
               */
              onMove={(direction) => {
                const neighbour = list[index + direction];
                if (neighbour) swapEntries(entry.id, neighbour.id);
              }}
            />
          </li>
        ))}
      </ul>
    </BoardColumn>
  );

  return (
    <>
      <div className="focus-cooking-filters">
        <form className="focus-search focus-search--inline" role="search" onSubmit={(event) => event.preventDefault()}>
          <label htmlFor="recipe-search" className="visually-hidden">
            {t("cooking:searchLabel")}
          </label>
          <Icon name="search" size={16} className="focus-search__icon" />
          <input
            id="recipe-search"
            type="search"
            className="form-control focus-search__input"
            placeholder={t("cooking:searchPlaceholder")}
            value={query}
            dir="auto"
            onChange={(event) => setQuery(event.target.value)}
          />
        </form>

        {tags.length > 0 && (
          <div className="focus-cooking-filters__tags">
            <TagList tags={tags} onSelect={(value) => setTag(value === tag ? null : value)} activeTag={tag} />
            {tag && (
              <button type="button" className="focus-summary__undo" onClick={() => setTag(null)}>
                {t("cooking:clearTag", { tag })}
              </button>
            )}
          </div>
        )}
      </div>

      <div className="focus-cooking-views" role="group" aria-label={t("cooking:viewLabel")}>
        {(["board", "grid"] as const).map((option) => (
          <button
            key={option}
            type="button"
            className={`focus-cooking-views__button ${view === option ? "is-active" : ""}`}
            aria-pressed={view === option}
            onClick={() => setView(option)}
          >
            <Icon name={option === "board" ? "board" : "overview"} size={14} />
            {t(`cooking:views.${option}`)}
          </button>
        ))}
        <span className="focus-cooking-views__count">
          {t("cooking:showing", { count: flat.length })}
        </span>
      </div>

      {view === "grid" ? (
        /* Paged, so eighty recipes are eighty pictures the browser lays out
           only when somebody asks for them. */
        <PagedList items={flat} pageSize={PAGE_SIZE} resetKey={`${tag ?? ""}|${query}`}>
          {(visible) => (
            <ul className="list-unstyled focus-grid focus-grid--recipes mb-0">
              {visible.map((entry) => (
                <li key={entry.id}>
                  <RecipeCard
                    entry={entry}
                    scope="grid"
                    /* Order is a property of a column, and the grid has none — so
                       the arrows are disabled here rather than quietly reordering
                       a list the user cannot see. */
                    isFirst
                    isLast
                    isDragging={dragging === entry.id}
                    onDragStart={() => setDragging(entry.id)}
                    onDragEnd={() => setDragging(null)}
                    onGroupChange={(next) => moveEntry(entry.id, next)}
                    onMove={() => undefined}
                  />
                </li>
              ))}
            </ul>
          )}
        </PagedList>
      ) : (
      <>
      <div className="focus-board-tabs d-lg-none" role="tablist" aria-label={t("cooking:title")}>
        {columns.map(({ group, entries: list }) => (
          <button
            key={group}
            type="button"
            role="tab"
            id={`cook-tab-${group}`}
            aria-selected={activeTab === group}
            aria-controls={`cook-panel-${group}`}
            className={`focus-board-tabs__tab ${activeTab === group ? "is-active" : ""}`}
            onClick={() => setActiveTab(group)}
          >
            {t(`cooking:groups.${group}`)}
            <span className="focus-board-tabs__count">{list.length}</span>
          </button>
        ))}
      </div>

      <div
        className="d-lg-none"
        role="tabpanel"
        id={`cook-panel-${activeTab}`}
        aria-labelledby={`cook-tab-${activeTab}`}
      >
        {renderColumn(
          activeTab,
          columns.find((column) => column.group === activeTab)?.entries ?? [],
          "tab"
        )}
      </div>

      <div className="focus-board d-none d-lg-grid">
        {columns.map(({ group, entries: list }) => renderColumn(group, list, "board"))}
      </div>
      </>
      )}
    </>
  );
}
