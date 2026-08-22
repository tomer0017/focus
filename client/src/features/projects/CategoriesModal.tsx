import { useState } from "react";
import { useTranslation } from "react-i18next";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import { usePages } from "../../state/pagesContext";
import { Icon } from "../../components/ui/Icon";
import { canRemove, categoryLabel, countIn } from "../../lib/projectCategories";
import { boardProjects } from "../../lib/projectBoard";

interface CategoriesModalProps {
  show: boolean;
  onClose: () => void;
}

/**
 * Renaming, reordering, adding and removing the project categories.
 *
 * Each edit writes as it is made, so there is no draft to lose and no Save
 * button pretending otherwise — Close is the only exit, and it is honest. This
 * is the one dialog in the app that works that way, and it does because the
 * things it edits are single words with immediate visible effect behind it.
 *
 * A category with projects in it cannot be deleted. The alternative is deleting
 * it and moving its projects somewhere the app picked, which is a destructive
 * operation dressed up as tidying; the count is shown on the disabled control
 * so the reason is on screen rather than in a tooltip.
 */
export function CategoriesModal({ show, onClose }: CategoriesModalProps) {
  const { t } = useTranslation(["projects", "common"]);
  const { pages, categories, addCategory, renameCategory, removeCategory, moveCategory } =
    usePages();

  const [name, setName] = useState("");
  const projects = boardProjects(pages);

  return (
    <Modal show={show} onHide={onClose} centered scrollable>
      <Modal.Header closeButton closeLabel={t("common:actions.close")}>
        <Modal.Title as="h2" className="h5">
          {t("projects:categories.manage")}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <ul className="list-unstyled focus-category-list mb-3">
          {categories.map((category, index) => {
            const used = countIn(projects, category.id);
            const removable = canRemove(projects, category.id);
            return (
              <li key={category.id} className="focus-category-list__row">
                <label className="visually-hidden" htmlFor={`cat-${category.id}`}>
                  {t("projects:categories.nameOf", { name: categoryLabel(category, t) })}
                </label>
                <input
                  id={`cat-${category.id}`}
                  className="form-control form-control-sm"
                  dir="auto"
                  value={categoryLabel(category, t)}
                  onChange={(event) => renameCategory(category.id, event.target.value)}
                />
                <span className="focus-category-list__count">
                  {t("projects:categories.count", { count: used })}
                </span>
                <button
                  type="button"
                  className="focus-icon-button border"
                  disabled={index === 0}
                  onClick={() => moveCategory(category.id, -1)}
                  aria-label={t("common:actions.moveUp")}
                >
                  <Icon name="chevronUp" size={13} />
                </button>
                <button
                  type="button"
                  className="focus-icon-button border"
                  disabled={index === categories.length - 1}
                  onClick={() => moveCategory(category.id, 1)}
                  aria-label={t("common:actions.moveDown")}
                >
                  <Icon name="chevronDown" size={13} />
                </button>
                <button
                  type="button"
                  className="focus-icon-button border"
                  disabled={!removable}
                  onClick={() => removeCategory(category.id)}
                  aria-label={
                    removable
                      ? t("common:actions.deleteNamed", { name: categoryLabel(category, t) })
                      : t("projects:categories.inUse", { count: used })
                  }
                >
                  <Icon name="trash" size={13} />
                </button>
              </li>
            );
          })}
        </ul>

        <form
          className="focus-inline-form"
          onSubmit={(event) => {
            event.preventDefault();
            if (!name.trim()) return;
            addCategory(name);
            setName("");
          }}
        >
          <label className="visually-hidden" htmlFor="new-category">
            {t("projects:categories.newName")}
          </label>
          <input
            id="new-category"
            className="form-control form-control-sm"
            dir="auto"
            placeholder={t("projects:categories.newName")}
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <Button type="submit" size="sm" variant="primary" disabled={!name.trim()}>
            <Icon name="plus" size={13} />
            {t("common:actions.add")}
          </Button>
        </form>

        <p className="form-text mt-3 mb-0">{t("projects:categories.hint")}</p>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="primary" type="button" onClick={onClose}>
          {t("common:actions.close")}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
