import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Button from "react-bootstrap/Button";
import { BackButton } from "../../components/ui/BackButton";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { InfoNote } from "../../components/ui/InfoNote";
import { LabelledText } from "../../components/ui/LabelledText";
import { PageHeader } from "../../components/ui/PageHeader";
import { SegmentedNav } from "../../components/ui/SegmentedNav";
import { StatusBadge } from "../../components/ui/Badges";
import { Thumbnail } from "../../components/ui/Thumbnail";
import { UrlImageField } from "../../components/ui/UrlImageField";
import { ChecklistSection } from "../checklist/ChecklistSection";
import { LearningResources } from "../learning/LearningResources";
import { ProjectNotes } from "./ProjectNotes";
import { useLocale } from "../../i18n/useLocale";
import { formatRelativeDay } from "../../lib/format";
import {
  LEARNING_LEVELS,
  LEARNING_NOTE_TEMPLATES,
  isForeignChecklist,
  levelFilterFrom,
  matchesLevel,
  topicLabel,
  topicOf,
  type LearningLevelFilter,
} from "../../lib/learning";
import { notesForPage } from "../../lib/projectNotes";
import { todayKey } from "../../lib/dateKey";
import { useChecklists } from "../../state/checklistsContext";
import { usePages } from "../../state/pagesContext";
import type { LearningLevel, PageSummary } from "../../types";

/**
 * One thing being learned.
 *
 * The page is a lens, and the level strip is what sets it. Everything below the
 * strip — the notes, the study plan, the links, the documents, the pictures,
 * the videos — answers to it, so "show me how I did beginner" is one control
 * rather than six filters that drift out of step. Material with no level is
 * general and stays visible at every setting, which is what stops the
 * dictionary link disappearing exactly when somebody narrows down to look for
 * it.
 *
 * Above the strip sit the facts that never depend on a level: what this is,
 * what it is for, where you stopped and what to do next. Below it sits
 * everything you collected on the way.
 *
 * "I studied today" stays available in view mode — recording something that
 * happened is not editing the page. Renaming, filing and deleting are, and they
 * appear only behind the one explicit edit action beside the title.
 */
