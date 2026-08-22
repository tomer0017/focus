import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Section } from "./Section";
import { spanFor, type SectionSpan } from "./sectionSpan";
import { useChecklists } from "../../state/checklistsContext";
import { ProgressBar } from "../../components/ui/ProgressBar";
import { progressOf } from "../../lib/checklist";
import type { Checklist, ChecklistItem } from "../../types";
import type { PageSummary } from "../../types";

interface PageChipListProps {
  title: string;
  pages: PageSummary[];
  /** Overrides the width the card count would choose. */
  span?: SectionSpan;
}

/**
 * The compact list used for Quick access and for the grouped page lists inside
 * space views (checklists, parked projects…). One line of context per page.
 */
/** The first few things still to do, then whatever else is on the list. */
function previewItems(checklist: Checklist | undefined, limit = 3): ChecklistItem[] {
  if (!checklist) return [];
  const all = checklist.groups.flatMap((group) => group.items);
  const open = all.filter((item) => !item.done);
  return (open.length > 0 ? open : all).slice(0, limit);
}

export function PageChipList({ title, pages, span }: PageChipListProps) {
  const { t } = useTranslation(["dashboard", "common", "checklist"]);
  const { getChecklist } = useChecklists();

  const labelOf = (item: ChecklistItem): string =>
    item.text ?? (item.textKey ? t(`checklist:items.${item.textKey}`) : "");

  const detailFor = (page: PageSummary): string | null =>
    page.nextAction ?? page.currentState ?? null;

  return (
    <Section title={title} hasContent={pages.length > 0} span={span ?? spanFor(pages.length)}>
      <ul className="list-unstyled focus-grid focus-grid--chips mb-0">
        {pages.map((page) => {
          const detail = detailFor(page);
          const progress = progressOf(getChecklist(`page:${page.id}`));

          return (
            <li key={page.id}>
              <article className="focus-chip-card">
                <p className="focus-chip-card__eyebrow">{t(`common:pageTypes.${page.type}`)}</p>
                <h3 className="focus-chip-card__title">
                  <Link to={`/pages/${page.id}`} className="stretched-link" dir="auto">
                    {page.title}
                  </Link>
                </h3>
                {detail && (
                  <p className="focus-chip-card__detail focus-clamp-2" dir="auto">
                    {detail}
                  </p>
                )}

                {progress.total > 0 && (
                  <>
                    {/*
                      A few real items, not just a bar. "5 of 26" over an empty
                      card tells you how far along you are and nothing about
                      what is left, which is the only thing you opened it for.
                    */}
                    <ul className="list-unstyled focus-chip-card__preview mb-0">
                      {previewItems(getChecklist(`page:${page.id}`)).map((item) => (
                        <li key={item.id} className={item.done ? "is-done" : ""}>
                          <span aria-hidden="true">{item.done ? "✓" : "○"}</span>
                          <span dir="auto">{labelOf(item)}</span>
                        </li>
                      ))}
                    </ul>
                    <ProgressBar done={progress.done} total={progress.total} label={page.title} />
                  </>
                )}
              </article>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}
