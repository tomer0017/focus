import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import Button from "react-bootstrap/Button";
import { BackButton } from "../../components/ui/BackButton";
import { InfoNote } from "../../components/ui/InfoNote";
import { LabelledText } from "../../components/ui/LabelledText";
import { PageHeader } from "../../components/ui/PageHeader";
import { RelatedLinks } from "../../components/ui/RelatedLinks";
import { SpaceBadge, StatusBadge } from "../../components/ui/Badges";
import { ChecklistSection } from "../checklist/ChecklistSection";
import { ProjectNotes } from "./ProjectNotes";
import { useLocale } from "../../i18n/useLocale";
import { formatRelativeDay } from "../../lib/format";
import { notesForPage } from "../../lib/projectNotes";
import { todayKey } from "../../lib/dateKey";
import { usePages } from "../../state/pagesContext";
import type { LearningLevel, PageSummary } from "../../types";

const LEVELS: LearningLevel[] = ["beginner", "intermediate", "advanced"];

/**
 * A learning page.
 *
 * It leads with the two facts that actually get somebody back in after three
 * months away — where they stopped and what to do next — and then the level,
 * the goal and the way they were learning it. The refresher list, the notes and
 * the saved resources are the ordinary shared mechanisms; nothing here is a
 * lesson, a module or a score, and there is no progress percentage, because a
 * percentage of "learning Hebrew calligraphy" would be a made-up number.
 *
 * "I studied today" is a one-tap fact and stays available in view mode: it is a
 * record of something that happened, not an edit to the page.
 */
export function LearningPageView({ page }: { page: PageSummary }) {
  const { t } = useTranslation(["pages", "common", "checklist"]);
  const { locale } = useLocale();
  const { savedItemsFor, setNotes, setLearning, markStudied, updatePage } = usePages();
  const [isEditing, setIsEditing] = useState(false);

  const ownerId = `page:${page.id}`;
  const related = useMemo(() => savedItemsFor(page.id), [page.id, savedItemsFor]);
  const notes = useMemo(() => notesForPage(page), [page]);

  const facts = page.learning ?? {};
  const studiedToday = Boolean(
    facts.lastStudiedAt && facts.lastStudiedAt.slice(0, 10) === todayKey()
  );

  return (
    <div className="focus-detail">
      <PageHeader
        before={<BackButton />}
        title={page.title}
        titleIsUserContent
        meta={
          <>
            <span className="focus-chip focus-chip--muted">
              {t("common:pageTypes.learning")}
            </span>
            <StatusBadge status={page.status} />
            <SpaceBadge spaceId={page.spaceId} />
            {facts.level && (
              <span className="focus-chip focus-chip--primary">
                {t(`pages:learning.levels.${facts.level}`)}
              </span>
            )}
          </>
        }
        action={
          <div className="d-flex flex-wrap gap-2">
            <Button
              variant={studiedToday ? "secondary" : "primary"}
              disabled={studiedToday}
              onClick={() => markStudied(page.id)}
            >
              {studiedToday ? t("pages:learning.studiedToday") : t("pages:learning.markStudied")}
            </Button>
            <Button
              variant={isEditing ? "secondary" : "outline-secondary"}
              onClick={() => setIsEditing((current) => !current)}
            >
              {isEditing ? t("common:actions.doneEditing") : t("common:actions.edit")}
            </Button>
          </div>
        }
      />

      <div className="focus-panel-grid">
        {/* Where you stopped, first. It is the reason this screen exists. */}
        {(page.stoppedAt || page.nextAction) && (
          <section className="focus-panel">
            {page.stoppedAt && (
              <LabelledText label={t("common:fields.stoppedAt")}>{page.stoppedAt}</LabelledText>
            )}
            {page.nextAction && (
              <LabelledText label={t("common:fields.nextAction")}>{page.nextAction}</LabelledText>
            )}
          </section>
        )}

        {(facts.goal || facts.method || facts.lastStudiedAt) && (
          <section className="focus-panel">
            {facts.goal && (
              <LabelledText label={t("pages:learning.goal")}>{facts.goal}</LabelledText>
            )}
            {facts.method && (
              <LabelledText label={t("pages:learning.method")}>{facts.method}</LabelledText>
            )}
            <p className="focus-panel__lead mb-0">
              {facts.lastStudiedAt
                ? t("pages:learning.lastStudied", {
                    when: formatRelativeDay(facts.lastStudiedAt, locale),
                  })
                : t("pages:learning.neverStudied")}
            </p>
          </section>
        )}
      </div>

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
                value={facts.level ?? "beginner"}
                onChange={(event) =>
                  setLearning(page.id, { level: event.target.value as LearningLevel })
                }
              >
                {LEVELS.map((option) => (
                  <option key={option} value={option}>
                    {t(`pages:learning.levels.${option}`)}
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
          </div>

          <div className="focus-field-row mt-2">
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
        </section>
      )}

      {(notes.length > 0 || isEditing) && (
        <section className="focus-section focus-section--full mt-3">
          <h2 className="focus-section-title">{t("pages:notes.title")}</h2>
          <ProjectNotes
            notes={notes}
            isEditing={isEditing}
            onChange={(next) => setNotes(page.id, next)}
          />
        </section>
      )}

      <section className="focus-section focus-section--full mt-3">
        <h2 className="focus-section-title">{t("pages:learning.refresher")}</h2>
        <p className="focus-panel__lead">{t("pages:learning.refresherHint")}</p>
        <ChecklistSection ownerId={ownerId} mode={isEditing ? "edit" : "view"} />
      </section>

      {related.length > 0 && (
        <section className="focus-section focus-section--full mt-3">
          <h2 className="focus-section-title">{t("pages:learning.resources")}</h2>
          <RelatedLinks items={related} initial={3} />
        </section>
      )}

      <div className="mt-3">
        <InfoNote>{t("pages:learning.noLms")}</InfoNote>
      </div>
    </div>
  );
}