export function LearningPageView({ page }: { page: PageSummary }) {
  const { t } = useTranslation(["pages", "common", "checklist"]);
  const { locale } = useLocale();
  const {
    setNotes,
    setLearning,
    markStudied,
    updatePage,
    setProjectCategory,
    setVisionImage,
    learningTopics,
  } = usePages();
  const { getChecklist, templates, removeChecklist } = useChecklists();
  const [params, setParams] = useSearchParams();
  const [isEditing, setIsEditing] = useState(false);
  const [confirmForeign, setConfirmForeign] = useState(false);

  const ownerId = `page:${page.id}`;
  const notes = useMemo(() => notesForPage(page), [page]);

  const facts = page.learning ?? {};
  const filter: LearningLevelFilter = levelFilterFrom(params.get("level"));
  const studiedToday = Boolean(
    facts.lastStudiedAt && facts.lastStudiedAt.slice(0, 10) === todayKey()
  );

  const setLevelFilter = (value: string): void => {
    const next = new URLSearchParams(params);
    if (value === "all") next.delete("level");
    else next.set("level", value);
    setParams(next, { replace: true });
  };

  const levelName = (level: LearningLevel | undefined): string | undefined =>
    level ? t(`pages:learning.levels.${level}`) : undefined;

  const subject = topicLabel(learningTopics, topicOf(page), t);

  /*
   * A list this page should never have been able to create.
   *
   * The learning page used to offer the app-wide template picker, so a study
   * plan could come back as a weekly supermarket shop. The picker is gone; the
   * lists it made are still on people's machines, and deleting them quietly to
   * clean up after the app would be destroying somebody's data to hide a
   * mistake. So it is named for what it is, and removing it is the user's
   * decision.
   */
  const checklist = getChecklist(ownerId);
  const foreignList = isForeignChecklist(checklist, templates);

  const visibleNotes = notes.filter((note) => matchesLevel(note.level, filter));

  return (
    <div className="focus-detail">
      <PageHeader
        before={<BackButton />}
        title={page.title}
        titleIsUserContent
        meta={
          <>
            {subject && <span className="focus-chip focus-chip--muted">{subject}</span>}
            <StatusBadge status={page.status} />
            {facts.level && (
              <span className="focus-chip focus-chip--primary">{levelName(facts.level)}</span>
            )}
          </>
        }
        action={
          <div className="d-flex flex-wrap gap-2">
            <Button
              variant="outline-primary"
              size="sm"
              disabled={studiedToday}
              onClick={() => markStudied(page.id)}
            >
              {studiedToday ? t("pages:learning.studiedToday") : t("pages:learning.markStudied")}
            </Button>
            <Button
              variant={isEditing ? "secondary" : "outline-secondary"}
              size="sm"
              onClick={() => setIsEditing((current) => !current)}
            >
              {isEditing ? t("common:actions.doneEditing") : t("common:actions.edit")}
            </Button>
          </div>
        }
      />

      {/* The facts that do not depend on a level, and only the ones that have
          something in them. Two columns on a wide screen, because four short
          answers stacked in one column is a tall panel made mostly of white. */}
      {(facts.goal || page.stoppedAt || page.nextAction || facts.method || page.visionImageUrl) && (
        <section className="focus-panel focus-learning-brief">
          {page.visionImageUrl && (
            <Thumbnail imageUrl={page.visionImageUrl} size="md" />
          )}
          <div className="focus-learning-brief__facts">
            {facts.goal && (
              <LabelledText label={t("pages:learning.goal")}>{facts.goal}</LabelledText>
            )}
            {page.stoppedAt && (
              <LabelledText label={t("common:fields.stoppedAt")}>{page.stoppedAt}</LabelledText>
            )}
            {page.nextAction && (
              <LabelledText label={t("common:fields.nextAction")}>{page.nextAction}</LabelledText>
            )}
            {facts.method && (
              <LabelledText label={t("pages:learning.method")}>{facts.method}</LabelledText>
            )}
          </div>
          <p className="focus-learning-brief__studied mb-0">
            {facts.lastStudiedAt
              ? t("pages:learning.lastStudied", {
                  when: formatRelativeDay(facts.lastStudiedAt, locale),
                })
              : t("pages:learning.neverStudied")}
          </p>
        </section>
      )}

      {isEditing && (
        <section className="focus-panel mt-3">
          <div className="focus-field-row">
            <div>
              <label htmlFor="learn-edit-level" className="form-label fw-medium">
                {t("pages:learning.level")}
              </label>
              <select
                id="learn-edit-level"
                className="form-select"
                value={facts.level ?? ""}
                onChange={(event) =>
                  setLearning(page.id, {
                    level: (event.target.value || undefined) as LearningLevel | undefined,
                  })
                }
              >
                <option value="">{t("pages:learning.levels.unset")}</option>
                {LEARNING_LEVELS.map((option) => (
                  <option key={option} value={option}>
                    {t(`pages:learning.levels.${option}`)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="learn-edit-topic" className="form-label fw-medium">
                {t("pages:learning.topic")}
              </label>
              <select
                id="learn-edit-topic"
                className="form-select"
                value={page.categoryId ?? ""}
                onChange={(event) =>
                  setProjectCategory(page.id, event.target.value || undefined)
                }
              >
                <option value="">{t("pages:learning.topics.none")}</option>
                {learningTopics.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {topicLabel(learningTopics, entry.id, t) ?? entry.id}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="learn-edit-goal" className="form-label fw-medium">
                {t("pages:learning.goal")}
              </label>
              <input
                id="learn-edit-goal"
                className="form-control"
                dir="auto"
                defaultValue={facts.goal ?? ""}
                onBlur={(event) => setLearning(page.id, { goal: event.target.value.trim() })}
              />
            </div>
          </div>

          <div className="focus-field-row mt-2">
            <div>
              <label htmlFor="learn-edit-method" className="form-label fw-medium">
                {t("pages:learning.method")}
              </label>
              <input
                id="learn-edit-method"
                className="form-control"
                dir="auto"
                defaultValue={facts.method ?? ""}
                onBlur={(event) => setLearning(page.id, { method: event.target.value.trim() })}
              />
            </div>
            <div>
              <label htmlFor="learn-edit-stopped" className="form-label fw-medium">
                {t("common:fields.stoppedAt")}
              </label>
              <input
                id="learn-edit-stopped"
                className="form-control"
                dir="auto"
                defaultValue={page.stoppedAt ?? ""}
                onBlur={(event) => updatePage(page.id, { stoppedAt: event.target.value.trim() })}
              />
            </div>
            <div>
              <label htmlFor="learn-edit-next" className="form-label fw-medium">
                {t("common:fields.nextAction")}
              </label>
              <input
                id="learn-edit-next"
                className="form-control"
                dir="auto"
                defaultValue={page.nextAction ?? ""}
                onBlur={(event) => updatePage(page.id, { nextAction: event.target.value.trim() })}
              />
            </div>
          </div>

          <div className="mt-3">
            <UrlImageField
              id="learn-edit-image"
              label={t("pages:learning.image")}
              hint={t("pages:learning.imageHint")}
              value={page.visionImageUrl ?? ""}
              onChange={(value) => setVisionImage(page.id, { visionImageUrl: value })}
            />
          </div>
        </section>
      )}

      {/* The spine of the page: one control, and everything under it obeys. */}
      <div className="focus-level-rail">
        <SegmentedNav
          label={t("pages:learning.levelLabel")}
          items={[
            { id: "all", label: t("pages:learning.levels.all") },
            ...LEARNING_LEVELS.map((level) => ({
              id: level,
              label: t(`pages:learning.levels.${level}`),
            })),
          ]}
          value={filter}
          onChange={setLevelFilter}
          variant="pills"
          collapse
        />
        {filter !== "all" && (
          <p className="focus-level-rail__hint mb-0">{t("pages:learning.levelScope")}</p>
        )}
      </div>

      {(visibleNotes.length > 0 || isEditing) && (
        <section className="focus-section focus-section--full mt-3">
          <h2 className="focus-section-title">{t("pages:notes.title")}</h2>
          <ProjectNotes
            notes={isEditing ? notes : visibleNotes}
            isEditing={isEditing}
            onChange={(next) => setNotes(page.id, next)}
            templates={LEARNING_NOTE_TEMPLATES}
            levels={[
              { value: "", label: t("pages:learning.levels.general") },
              ...LEARNING_LEVELS.map((level) => ({
                value: level,
                label: t(`pages:learning.levels.${level}`),
              })),
            ]}
            levelFieldLabel={t("pages:learning.level")}
            levelBadge={levelName}
          />
        </section>
      )}

      {/* An empty list is nothing to say, so in view mode it says nothing. The
          way to start one is the page's edit action, like every other add. */}
      {(checklist || isEditing || foreignList) && (
      <section className="focus-section focus-section--full mt-3">
        <h2 className="focus-section-title">{t("pages:learning.plan")}</h2>
        {foreignList ? (
          <div className="focus-panel">
            <InfoNote tone="caution">{t("pages:learning.foreignList")}</InfoNote>
            <div className="mt-2">
              <Button variant="outline-danger" size="sm" onClick={() => setConfirmForeign(true)}>
                {t("pages:learning.foreignListRemove")}
              </Button>
            </div>
          </div>
        ) : (
          <>
            <p className="focus-panel__lead">{t("pages:learning.planHint")}</p>
            <ChecklistSection
              ownerId={ownerId}
              mode={isEditing ? "edit" : "view"}
              allowTemplates={false}
            />
          </>
        )}
      </section>
      )}

      <LearningResources page={page} filter={filter} isEditing={isEditing} />

      <div className="mt-3">
        <InfoNote>{t("pages:learning.noLms")}</InfoNote>
      </div>

      <ConfirmDialog
        show={confirmForeign}
        title={t("pages:learning.foreignListRemove")}
        body={t("pages:learning.foreignListConfirm")}
        confirmLabel={t("common:actions.delete")}
        onConfirm={() => {
          removeChecklist(ownerId);
          setConfirmForeign(false);
        }}
        onCancel={() => setConfirmForeign(false)}
      />
    </div>
  );
}
