import { useTranslation } from "react-i18next";
import Button from "react-bootstrap/Button";
import { Icon } from "../../components/ui/Icon";
import type { PageSummary } from "../../types";

interface ProjectFocusBandProps {
  page: PageSummary;
  /** Ticked / total across the project's checklist. */
  progress: { done: number; total: number };
  /** Opens the tasks tab. */
  onOpenTasks: () => void;
}

/**
 * The decision strip: what to do next, and what is stopping it.
 *
 * This is the one loud element on the page, and the two facts are deliberately
 * in the **same block** rather than in two panels. "What do I do next" and
 * "what is in the way" are one thought — a blocker is not a separate topic, it
 * is the reason the next action has not happened — and splitting them into a
 * "stage" panel and an "action" panel is what made the old brief read as a form
 * with headings instead of an answer.
 *
 * Everything here is optional and an absent part renders nothing. A project
 * with no next action, no blocker and no tasks renders **no band at all**,
 * because a strip announcing that there is nothing to say is worse than
 * silence.
 */
export function ProjectFocusBand({ page, progress, onOpenTasks }: ProjectFocusBandProps) {
  const { t } = useTranslation(["pages", "common"]);

  const blocker = page.blocker?.trim();
  const nextAction = page.nextAction?.trim();
  const open = progress.total - progress.done;

  if (!nextAction && !blocker && progress.total === 0) return null;

  return (
    <section className={`focus-project-band${blocker ? " focus-project-band--blocked" : ""}`}>
      <div className="focus-project-band__main">
        {nextAction ? (
          <>
            <p className="focus-project-band__label">{t("common:fields.nextAction")}</p>
            <p className="focus-project-band__action mb-0" dir="auto">
              {nextAction}
            </p>
          </>
        ) : (
          /* No next action is a real state, and saying so is more useful than
             an empty space where the answer should be. */
          <p className="focus-project-band__none mb-0">{t("pages:band.noNextAction")}</p>
        )}

        {blocker && (
          <p className="focus-project-band__blocker mb-0">
            <Icon name="alert" size={15} />
            <span>
              <span className="fw-semibold">{t("common:fields.blocker")}</span>{" "}
              <span dir="auto">{blocker}</span>
            </span>
          </p>
        )}
      </div>

      {progress.total > 0 && (
        <Button variant="outline-secondary" size="sm" onClick={onOpenTasks}>
          {open > 0
            ? t("pages:band.openTasks", { count: open })
            : t("pages:band.allTasksDone")}
        </Button>
      )}
    </section>
  );
}
