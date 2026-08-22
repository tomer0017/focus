import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Button from "react-bootstrap/Button";
import { useTranslation } from "react-i18next";
import { CompactList, CompactRow } from "../../components/ui/CompactRow";
import { EmptyState } from "../../components/ui/EmptyState";
import { FilterChips, type FilterOption } from "../../components/ui/FilterChips";
import { Icon } from "../../components/ui/Icon";
import { PagedList } from "../../components/ui/PagedList";
import { SearchField } from "../../components/ui/SearchField";
import { SegmentedNav, type SegmentedItem } from "../../components/ui/SegmentedNav";
import { useLocale } from "../../i18n/useLocale";
import { formatRelativeDay } from "../../lib/format";
import { countByListType, filterShoppingLists, progressOf } from "../../lib/checklist";
import { CHECKLIST_LIST_TYPES, type ChecklistListType } from "../../types/checklist";
import { useChecklists } from "../../state/checklistsContext";
import { usePages } from "../../state/pagesContext";
import { useManage } from "../../state/manageContext";
import { MenuFormModal } from "./MenuFormModal";
import { NewListModal } from "./NewListModal";

const ALL = "all";
const MENU_KINDS = ["shabbat", "shabbatGuests", "holiday", "free"] as const;

function isListType(value: string | null): value is ChecklistListType {
  return CHECKLIST_LIST_TYPES.includes(value as ChecklistListType);
}

/**
 * Household shopping and the menus that feed it.
 *
 * Two tabs rather than two panels stacked down one page: lists and menus are
 * different questions — "what am I buying" and "what am I cooking" — and the
 * screen was showing both at once with six rows each and a "show more" under
 * both.
 *
 * The boundary is the important part. Only pages that
 * `selectHouseholdShoppingLists` accepts appear here, which is how a camping
 * packing list stopped turning up beside the weekly shop. A list nobody
 * classified appears on **no** screen rather than on a plausible one.
 */
