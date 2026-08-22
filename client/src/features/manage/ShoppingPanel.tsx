import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { CompactList, CompactRow } from "../../components/ui/CompactRow";
import { ShowMore } from "../../components/ui/ShowMore";
import { InfoNote } from "../../components/ui/InfoNote";
import { useLocale } from "../../i18n/useLocale";
import { formatPercent, formatRelativeDay } from "../../lib/format";
import { progressOf } from "../../lib/checklist";
import { useChecklists } from "../../state/checklistsContext";
import { usePages } from "../../state/pagesContext";
import { useManage } from "../../state/manageContext";
import { NewListModal } from "./NewListModal";
import { MenuFormModal } from "./MenuFormModal";

const LIMIT = 6;

/**
 * Shopping lists and menus.
 *
 * A shopping list is **not** a new entity: it is a `checklist` page with a
 * checklist keyed to it, which is exactly what a packing list already was. That
 * reuse is the whole reason this screen took a panel rather than a subsystem —
 * ticking, groups, templates, progress and the detail screen all already exist.
 */
export function ShoppingPanel() {
  const { t } = useTranslation(["manage", "common", "checklist"]);
  const { locale } = useLocale();
  const { pages } = usePages();
  const { checklists } = useChecklists();
  const { menus } = useManage();

  const [creatingList, setCreatingList] = useState(false);
  const [creatingMenu, setCreatingMenu] = useState(false);

  const lists = useMemo(
    () =>
      pages
        .filter((page) => page.type === "checklist")
        .sort((a, b) => (b.dueAt ?? b.lastUpdatedAt).localeCompare(a.dueAt ?? a.lastUpdatedAt)),
    [pages]
  );

  const sortedMenus = useMemo(
    () => [...menus].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [menus]
  );

  return (
    <>
      <div className="focus-panel-grid">
        <div className="focus-panel">
          <div className="d-flex align-items-center justify-content-between gap-2 mb-1">
            <h3 className="focus-panel__title mb-0">{t("manage:shopping.lists")}</h3>
            <button
              type="button"
              className="btn btn-sm btn-link text-decoration-none p-0"
              onClick={() => setCreatingList(true)}
            >
              {t("manage:shopping.newList")}
            </button>
          </div>

          {lists.length === 0 ? (
            <p className="focus-panel__lead mb-0">{t("manage:shopping.empty")}</p>
          ) : (
            <ShowMore items={lists} limit={LIMIT}>
              {(visible) => (
                <CompactList>
                  {visible.map((page) => {
                    const progress = progressOf(checklists[`page:${page.id}`]);
                    return (
                      <li key={page.id}>
                        <CompactRow
                          title={page.title}
                          href={`/pages/${page.id}`}
                          detail={page.description}
                          meta={
                            <>
                              {progress.total > 0 && (
                                <span>
                                  {t("dashboard:checklistProgress", {
                                    done: progress.done,
                                    total: progress.total,
                                  })}{" "}
                                  · {formatPercent(progress.fraction, locale)}
                                </span>
                              )}
                              {page.dueAt && (
                                <time dateTime={page.dueAt}>
                                  {formatRelativeDay(page.dueAt, locale)}
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
            </ShowMore>
          )}

          <div className="mt-2">
            <InfoNote>{t("manage:shopping.templateIndependence")}</InfoNote>
          </div>
        </div>

        <div className="focus-panel">
          <div className="d-flex align-items-center justify-content-between gap-2 mb-1">
            <h3 className="focus-panel__title mb-0">{t("manage:shopping.menus")}</h3>
            <button
              type="button"
              className="btn btn-sm btn-link text-decoration-none p-0"
              onClick={() => setCreatingMenu(true)}
            >
              {t("manage:shopping.newMenu")}
            </button>
          </div>

          {sortedMenus.length === 0 ? (
            <p className="focus-panel__lead mb-0">{t("manage:shopping.emptyMenus")}</p>
          ) : (
            <ShowMore items={sortedMenus} limit={LIMIT}>
              {(visible) => (
                <CompactList>
                  {visible.map((menu) => (
                    <li key={menu.id}>
                      <CompactRow
                        title={menu.title ?? t(`manage:menuKinds.${menu.kind}`)}
                        href={`/manage/menus/${menu.id}`}
                        eyebrow={t(`manage:menuKinds.${menu.kind}`)}
                        detail={menu.note}
                        meta={
                          <>
                            <span>{t("manage:menu.dishes")}: {menu.dishes.length}</span>
                            {menu.servings !== undefined && (
                              <span>
                                {t("manage:menu.servings")}: {menu.servings}
                              </span>
                            )}
                          </>
                        }
                      />
                    </li>
                  ))}
                </CompactList>
              )}
            </ShowMore>
          )}
        </div>
      </div>

      <NewListModal show={creatingList} onClose={() => setCreatingList(false)} />
      <MenuFormModal show={creatingMenu} onClose={() => setCreatingMenu(false)} />
    </>
  );
}
