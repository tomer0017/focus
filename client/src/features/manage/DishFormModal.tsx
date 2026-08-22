import { useEffect, useState } from "react";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import { useTranslation } from "react-i18next";
import { menuId } from "../../lib/menus";
import { MENU_COURSES } from "../../types/menu";
import { useManage } from "../../state/manageContext";
import { usePages } from "../../state/pagesContext";
import type { Menu, MenuCourse, MenuDish } from "../../types";

interface DishFormModalProps {
  show: boolean;
  onClose: () => void;
  menu: Menu;
  dish?: MenuDish;
}

/**
 * One dish on a menu.
 *
 * A dish is either a recipe from the cooking collection or a name the user
 * typed — never both dressed up as one thing. The "what to buy for it" box is
 * what a hand-typed dish contributes to a shopping list; a recipe contributes
 * its ingredients, because they already exist and re-typing them would be the
 * duplication this app is built to avoid.
 */
export function DishFormModal({ show, onClose, menu, dish }: DishFormModalProps) {
  const { t } = useTranslation(["manage", "common"]);
  const { updateMenu } = useManage();
  const { collectionEntries } = usePages();

  const [title, setTitle] = useState("");
  const [course, setCourse] = useState<MenuCourse>("main");
  const [entryId, setEntryId] = useState("");
  const [items, setItems] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!show) return;
    setTitle(dish?.title ?? "");
    setCourse(dish?.course ?? "main");
    setEntryId(dish?.entryId ?? "");
    setItems((dish?.shoppingItems ?? []).join("\n"));
    setNote(dish?.note ?? "");
  }, [show, dish]);

  const recipes = collectionEntries.filter((entry) => entry.ingredients?.length);
  const canSave = title.trim().length > 0 || entryId.length > 0;

  const submit = (event: React.FormEvent): void => {
    event.preventDefault();
    if (!canSave) return;

    const shoppingItems = items
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    const next: MenuDish = {
      id: dish?.id ?? menuId("dish"),
      course,
      title: title.trim() || undefined,
      // A dish seeded from a template stops being one the moment it is edited,
      // the same rule event sections and checklist items follow.
      titleKey: title.trim() ? undefined : dish?.titleKey,
      entryId: entryId || undefined,
      shoppingItems,
      note: note.trim() || undefined,
      order: dish?.order ?? menu.dishes.length,
    };

    updateMenu(menu.id, {
      dishes: dish
        ? menu.dishes.map((entry) => (entry.id === dish.id ? next : entry))
        : [...menu.dishes, next],
    });
    onClose();
  };

  return (
    <Modal show={show} onHide={onClose} scrollable centered>
      <form onSubmit={submit}>
        <Modal.Header closeButton closeLabel={t("common:actions.close")}>
          <Modal.Title as="h2" className="h5 mb-0">
            {dish ? t("manage:menu.editDish") : t("manage:menu.addDish")}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <div className="focus-form-stack">
            <div className="focus-field-row">
              <div>
                <label htmlFor="dish-title" className="form-label fw-medium">
                  {t("manage:menu.dishTitle")}
                </label>
                <input
                  id="dish-title"
                  className="form-control"
                  dir="auto"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                />
              </div>
              <div>
                <label htmlFor="dish-course" className="form-label fw-medium">
                  {t("manage:menu.course")}
                </label>
                <select
                  id="dish-course"
                  className="form-select"
                  value={course}
                  onChange={(event) => setCourse(event.target.value as MenuCourse)}
                >
                  {MENU_COURSES.map((option) => (
                    <option key={option} value={option}>
                      {t(`manage:courses.${option}`)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {recipes.length > 0 && (
              <div>
                <label htmlFor="dish-recipe" className="form-label fw-medium">
                  {t("manage:menu.recipe")}
                </label>
                <select
                  id="dish-recipe"
                  className="form-select"
                  value={entryId}
                  onChange={(event) => setEntryId(event.target.value)}
                >
                  <option value="">{t("manage:menu.noRecipe")}</option>
                  {recipes.map((entry) => (
                    <option key={entry.id} value={entry.id}>
                      {entry.title}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label htmlFor="dish-items" className="form-label fw-medium">
                {t("manage:menu.shoppingItems")}
              </label>
              <textarea
                id="dish-items"
                className="form-control"
                dir="auto"
                rows={4}
                value={items}
                aria-describedby="dish-items-hint"
                onChange={(event) => setItems(event.target.value)}
              />
              <p id="dish-items-hint" className="form-text mb-0">
                {t("manage:menu.shoppingItemsHint")}
              </p>
            </div>

            <div>
              <label htmlFor="dish-note" className="form-label fw-medium">
                {t("manage:menu.note")}
              </label>
              <input
                id="dish-note"
                className="form-control"
                dir="auto"
                value={note}
                onChange={(event) => setNote(event.target.value)}
              />
            </div>
          </div>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="outline-secondary" type="button" onClick={onClose}>
            {t("common:actions.cancel")}
          </Button>
          <Button variant="primary" type="submit" disabled={!canSave}>
            {t("common:actions.save")}
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
}
