import { useState } from "react";
import { useTranslation } from "react-i18next";
import Button from "react-bootstrap/Button";
import { useChecklists } from "../../state/checklistsContext";
import { Checklist } from "../../components/ui/Checklist";
import { EmptyState } from "../../components/ui/EmptyState";
import { Icon } from "../../components/ui/Icon";
import type { Checklist as ChecklistModel } from "../../types";

interface ChecklistSectionProps {
  /** What the list belongs to, e.g. `trip:japan-2027`. */
  ownerId: string;
  /** Other owners whose lists can be copied — "same as last time". */
  copyFrom?: { ownerId: string; label: string }[];
  /**
   * `view` keeps the boxes tickable and hides the structural chrome — no group
   * delete, no "add an item" input, no "save as a template". Ticking something
   * off is not editing the list's structure, so it stays available; renaming
   * and deleting are edits and belong behind the page's edit action.
   *
   * Defaults to `edit` so the screens that have always shown a fully editable
   * list keep doing so.
   */
  mode?: "view" | "edit";
}

/**
 * A checklist plus everything around creating one.
 *
 * The same component serves trips, projects and events. Which template a list
 * came from is remembered, so "save as a template" and "copy from a previous
 * trip" are both one click rather than a rebuild.
 */
export function ChecklistSection({ ownerId, copyFrom = [], mode = "edit" }: ChecklistSectionProps) {
  const { t } = useTranslation(["checklist", "common"]);
  const { getChecklist, templates, update, createEmpty, createFromTemplate, duplicateInto, saveAsTemplate } =
    useChecklists();

  const [templateId, setTemplateId] = useState(templates[0]?.id ?? "");
  const [source, setSource] = useState("");
  const [templateName, setTemplateName] = useState("");
  const [saving, setSaving] = useState(false);

  const checklist: ChecklistModel | undefined = getChecklist(ownerId);

  /*
   * Owner ids look like `trip:japan-2027`. A colon is legal in an id attribute
   * but makes the id unselectable with `querySelector` without escaping, which
   * is a trap for every future test and dev-tools session. The DOM gets a
   * flattened form; the data keeps the real one.
   */
  const domId = ownerId.replace(/[^a-zA-Z0-9_-]/g, "-");

  const templateLabel = (id: string): string => {
    const template = templates.find((entry) => entry.id === id);
    if (!template) return id;
    return template.name ?? (template.nameKey ? t(`checklist:${template.nameKey}`) : id);
  };

  if (!checklist) {
    return (
      <EmptyState
        title={t("checklist:noChecklist")}
        hint={t("checklist:noChecklistHint")}
        action={
          <div className="focus-checklist-start">
            <form
              className="focus-inline-form"
              onSubmit={(event) => {
                event.preventDefault();
                if (templateId) createFromTemplate(ownerId, templateId);
              }}
            >
              <label className="visually-hidden" htmlFor={`cl-template-${domId}`}>
                {t("checklist:chooseTemplate")}
              </label>
              <select
                id={`cl-template-${domId}`}
                className="form-select form-select-sm"
                value={templateId}
                onChange={(event) => setTemplateId(event.target.value)}
              >
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {templateLabel(template.id)}
                  </option>
                ))}
              </select>
              <Button type="submit" size="sm" variant="primary">
                {t("checklist:createFrom")}
              </Button>
            </form>

            {copyFrom.length > 0 && (
              <form
                className="focus-inline-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (source) duplicateInto(ownerId, source);
                }}
              >
                <label className="visually-hidden" htmlFor={`cl-copy-${domId}`}>
                  {t("checklist:copyFrom")}
                </label>
                <select
                  id={`cl-copy-${domId}`}
                  className="form-select form-select-sm"
                  value={source}
                  onChange={(event) => setSource(event.target.value)}
                >
                  <option value="">{t("checklist:copyFrom")}</option>
                  {copyFrom.map((entry) => (
                    <option key={entry.ownerId} value={entry.ownerId}>
                      {entry.label}
                    </option>
                  ))}
                </select>
                <Button type="submit" size="sm" variant="outline-primary" disabled={!source}>
                  {t("checklist:createFrom")}
                </Button>
              </form>
            )}

            <Button variant="outline-secondary" size="sm" onClick={() => createEmpty(ownerId)}>
              <Icon name="plus" size={14} />
              {t("checklist:customList")}
            </Button>
          </div>
        }
      />
    );
  }

  return (
    <>
      <Checklist
        checklist={checklist}
        mode={mode}
        onChange={(change) => update(ownerId, change)}
        action={
          mode === "view" ? undefined : saving ? (
            <form
              className="focus-inline-form"
              onSubmit={(event) => {
                event.preventDefault();
                saveAsTemplate(ownerId, templateName);
                setTemplateName("");
                setSaving(false);
              }}
            >
              <label className="visually-hidden" htmlFor={`cl-tname-${domId}`}>
                {t("checklist:templateName")}
              </label>
              <input
                id={`cl-tname-${domId}`}
                className="form-control form-control-sm"
                dir="auto"
                autoFocus
                placeholder={t("checklist:templateName")}
                value={templateName}
                onChange={(event) => setTemplateName(event.target.value)}
              />
              <Button type="submit" size="sm" variant="outline-primary" disabled={!templateName.trim()}>
                {t("common:actions.save")}
              </Button>
            </form>
          ) : (
            <Button variant="link" size="sm" onClick={() => setSaving(true)}>
              {t("checklist:saveAsTemplate")}
            </Button>
          )
        }
      />

      {checklist.templateId && (
        <p className="form-text mt-2 mb-0">
          {t("checklist:savedTemplate")}: {templateLabel(checklist.templateId)}
        </p>
      )}
    </>
  );
}
