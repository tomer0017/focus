import { useTranslation } from "react-i18next";
import { Icon } from "../../components/ui/Icon";
import { ALL_SECTIONS } from "../../types/family";
import { useFamily } from "../../state/familyContext";
import type { FamilyProfile, FamilySectionKind } from "../../types";

/**
 * Which sections a profile shows, and in what order.
 *
 * Visible only in edit mode. The list of everything available lives here rather
 * than on the profile itself, so a section nobody switched on costs nothing at
 * all — no stored row, no empty heading, no reserved space.
 */
export function SectionManager({ profile }: { profile: FamilyProfile }) {
  const { t } = useTranslation(["family", "common"]);
  const { toggleSection, moveSection, renameSection } = useFamily();

  const active = [...profile.activeSections].sort((a, b) => a.order - b.order);
  const activeKinds = new Set(active.map((section) => section.kind));
  const available = ALL_SECTIONS.filter((kind) => !activeKinds.has(kind));

  const nameOf = (kind: FamilySectionKind, override?: string): string =>
    override ?? t(`family:sections.${kind}`);

  return (
    <div className="focus-panel">
      <h3 className="focus-panel__title">{t("family:sections.manage")}</h3>
      <p className="focus-panel__lead">{t("family:sections.manageHint")}</p>

      <ul className="focus-dense-rows list-unstyled mb-2">
        {active.map((section, index) => {
          const label = nameOf(section.kind, section.titleOverride);
          return (
            <li key={section.id}>
              <div className="focus-dense-row">
                <div className="focus-dense-row__body">
                  <label htmlFor={`sec-${section.id}`} className="visually-hidden">
                    {t("family:sections.rename", { name: label })}
                  </label>
                  <input
                    id={`sec-${section.id}`}
                    className="form-control form-control-sm"
                    dir="auto"
                    value={label}
                    onChange={(event) => renameSection(profile.id, section.id, event.target.value)}
                  />
                </div>
                <div className="focus-dense-row__actions">
                  <button
                    type="button"
                    className="focus-icon-button btn btn-sm btn-link text-secondary"
                    aria-label={t("family:sections.moveUp", { name: label })}
                    disabled={index === 0}
                    onClick={() => moveSection(profile.id, section.id, -1)}
                  >
                    <Icon name="chevronUp" size={15} />
                  </button>
                  <button
                    type="button"
                    className="focus-icon-button btn btn-sm btn-link text-secondary"
                    aria-label={t("family:sections.moveDown", { name: label })}
                    disabled={index === active.length - 1}
                    onClick={() => moveSection(profile.id, section.id, 1)}
                  >
                    <Icon name="chevronDown" size={15} />
                  </button>
                  <button
                    type="button"
                    className="focus-icon-button btn btn-sm btn-link text-secondary"
                    aria-label={t("common:actions.deleteNamed", { name: label })}
                    onClick={() => toggleSection(profile.id, section.kind)}
                  >
                    <Icon name="trash" size={15} />
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {available.length > 0 && (
        <>
          <p className="focus-dense-row__eyebrow">{t("family:sections.add")}</p>
          <div className="focus-chips">
            {available.map((kind) => (
              <button
                key={kind}
                type="button"
                className="focus-chip-button"
                onClick={() => toggleSection(profile.id, kind)}
              >
                <Icon name="plus" size={13} />
                {t(`family:sections.${kind}`)}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
