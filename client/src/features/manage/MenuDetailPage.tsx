import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Button from "react-bootstrap/Button";
import { useTranslation } from "react-i18next";
import { BackButton } from "../../components/ui/BackButton";
import { CompactList, CompactRow } from "../../components/ui/CompactRow";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { EditButton } from "../../components/ui/EditButton";
import { EmptyState } from "../../components/ui/EmptyState";
import { Icon } from "../../components/ui/Icon";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatRow } from "../../components/ui/StatRow";
import { useLocale } from "../../i18n/useLocale";
import { formatRelativeDay } from "../../lib/format";
import { mergeMenuIntoChecklist, newLineCount } from "../../lib/menus";
import { MENU_COURSES } from "../../types/menu";
import { useChecklists } from "../../state/checklistsContext";
import { useManage } from "../../state/manageContext";
import { usePages } from "../../state/pagesContext";
import type { MenuCourse, MenuDish } from "../../types";
import { DishFormModal } from "./DishFormModal";
import { MenuFormModal } from "./MenuFormModal";

/**
 * One menu: its dishes, grouped by course, and the one button that turns them
 * into shopping.
 *
 * Generating a list is always an explicit action with a count in front of it,
 * and the merge never touches an item already on the list — ticked or not. That
 * is the difference between a feature you can use every Friday and one you use
 * once and then stop trusting.
 */
