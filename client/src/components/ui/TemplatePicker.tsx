import { useState } from "react";
import { useTranslation } from "react-i18next";
import { partitionTemplates } from "../../lib/templates";

export interface PickerTemplate {
  id: string;
  /** Interface copy, already translated by the caller. */
  name: string;
  /** One line saying what it starts you with. */
  hint?: string;
  recommended?: boolean;
}

interface TemplatePickerProps {
  templates: PickerTemplate[];
  /** Ids used most recently, newest first. */
  recentIds: string[];
  onPick: (templateId: string) => void;
  /** Accessible name for the group. */
  label: string;
}

/**
 * The shared template picker: recommended, recent, then everything.
 *
 * One component for checklists, scheduled items, family profiles, learning
 * pages and menus, because the decision is identical in all five and because a
 * second picker would be a second idea of what "recently used" means.
 *
 * Nothing appears twice — a template that is both recent and recommended shows
 * up under Recent only, which is the same de-duplication rule the overview
 * follows. "All templates" stays collapsed until asked for: forty options on
 * arrival is how a template system stops being used.
 */
export function TemplatePicker({ templates, recentIds, onPick, label }: TemplatePickerProps) {
  const { t } = useTranslation(["manage", "common"]);
  const [showAll, setShowAll] = useState(false);

  const { recommended, recent, all } = partitionTemplates(templates, recentIds);

  const group = (title: string, entries: PickerTemplate[]) =>
    entries.length === 0 ? null : (
      <div className="focus-template-group">
        <p className="focus-template-group__title">{title}</p>
        <ul className="list-unstyled mb-0 focus-template-list">
          {entries.map((template) => (
            <li key={template.id}>
              <button
                type="button"
                className="focus-template-option"
                onClick={() => onPick(template.id)}
              >
                <span className="focus-template-option__name">{template.name}</span>
                {template.hint && (
                  <span className="focus-template-option__hint">{template.hint}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </div>
    );

  return (
    <div className="focus-template-picker" role="group" aria-label={label}>
      {group(t("manage:templates.recent"), recent)}
      {group(t("manage:templates.recommended"), recommended)}

      {showAll ? (
        group(t("manage:templates.all"), all)
      ) : (
        <button type="button" className="focus-show-more" onClick={() => setShowAll(true)}>
          {t("manage:templates.showAll", { count: all.length })}
        </button>
      )}
    </div>
  );
}
