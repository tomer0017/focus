import { useState } from "react";
import Button from "react-bootstrap/Button";
import { useTranslation } from "react-i18next";
import { ProgressBar } from "../../components/ui/ProgressBar";
import { progressOf } from "../../lib/checklist";
import { useChecklists } from "../../state/checklistsContext";
import { ChecklistSection } from "../checklist/ChecklistSection";

interface ProfileTasksProps {
  profileId: string;
  /** The profile's edit mode. Structural editing follows it. */
  isEditing: boolean;
}

/** How many outstanding items the collapsed block previews. */
const PREVIEW = 3;

/**
 * The things to do for this person — a shopping list for a grandparent, the
 * forms to chase for a child.
 *
 * This block exists because of a regression: the profile page used to render an
 * opt-in "checklist" section, and when the page was rebuilt around three tabs
 * that section went with it. The data was never touched — it has always been at
 * `family:<profileId>` — but for one release there was no way to see it.
 *
 * So it is back, deliberately **quieter** than it was: appointments and
 * reminders are what a profile is mostly about, and a task list that shouted
 * would be the same mistake in the other direction. Collapsed, it is a progress
 * bar and the next three outstanding items, tickable where they stand. Ticking
 * something off is not editing, so it stays available in view mode.
 *
 * Opening it hands over to the shared `<ChecklistSection>` — the same component
 * trips, projects and shopping lists use. There is no `FamilyTask`, no
 * `FamilyChecklist` and no second storage key.
 */
export function ProfileTasks({ profileId, isEditing }: ProfileTasksProps) {
  const { t } = useTranslation(["family", "common"]);
  const { getChecklist, update } = useChecklists();
  const [open, setOpen] = useState(false);

  const ownerId = `family:${profileId}`;
  const checklist = getChecklist(ownerId);
  const progress = progressOf(checklist);

  const outstanding = (checklist?.groups ?? [])
    .flatMap((group) => group.items.map((item) => ({ item, groupId: group.id })))
    .filter((entry) => !entry.item.done);

  /*
   * Nothing here yet: one small action, not a bordered panel announcing an
   * absence. The list is created by the shared section the moment it is opened.
   */
  if (progress.total === 0 && !open) {
    return (
      <section className="mt-4">
        <Button variant="link" size="sm" className="p-0 text-decoration-none" onClick={() => setOpen(true)}>
          {t("family:tasks.addFirst")}
        </Button>
      </section>
    );
  }

  return (
    <section className="mt-4">
      <div className="focus-dash-area__head">
        <h3 className="focus-section-title mb-0">{t("family:tasks.title")}</h3>
        <button
          type="button"
          className="btn btn-sm btn-link p-0 text-decoration-none"
          aria-expanded={open}
          onClick={() => setOpen((current) => !current)}
        >
          {open ? t("family:tasks.close") : t("family:tasks.open")}
        </button>
      </div>

      {open ? (
        /* The shared list, in full. Structural edits follow the page's mode. */
        <ChecklistSection ownerId={ownerId} mode={isEditing ? "edit" : "view"} />
      ) : (
        <>
          {progress.total > 0 && (
            <ProgressBar
              done={progress.done}
              total={progress.total}
              label={t("family:tasks.progress")}
            />
          )}

          {outstanding.length === 0 ? (
            <p className="focus-dash-empty">{t("family:tasks.allDone")}</p>
          ) : (
            <ul className="focus-plan-exercises list-unstyled mb-0">
              {outstanding.slice(0, PREVIEW).map(({ item, groupId }) => (
                <li key={item.id} className="focus-plan-exercise">
                  <div className="form-check mb-0">
                    <input
                      id={`task-${item.id}`}
                      type="checkbox"
                      className="form-check-input"
                      checked={item.done}
                      onChange={() =>
                        update(ownerId, (current) => ({
                          ...current,
                          groups: current.groups.map((group) =>
                            group.id !== groupId
                              ? group
                              : {
                                  ...group,
                                  items: group.items.map((entry) =>
                                    entry.id === item.id ? { ...entry, done: !entry.done } : entry
                                  ),
                                }
                          ),
                          updatedAt: new Date().toISOString(),
                        }))
                      }
                    />
                    <label className="form-check-label" htmlFor={`task-${item.id}`} dir="auto">
                      {item.text}
                    </label>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {outstanding.length > PREVIEW && (
            <p className="focus-dash-more mb-0">
              {t("family:tasks.andMore", { count: outstanding.length - PREVIEW })}
            </p>
          )}
        </>
      )}
    </section>
  );
}