export function MenuDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation(["manage", "common", "pages"]);
  const { locale } = useLocale();
  const navigate = useNavigate();

  const { menus, updateMenu, deleteMenu } = useManage();
  const { collectionEntries, pages, createPage } = usePages();
  const { checklists, update: updateChecklist } = useChecklists();

  const [editingMenu, setEditingMenu] = useState(false);
  const [editingDish, setEditingDish] = useState<MenuDish | undefined>(undefined);
  const [addingDish, setAddingDish] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [confirmingList, setConfirmingList] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const menu = menus.find((entry) => entry.id === id);

  const listTitle = menu?.title ?? (menu ? t(`manage:menuKinds.${menu.kind}`) : "");

  /*
   * The list this menu writes into: the one it created last time if it still
   * exists, otherwise a new one.
   *
   * The id lives on the menu, not in component state — that is what makes
   * "create a shopping list" idempotent across visits. Looked up by id rather
   * than by name, so renaming the list does not spawn a second one beside it.
   * A list the user deleted simply falls through to creating a fresh one.
   */
  const existingListPage = useMemo(
    () => pages.find((page) => page.id === menu?.listPageId && page.type === "checklist"),
    [pages, menu?.listPageId]
  );
  const existingList = existingListPage ? checklists[`page:${existingListPage.id}`] : undefined;

  const pending = useMemo(
    () => (menu ? newLineCount(menu, collectionEntries, existingList) : 0),
    [menu, collectionEntries, existingList]
  );

  if (!menu) {
    return (
      <EmptyState
        title={t("common:errors.pageNotFoundTitle")}
        hint={t("common:errors.pageNotFoundMessage", { id: id ?? "" })}
      />
    );
  }

  const grouped = MENU_COURSES.map((course) => ({
    course,
    dishes: menu.dishes.filter((dish) => dish.course === course).sort((a, b) => a.order - b.order),
  })).filter((group) => group.dishes.length > 0);

  const buildList = (): void => {
    const page =
      existingListPage ??
      createPage({
        type: "checklist",
        spaceId: "home",
        title: listTitle,
      });

    const ownerId = `page:${page.id}`;
    updateChecklist(ownerId, (current) =>
      mergeMenuIntoChecklist(
        ownerId,
        menu,
        collectionEntries,
        // `update` seeds an empty list when there is none, and an empty list is
        // indistinguishable from "no list" for merge purposes.
        current.groups.length === 0 && !existingList ? undefined : current,
        (course) => t(`manage:courses.${course}`)
      )
    );

    updateMenu(menu.id, {
      lastListCreatedAt: new Date().toISOString(),
      listPageId: page.id,
    });
    setConfirmingList(false);
    navigate(`/pages/${page.id}`);
  };

  const removeDish = (dishId: string): void =>
    updateMenu(menu.id, { dishes: menu.dishes.filter((dish) => dish.id !== dishId) });

  const moveDish = (dishId: string, direction: -1 | 1): void => {
    const ordered = [...menu.dishes].sort((a, b) => a.order - b.order);
    const index = ordered.findIndex((dish) => dish.id === dishId);
    const target = index + direction;
    if (index === -1 || target < 0 || target >= ordered.length) return;
    [ordered[index], ordered[target]] = [ordered[target], ordered[index]];
    updateMenu(menu.id, { dishes: ordered.map((dish, order) => ({ ...dish, order })) });
  };

  const recipeTitle = (entryId: string | undefined): string | undefined =>
    entryId ? collectionEntries.find((entry) => entry.id === entryId)?.title : undefined;

  return (
    <>
      <PageHeader
        before={<BackButton />}
        title={listTitle}
        titleIsUserContent={Boolean(menu.title)}
        meta={
          <span className="focus-chip focus-chip--muted">
            {t(`manage:menuKinds.${menu.kind}`)}
          </span>
        }
        action={
          <div className="d-flex flex-wrap gap-2">
            <Button variant="primary" onClick={() => setConfirmingList(true)}>
              {t("manage:menu.makeList")}
            </Button>
            <Button
              variant={editMode ? "secondary" : "outline-secondary"}
              onClick={() => setEditMode((current) => !current)}
            >
              {editMode ? t("common:actions.doneEditing") : t("common:actions.edit")}
            </Button>
          </div>
        }
      />

      <StatRow
        stats={[
          { label: t("manage:menu.dishes"), value: String(menu.dishes.length) },
          ...(menu.servings !== undefined
            ? [{ label: t("manage:menu.servings"), value: String(menu.servings) }]
            : []),
        ]}
      />

      {menu.note && (
        <p className="focus-panel__lead mt-2" dir="auto">
          {menu.note}
        </p>
      )}

      {menu.lastListCreatedAt && (
        <p className="focus-panel__lead">
          {t("manage:menu.lastListCreated", {
            when: formatRelativeDay(menu.lastListCreatedAt, locale),
          })}
          {existingListPage && (
            <>
              {" · "}
              <Link to={`/pages/${existingListPage.id}`}>{t("manage:menu.openList")}</Link>
            </>
          )}
        </p>
      )}

      {editMode && (
        <div className="d-flex flex-wrap gap-2 mb-3">
          <Button variant="outline-secondary" size="sm" onClick={() => setAddingDish(true)}>
            <Icon name="plus" size={15} /> {t("manage:menu.addDish")}
          </Button>
          <Button variant="outline-secondary" size="sm" onClick={() => setEditingMenu(true)}>
            {t("common:actions.edit")}
          </Button>
          <Button variant="outline-danger" size="sm" onClick={() => setConfirmingDelete(true)}>
            {t("common:actions.delete")}
          </Button>
        </div>
      )}

      {grouped.length === 0 ? (
        <EmptyState
          title={t("manage:menu.empty")}
          action={
            <Button variant="primary" onClick={() => setAddingDish(true)}>
              {t("manage:menu.addDish")}
            </Button>
          }
        />
      ) : (
        <div className="focus-panel-grid">
          {grouped.map(({ course, dishes }) => (
            <section key={course} className="focus-panel">
              <h2 className="focus-panel__title">{t(`manage:courses.${course as MenuCourse}`)}</h2>
              <CompactList>
                {dishes.map((dish) => (
                  <li key={dish.id}>
                    <CompactRow
                      title={dish.title ?? recipeTitle(dish.entryId) ?? ""}
                      detail={dish.note ?? (dish.shoppingItems ?? []).join(" · ")}
                      href={dish.entryId ? `/recipes/${dish.entryId}` : undefined}
                      actions={
                        editMode ? (
                          <>
                            <button
                              type="button"
                              className="focus-icon-button btn btn-sm btn-link text-secondary"
                              aria-label={t("common:actions.moveUp")}
                              onClick={() => moveDish(dish.id, -1)}
                            >
                              <Icon name="chevronUp" size={15} />
                            </button>
                            <button
                              type="button"
                              className="focus-icon-button btn btn-sm btn-link text-secondary"
                              aria-label={t("common:actions.moveDown")}
                              onClick={() => moveDish(dish.id, 1)}
                            >
                              <Icon name="chevronDown" size={15} />
                            </button>
                            <EditButton
                              targetLabel={dish.title ?? ""}
                              onClick={() => setEditingDish(dish)}
                            />
                            <button
                              type="button"
                              className="focus-icon-button btn btn-sm btn-link text-secondary"
                              aria-label={t("common:actions.deleteNamed", {
                                name: dish.title ?? "",
                              })}
                              onClick={() => removeDish(dish.id)}
                            >
                              <Icon name="trash" size={15} />
                            </button>
                          </>
                        ) : undefined
                      }
                    />
                  </li>
                ))}
              </CompactList>
            </section>
          ))}
        </div>
      )}

      <MenuFormModal show={editingMenu} menu={menu} onClose={() => setEditingMenu(false)} />

      <DishFormModal
        show={addingDish || Boolean(editingDish)}
        menu={menu}
        dish={editingDish}
        onClose={() => {
          setAddingDish(false);
          setEditingDish(undefined);
        }}
      />

      <ConfirmDialog
        show={confirmingList}
        title={t("manage:menu.makeListTitle")}
        body={
          pending === 0
            ? t("manage:menu.makeListNothing")
            : t("manage:menu.makeListBody", { count: pending, list: listTitle })
        }
        confirmLabel={t("manage:menu.makeList")}
        onConfirm={buildList}
        onCancel={() => setConfirmingList(false)}
      />

      <ConfirmDialog
        show={confirmingDelete}
        title={t("manage:menu.deleteTitle")}
        body={t("manage:menu.deleteBody", { title: listTitle })}
        confirmLabel={t("common:actions.delete")}
        onConfirm={() => {
          deleteMenu(menu.id);
          navigate("/manage?view=shopping");
        }}
        onCancel={() => setConfirmingDelete(false)}
      />
    </>
  );
}
