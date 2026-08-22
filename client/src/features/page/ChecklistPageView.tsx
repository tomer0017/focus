import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import Button from "react-bootstrap/Button";
import { usePages } from "../../state/pagesContext";
import { useChecklists } from "../../state/checklistsContext";
import { useLocale } from "../../i18n/useLocale";
import { formatDate, formatRelativeDay } from "../../lib/format";
import { progressOf } from "../../lib/checklist";
import { notesForPage } from "../../lib/projectNotes";
import { Icon } from "../../components/ui/Icon";
import { BackButton } from "../../components/ui/BackButton";
import { PageHeader } from "../../components/ui/PageHeader";
import { ProgressBar } from "../../components/ui/ProgressBar";
import { SavedItemCard } from "../../components/ui/SavedItemCard";
import { SpaceBadge } from "../../components/ui/Badges";
import { ChecklistSection } from "../checklist/ChecklistSection";
import { ProjectNotes } from "./ProjectNotes";
import type { PageSummary, SavedItem } from "../../types";

/** What reads as a picture to plan from, rather than as reference material. */
const INSPIRATION_KINDS: SavedItem["kind"][] = ["inspiration", "image", "product", "link"];

/**
 * A checklist page — a few nights up north, the morning of a flight.
 *
 * This is not a small project and the project screen was wrong for it. Opening
 * "Trip North" asked why the page existed, what stage it was at and what the
 * next action was; for a page whose entire content is "tent, cool box, coffee,
 * firewood", every one of those is a box the user has to invent an answer for.
 *
 * So the same shared pieces are arranged in the order this kind of page is
 * actually read: what you wrote down, what you are picturing, and then the
 * list — which is the page. Nothing is behind a tab. The two things a person
 * opens this page to do are look at the gear they saved and tick things off,
 * and a tab would hide one of them.
 *
 * It is emphatically **not** a second trip planner. A real trip — flights,
 * stays, day plans, outfits — is a `Trip`, and lives on `/trips/:id`.
 */
export function ChecklistPageView({ page }: { page: PageSummary }) {
  const { t } = useTranslation(["pages", "checklist", "common"]);
  const { locale } = useLocale();
  const { savedItemsFor, setNotes } = usePages();
  const { getChecklist } = useChecklists();
  const [isEditing, setIsEditing] = useState(false);

  const ownerId = `page:${page.id}`;
  const related = useMemo(() => savedItemsFor(page.id), [page.id, savedItemsFor]);
  const notes = useMemo(() => notesForPage(page), [page]);
  const inspiration = related.filter((item) => INSPIRATION_KINDS.includes(item.kind));
  const progress = progressOf(getChecklist(ownerId));

  return (
    <div className="focus-detail focus-checklist-page">
      <PageHeader
        before={<BackButton />}
        title={page.title}
        titleIsUserContent
        meta={
          <>
            <SpaceBadge spaceId={page.spaceId} />
            {page.dueAt && (
              <span className="text-secondary small">
                <time dateTime={page.dueAt}>
                  {formatDate(page.dueAt, locale)} · {formatRelativeDay(page.dueAt, locale)}
                </time>
              </span>
            )}
          </>
        }
        action={
          <Button
            variant={isEditing ? "primary" : "outline-primary"}
            size="sm"
            onClick={() => setIsEditing((current) => !current)}
          >
            <Icon name={isEditing ? "check" : "edit"} size={15} />
            {isEditing ? t("common:actions.doneEditing") : t("common:actions.edit")}
          </Button>
        }
      />

      {/* Overall progress, before anything else: it is the answer to "am I ready?". */}
      {progress.total > 0 && (
        <div className="focus-checklist-page__progress">
          <ProgressBar
            done={progress.done}
            total={progress.total}
            label={t("checklist:progressFor", { name: page.title })}
          />
        </div>
      )}

      {/* 1. What you wrote down. Absent when there is nothing written. */}
      <ProjectNotes
        notes={notes}
        isEditing={isEditing}
        onChange={(next) => setNotes(page.id, next)}
      />

      {/* 2. What you are picturing — visible on arrival, never behind a tab. */}
      {inspiration.length > 0 && (
        <section className="focus-checklist-page__inspiration">
          <h2 className="focus-note__title">{t("pages:checklistPage.inspiration")}</h2>
          <ul className="list-unstyled focus-grid focus-grid--saved mb-0">
            {inspiration.map((item) => (
              <li key={item.id}>
                <SavedItemCard item={item} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 3. The list. This is the page. */}
      <section className="focus-checklist-page__list">
        <h2 className="focus-note__title">{t("pages:checklistPage.list")}</h2>
        {/* Tickable while reading; renaming, reordering and deleting appear
            only in edit mode. Ticking something off is not editing. */}
        <ChecklistSection ownerId={ownerId} mode={isEditing ? "edit" : "view"} />
      </section>
    </div>
  );
}