export function ShoppingPanel() {
  const { t } = useTranslation(["manage", "common", "checklist"]);
  const { locale } = useLocale();
  const { pages } = usePages();
  const { checklists } = useChecklists();
  const { menus } = useManage();
  const [params, setParams] = useSearchParams();

  const [creatingList, setCreatingList] = useState(false);
  const [creatingMenu, setCreatingMenu] = useState(false);

  const area = params.get("area") === "menus" ? "menus" : "lists";
  const listType = isListType(params.get("type")) ? params.get("type")! : ALL;
  const menuKind = params.get("kind") ?? ALL;
  const query = params.get("q") ?? "";

  const setParam = (changes: Record<string, string | undefined>): void => {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(changes)) {
      if (!value || value === ALL) next.delete(key);
      else next.set(key, value);
    }
    setParams(next, { replace: true });
  };

  const counts = useMemo(() => countByListType(pages), [pages]);
  const householdTotal = useMemo(() => filterShoppingLists(pages, {}).length, [pages]);

  const lists = useMemo(
    () =>
      filterShoppingLists(pages, {
        listType: listType === ALL ? undefined : (listType as ChecklistListType),
        query: query || undefined,
      }).sort((a, b) => (b.dueAt ?? b.lastUpdatedAt).localeCompare(a.dueAt ?? a.lastUpdatedAt)),
    [pages, listType, query]
  );

  const visibleMenus = useMemo(() => {
    const term = query.trim().toLowerCase();
    return menus
      .filter((menu) => {
        if (menuKind !== ALL && menu.kind !== menuKind) return false;
        if (term) {
          const haystack = [menu.title, menu.note].filter(Boolean).join(" ").toLowerCase();
          if (!haystack.includes(term)) return false;
        }
        return true;
      })
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [menus, menuKind, query]);

  const tabs: SegmentedItem[] = [
    { id: "lists", label: t("manage:shopping.lists") },
    {
      id: "menus",
      label: t("manage:shopping.menus"),
      badge: menus.length > 0 ? String(menus.length) : undefined,
    },
  ];

  const typeOptions: FilterOption<string>[] = [
    { value: ALL, label: t("manage:shopping.filters.all"), count: householdTotal },
    ...CHECKLIST_LIST_TYPES.map((value) => ({
      value,
      label: t(`manage:shopping.listTypes.${value}`),
      count: counts[value],
    })).filter((option) => option.count > 0),
  ];

  const kindOptions: FilterOption<string>[] = [
    { value: ALL, label: t("manage:shopping.filters.all"), count: menus.length },
    ...MENU_KINDS.map((value) => ({
      value,
      label: t(`manage:menuKinds.${value}`),
      count: menus.filter((menu) => menu.kind === value).length,
    })).filter((option) => option.count > 0),
  ];

  return (
    <>
      <SegmentedNav
        label={t("manage:shopping.chooseArea")}
        items={tabs}
        value={area}
        onChange={(id) => setParam({ area: id === "lists" ? undefined : id, type: undefined, kind: undefined, q: undefined })}
        variant="tabs"
        collapse
      />

      <div className="focus-collection__toolbar">
        {area === "lists" && typeOptions.length > 1 && (
          <FilterChips
            label={t("manage:shopping.filters.type")}
            options={typeOptions}
            value={listType}
            onChange={(value) => setParam({ type: value })}
          />
        )}
        {area === "menus" && kindOptions.length > 1 && (
          <FilterChips
            label={t("manage:shopping.filters.occasion")}
            options={kindOptions}
            value={menuKind}
            onChange={(value) => setParam({ kind: value })}
          />
        )}
        <SearchField
          label={
            area === "lists" ? t("manage:shopping.searchLists") : t("manage:shopping.searchMenus")
          }
          value={query}
          onChange={(value) => setParam({ q: value })}
          resultCount={query ? (area === "lists" ? lists.length : visibleMenus.length) : undefined}
        />
        <Button
          variant="primary"
          size="sm"
          onClick={() => (area === "lists" ? setCreatingList(true) : setCreatingMenu(true))}
        >
          <Icon name="plus" size={15} />
          {area === "lists" ? t("manage:shopping.newList") : t("manage:shopping.newMenu")}
        </Button>
      </div>

      {area === "lists" ? (
        lists.length === 0 ? (
          <EmptyState
            title={query || listType !== ALL ? t("manage:shopping.noMatches") : t("manage:shopping.empty")}
            hint={query || listType !== ALL ? undefined : t("manage:shopping.emptyHint")}
          />
        ) : (
          <PagedList items={lists} pageSize={20} resetKey={`${listType}:${query}`}>
            {(shown) => (
              <CompactList>
                {shown.map((page) => {
                  const progress = progressOf(checklists[`page:${page.id}`]);
                  const type = page.checklist?.listType;
                  return (
                    <li key={page.id}>
                      <CompactRow
                        title={page.title}
                        href={`/pages/${page.id}`}
                        eyebrow={
                          type ? t(`manage:shopping.listTypes.${type}`) : undefined
                        }
                        detail={page.checklist?.occasion ?? page.description}
                        progress={progress.total > 0 ? progress : undefined}
                        meta={
                          page.dueAt ? (
                            <time dateTime={page.dueAt}>
                              {formatRelativeDay(page.dueAt, locale)}
                            </time>
                          ) : undefined
                        }
                      />
                    </li>
                  );
                })}
              </CompactList>
            )}
          </PagedList>
        )
      ) : visibleMenus.length === 0 ? (
        <EmptyState
          title={query || menuKind !== ALL ? t("manage:shopping.noMatches") : t("manage:shopping.emptyMenus")}
          hint={query || menuKind !== ALL ? undefined : t("manage:shopping.emptyMenusHint")}
        />
      ) : (
        <PagedList items={visibleMenus} pageSize={20} resetKey={`${menuKind}:${query}`}>
          {(shown) => (
            <CompactList>
              {shown.map((menu) => {
                /* Which list this menu writes into, when it has chosen one. */
                const target = menu.listPageId
                  ? pages.find((page) => page.id === menu.listPageId)
                  : undefined;
                return (
                  <li key={menu.id}>
                    <CompactRow
                      title={menu.title ?? t(`manage:menuKinds.${menu.kind}`)}
                      href={`/manage/menus/${menu.id}`}
                      eyebrow={t(`manage:menuKinds.${menu.kind}`)}
                      detail={menu.note}
                      meta={
                        <>
                          <span>
                            {t("manage:menu.dishes")}: {menu.dishes.length}
                          </span>
                          {target && <span dir="auto">{target.title}</span>}
                          {menu.lastListCreatedAt && (
                            <time dateTime={menu.lastListCreatedAt}>
                              {formatRelativeDay(menu.lastListCreatedAt, locale)}
                            </time>
                          )}
                        </>
                      }
                    />
                  </li>
                );
              })}
            </CompactList>
          )}
        </PagedList>
      )}

      <NewListModal show={creatingList} onClose={() => setCreatingList(false)} />
      <MenuFormModal show={creatingMenu} onClose={() => setCreatingMenu(false)} />
    </>
  );
}
