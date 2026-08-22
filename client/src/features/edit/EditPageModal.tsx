import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import { usePages } from "../../state/pagesContext";
import { categoryLabel, categoryOf } from "../../lib/projectCategories";
import type { EditablePageFields, PageStatus, PageSummary } from "../../types";

/** Sentinel for the "add a category" option, which is not a category id. */
const NEW_CATEGORY = "__new";

interface EditPageModalProps {
  /** The page being edited, or null when the modal is closed. */
  page: PageSummary | null;
  onClose: () => void;
  onSave: (id: string, changes: Partial<EditablePageFields>) => void;
}

interface FieldSpec {
  key: keyof EditablePageFields;
  /** Key in the `common:fields` namespace. */
  labelKey: string;
  /** Key in the `pages:edit` namespace. */
  hintKey: string;
  multiline: boolean;
}

/**
 * The four facts that are still structured fields, and the title.
 *
 * Everything else this form used to collect — why the page exists, what
 * success looks like, what is already done, and after that, the last decision —
 * is a note now, written on the page itself. Those five were prose that only
 * this page read; these four are read by the overview and the board, which is
 * why they are still fields and still edited here.
 */
const FIELDS: FieldSpec[] = [
  { key: "title", labelKey: "pages:edit.titleField", hintKey: "titleHint", multiline: false },
  {
    key: "currentState",
    labelKey: "common:fields.currentState",
    hintKey: "currentStateHint",
    multiline: true,
  },
  { key: "stoppedAt", labelKey: "common:fields.stoppedAt", hintKey: "stoppedAtHint", multiline: true },
  { key: "blocker", labelKey: "common:fields.blocker", hintKey: "blockerHint", multiline: true },
  {
    key: "nextAction",
    labelKey: "common:fields.nextAction",
    hintKey: "nextActionHint",
    multiline: true,
  },
];

/**
 * Minimal edit surface over the four fields that carry the Pareto value.
 * Plain controlled inputs on purpose: Formik/Yup are already in the project but
 * a five-field form does not justify a form framework.
 */
export function EditPageModal({ page, onClose, onSave }: EditPageModalProps) {
  const { t } = useTranslation(["pages", "common", "projects"]);
  const { categories, addCategory, setProjectCategory, moveProject } = usePages();
  const [draft, setDraft] = useState<Partial<EditablePageFields>>({});
  /*
   * The category is not an `EditablePageFields` value — it is written straight
   * through `setProjectCategory`, the same call the collection screen uses. It
   * is still held as a draft here so Cancel discards it like everything else.
   */
  const [category, setCategory] = useState<string>("");
  const [newCategory, setNewCategory] = useState("");
  /*
   * Status is not an `EditablePageFields` value either — it goes through
   * `moveProject`, the same call the board uses, so a status change made here
   * and one made by dragging a card produce the same write. Held as a draft so
   * Cancel discards it.
   */
  const [status, setStatus] = useState<PageStatus>("active");

  // Reload the draft whenever a different page is opened.
  useEffect(() => {
    if (!page) return;
    setCategory(categoryOf(page));
    setNewCategory("");
    setStatus(page.status);
    setDraft({
      title: page.title,
      currentState: page.currentState ?? "",
      stoppedAt: page.stoppedAt ?? "",
      blocker: page.blocker ?? "",
      nextAction: page.nextAction ?? "",
    });
  }, [page]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (!page) return;

    const title = draft.title?.trim();
    onSave(page.id, {
      ...draft,
      // A page without a title is unrecoverable; fall back rather than allow it.
      title: title ? title : page.title,
      // Empty optional fields become undefined so sections stop rendering them.
      blocker: draft.blocker?.trim() ? draft.blocker : undefined,
      stoppedAt: draft.stoppedAt?.trim() ? draft.stoppedAt : undefined,
      currentState: draft.currentState?.trim() ? draft.currentState : undefined,
      nextAction: draft.nextAction?.trim() ? draft.nextAction : undefined,
    });

    // Only when it actually changed: `moveProject` stamps `completedAt` and
    // clears it, and calling it needlessly would rewrite those every save.
    if (status !== page.status) moveProject(page.id, status);

    if (page.type === "project") {
      if (category === NEW_CATEGORY) {
        const name = newCategory.trim();
        if (name) setProjectCategory(page.id, addCategory(name).id);
      } else if (category !== categoryOf(page)) {
        setProjectCategory(page.id, category);
      }
    }

    onClose();
  };

  return (
    <Modal show={page !== null} onHide={onClose} centered scrollable>
      <form onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title as="h2" className="h5">
            {t("pages:edit.openFields")}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <p className="small text-body-secondary">{t("common:mock.editHint")}</p>

          <div className="mb-3">
            <label htmlFor="edit-status" className="form-label fw-medium">
              {t("common:fields.status")}
            </label>
            <select
              id="edit-status"
              className="form-select"
              value={status}
              onChange={(event) => setStatus(event.target.value as PageStatus)}
            >
              {(["active", "paused", "completed"] as PageStatus[]).map((value) => (
                <option key={value} value={value}>
                  {t(`common:status.${value}`)}
                </option>
              ))}
            </select>
          </div>

          {/* Only a project is filed under a category. */}
          {page?.type === "project" && (
            <div className="mb-3">
              <label htmlFor="edit-category" className="form-label fw-medium">
                {t("projects:categories.label")}
              </label>
              <select
                id="edit-category"
                className="form-select"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
              >
                {categories.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {categoryLabel(entry, t)}
                  </option>
                ))}
                <option value={NEW_CATEGORY}>{t("projects:categories.addNew")}</option>
              </select>

              {category === NEW_CATEGORY && (
                <>
                  <label htmlFor="edit-category-name" className="form-label fw-medium mt-2">
                    {t("projects:categories.newName")}
                  </label>
                  <input
                    id="edit-category-name"
                    className="form-control"
                    dir="auto"
                    value={newCategory}
                    onChange={(event) => setNewCategory(event.target.value)}
                  />
                </>
              )}
            </div>
          )}

          {FIELDS.map((field) => {
            const id = `edit-${field.key}`;
            const value = draft[field.key] ?? "";
            const label = t(field.labelKey);
            const hint = t(`pages:edit.${field.hintKey}`);

            return (
              <div className="mb-3" key={field.key}>
                <label htmlFor={id} className="form-label fw-medium">
                  {label}
                </label>
                {field.multiline ? (
                  <textarea
                    id={id}
                    className="form-control"
                    rows={2}
                    dir="auto"
                    value={value}
                    aria-describedby={`${id}-hint`}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, [field.key]: event.target.value }))
                    }
                  />
                ) : (
                  <input
                    id={id}
                    type="text"
                    className="form-control"
                    dir="auto"
                    value={value}
                    aria-describedby={`${id}-hint`}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, [field.key]: event.target.value }))
                    }
                  />
                )}
                <p id={`${id}-hint`} className="form-text mb-0">
                  {hint}
                </p>
              </div>
            );
          })}
        </Modal.Body>

        <Modal.Footer>
          <Button variant="outline-secondary" type="button" onClick={onClose}>
            {t("common:actions.cancel")}
          </Button>
          <Button variant="primary" type="submit">
            {t("common:actions.apply")}
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
}
