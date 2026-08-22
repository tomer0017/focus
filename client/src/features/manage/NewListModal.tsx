import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import { useTranslation } from "react-i18next";
import { InfoNote } from "../../components/ui/InfoNote";
import { TemplatePicker, type PickerTemplate } from "../../components/ui/TemplatePicker";
import { useChecklists } from "../../state/checklistsContext";
import { useLeisure } from "../../state/leisureContext";
import { usePages } from "../../state/pagesContext";
import type { SpaceId } from "../../types";

interface NewListModalProps {
  show: boolean;
  onClose: () => void;
  /** Which space the list belongs to. Shopping lists live in Home by default. */
  spaceId?: SpaceId;
}

/**
 * A new shopping (or any other) list.
 *
 * Creates a `checklist` **page** plus its checklist, because that is what a
 * list already is in Focus — the detail screen, progress, notes and saved
 * inspiration all come free. Starting from a template clones it with fresh ids,
 * so nothing the user does to the list afterwards can reach the template.
 */
export function NewListModal({ show, onClose, spaceId = "home" }: NewListModalProps) {
  const { t } = useTranslation(["manage", "common", "checklist"]);
  const navigate = useNavigate();
  const { createPage } = usePages();
  const { templates, createEmpty, createFromTemplate } = useChecklists();
  const { recentTemplates, rememberTemplateUse } = useLeisure();

  const [title, setTitle] = useState("");
  const [templateId, setTemplateId] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!show) return;
    setTitle("");
    setTemplateId(undefined);
  }, [show]);

  const shoppingTemplates: PickerTemplate[] = templates
    .filter((template) => (template.category ?? "general") !== "trip")
    .map((template) => ({
      id: template.id,
      name: template.name ?? (template.nameKey ? t(`checklist:${template.nameKey}`) : template.id),
      recommended: template.recommended,
    }));

  const chosen = shoppingTemplates.find((template) => template.id === templateId);
  const canSave = title.trim().length > 0 || Boolean(chosen);

  const submit = (event: React.FormEvent): void => {
    event.preventDefault();
    if (!canSave) return;

    const page = createPage({
      type: "checklist",
      spaceId,
      title: title.trim() || chosen?.name || t("manage:shopping.newList"),
    });

    if (templateId) {
      createFromTemplate(`page:${page.id}`, templateId);
      rememberTemplateUse(templateId);
    } else {
      createEmpty(`page:${page.id}`);
    }

    onClose();
    navigate(`/pages/${page.id}`);
  };

  return (
    <Modal show={show} onHide={onClose} scrollable centered size="lg">
      <form onSubmit={submit}>
        <Modal.Header closeButton closeLabel={t("common:actions.close")}>
          <Modal.Title as="h2" className="h5 mb-0">
            {t("manage:shopping.newList")}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <div className="focus-form-stack">
            <div>
              <label htmlFor="list-title" className="form-label fw-medium">
                {t("manage:shopping.listName")}
              </label>
              <input
                id="list-title"
                className="form-control"
                dir="auto"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
            </div>

            <div>
              <p className="form-label fw-medium mb-1">
                {t("manage:shopping.newListFromTemplate")}
              </p>
              <TemplatePicker
                templates={shoppingTemplates}
                recentIds={recentTemplates}
                label={t("manage:templates.pickLabel")}
                onPick={(id) => {
                  setTemplateId(id);
                  // Fill in a name only when the box is still untouched, so a
                  // title somebody typed is never overwritten by a later pick.
                  setTitle((current) =>
                    current
                      ? current
                      : (shoppingTemplates.find((entry) => entry.id === id)?.name ?? current)
                  );
                }}
              />
              {chosen && <p className="form-text mb-0">{chosen.name}</p>}
            </div>

            <InfoNote>{t("checklist:independence")}</InfoNote>
          </div>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="outline-secondary" type="button" onClick={onClose}>
            {t("common:actions.cancel")}
          </Button>
          <Button variant="primary" type="submit" disabled={!canSave}>
            {t("common:actions.create")}
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
}
