import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Button from "react-bootstrap/Button";
import { usePages } from "../../state/pagesContext";
import { useEvents } from "../../state/eventsContext";
import { useLocale } from "../../i18n/useLocale";
import { formatDate, formatRelativeDay } from "../../lib/format";
import { RECIPE_GROUPS, groupOf, totalMinutes, type RecipeGroup } from "../../lib/recipes";
import { Icon } from "../../components/ui/Icon";
import { BackButton } from "../../components/ui/BackButton";
import { PageHeader } from "../../components/ui/PageHeader";
import { BoardImage } from "../../components/ui/BoardImage";
import { ExternalLink } from "../../components/ui/ExternalLink";
import { RelatedLinks } from "../../components/ui/RelatedLinks";
import { SegmentedNav } from "../../components/ui/SegmentedNav";
import { ErrorState } from "../../components/ui/ErrorState";
import { Section } from "../sections/Section";
import { TagList } from "./TagList";
import { RatingInput, RatingStars } from "./RatingInput";
import { isExternalUrl } from "../../lib/links";

/**
 * One recipe: how to make it, what you thought of it, and what is attached.
 *
 * The personal half is the reason this page exists. Any website has the
 * ingredients; only this holds "what to change next time", which is the line
 * you actually want on the second attempt.
 */
/** The three things the personal column holds, one at a time. */
type SidePanel = "personal" | "tags" | "related";

export function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation(["cooking", "common", "dashboard"]);
  const { locale } = useLocale();
  const { collectionEntries, savedItems, getPage, updateEntry, moveEntry } = usePages();
  const { events } = useEvents();
  const [newTag, setNewTag] = useState("");
  /*
   * The personal half opens read-only. A rating widget, two open textareas and
   * a tag input on arrival is a form, and a recipe you are about to cook from
   * should not be a form.
   */
  const [editingNotes, setEditingNotes] = useState(false);
  const [side, setSide] = useState<SidePanel>("personal");

  const entry = collectionEntries.find((candidate) => candidate.id === id);

  const attached = useMemo(
    () => savedItems.filter((item) => entry?.savedItemIds?.includes(item.id)),
    [savedItems, entry]
  );

  /** Events that reference this recipe — never a copy of it. */
  const usedIn = useMemo(
    () =>
      events.filter((event) =>
        event.sections.some((section) => section.collectionEntryIds?.includes(id ?? ""))
      ),
    [events, id]
  );

  if (!entry) {
    return (
      <div className="focus-detail">
        <div className="mb-3">
          <BackButton />
        </div>
        <ErrorState
          title={t("common:errors.pageNotFoundTitle")}
          message={t("common:errors.pageNotFoundMessage", { id: id ?? "" })}
        />
      </div>
    );
  }

  const collection = getPage(entry.pageId);
  const minutes = totalMinutes(entry);

  return (
    <div className="focus-detail">
      <PageHeader
        before={<BackButton />}
        title={entry.title}
        titleIsUserContent
        meta={
          <>
            <span className="focus-chip focus-chip--muted">
              {t(`cooking:groups.${groupOf(entry)}`)}
            </span>
            {collection && (
              <Link to={`/pages/${collection.id}`} className="focus-chip focus-chip--primary">
                {collection.title}
              </Link>
            )}
            {entry.lastDoneAt && (
              <span className="text-secondary small">
                <time dateTime={entry.lastDoneAt}>
                  {t("cooking:lastMade", { when: formatRelativeDay(entry.lastDoneAt, locale) })}
                </time>
              </span>
            )}
          </>
        }
        action={
          /* Logging that you cooked it is a one-tap fact, not structural
             editing — the same call as "mark today's session" in Training. */
          <Button
            variant="outline-primary"
            size="sm"
            onClick={() =>
              updateEntry(entry.id, { lastDoneAt: new Date().toISOString(), status: "tried" })
            }
          >
            <Icon name="check" size={15} />
            {t("cooking:madeItToday")}
          </Button>
        }
      />

      <div className="focus-recipe">
        <div className="focus-recipe__main">
          <BoardImage
            className="focus-recipe__image"
            imageUrl={entry.imageUrl}
            thumb={entry.thumb}
          />

          {entry.description && (
            <p className="focus-recipe__description" dir="auto">
              {entry.description}
            </p>
          )}

          <dl className="focus-recipe__stats">
            {entry.prepMinutes !== undefined && (
              <div>
                <dt>{t("cooking:prepTime")}</dt>
                <dd>{t("cooking:minutes", { count: entry.prepMinutes })}</dd>
              </div>
            )}
            {entry.cookMinutes !== undefined && (
              <div>
                <dt>{t("cooking:cookTime")}</dt>
                <dd>{t("cooking:minutes", { count: entry.cookMinutes })}</dd>
              </div>
            )}
            {minutes !== null && (
              <div>
                <dt>{t("cooking:totalTime")}</dt>
                <dd>{t("cooking:minutes", { count: minutes })}</dd>
              </div>
            )}
            {entry.servings !== undefined && (
              <div>
                <dt>{t("cooking:servings")}</dt>
                <dd>{t("cooking:servingsCount", { count: entry.servings })}</dd>
              </div>
            )}
          </dl>

          <Section
            title={t("cooking:ingredients")}
            hasContent={(entry.ingredients?.length ?? 0) > 0}
          >
            <ul className="focus-recipe__list" dir="auto">
              {entry.ingredients?.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </Section>

          <Section title={t("cooking:steps")} hasContent={(entry.steps?.length ?? 0) > 0}>
            <ol className="focus-recipe__list focus-recipe__list--steps" dir="auto">
              {entry.steps?.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ol>
          </Section>
        </div>

        <aside className="focus-recipe__side">
          {/*
            The personal half, behind a switch.
            
            Notes, tags, the source and attached links are four things you
            consult *after* deciding to cook — and as four stacked panels they
            ran a long way past the method beside them, which is the one thing
            the screen exists to show. One at a time keeps the column the same
            height as the recipe.
          */}
          <SegmentedNav
            label={t("cooking:sideLabel")}
            items={[
              { id: "personal", label: t("cooking:personal") },
              { id: "tags", label: t("cooking:tags") },
              {
                id: "related",
                label: t("cooking:related"),
                badge: attached.length > 0 ? String(attached.length) : undefined,
              },
            ]}
            value={side}
            onChange={(id) => setSide(id as SidePanel)}
            variant="pills"
          />
          {side === "personal" && (
          <section className="focus-brief__panel">
            <div className="focus-panel-head">
              <h2 className="focus-brief__panel-title mb-0">{t("cooking:personal")}</h2>
              <Button
                variant={editingNotes ? "primary" : "link"}
                size="sm"
                onClick={() => setEditingNotes((current) => !current)}
              >
                <Icon name={editingNotes ? "check" : "edit"} size={14} />
                {editingNotes ? t("cooking:doneEditingNotes") : t("cooking:editNotes")}
              </Button>
            </div>

            {editingNotes ? (
              <>
                <div className="mb-3">
                  <label className="focus-labelled__label" htmlFor="recipe-detail-group">
                    {t("cooking:groupFor", { name: entry.title })}
                  </label>
                  <select
                    id="recipe-detail-group"
                    className="form-select form-select-sm"
                    value={groupOf(entry)}
                    onChange={(event) => moveEntry(entry.id, event.target.value as RecipeGroup)}
                  >
                    {RECIPE_GROUPS.map((group) => (
                      <option key={group} value={group}>
                        {t(`cooking:groups.${group}`)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-check form-switch mb-3">
                  <input
                    id="recipe-recommended"
                    type="checkbox"
                    role="switch"
                    className="form-check-input"
                    checked={entry.recommended}
                    onChange={(event) =>
                      moveEntry(entry.id, event.target.checked ? "recommended" : "tried")
                    }
                  />
                  <label htmlFor="recipe-recommended" className="form-check-label">
                    {t("cooking:markRecommended")}
                  </label>
                </div>

                <RatingInput
                  value={entry.rating}
                  label={t("cooking:rating")}
                  onChange={(rating) => updateEntry(entry.id, { rating })}
                />

                <div className="mt-3">
                  <label htmlFor="recipe-note" className="focus-labelled__label">
                    {t("cooking:importantNote")}
                  </label>
                  <textarea
                    id="recipe-note"
                    className="form-control"
                    rows={2}
                    dir="auto"
                    value={entry.note ?? ""}
                    onChange={(event) => updateEntry(entry.id, { note: event.target.value })}
                  />
                </div>

                <div className="mt-3">
                  <label htmlFor="recipe-next-time" className="focus-labelled__label">
                    {t("cooking:nextTime")}
                  </label>
                  <textarea
                    id="recipe-next-time"
                    className="form-control"
                    rows={2}
                    dir="auto"
                    value={entry.nextTime ?? ""}
                    onChange={(event) => updateEntry(entry.id, { nextTime: event.target.value })}
                  />
                </div>

                <p className="form-text mt-2 mb-0">{t("cooking:editHint")}</p>
              </>
            ) : (
              <dl className="focus-recipe__personal mb-0">
                <div>
                  <dt>{t("cooking:status")}</dt>
                  <dd>{t(`cooking:groups.${groupOf(entry)}`)}</dd>
                </div>
                <div>
                  <dt>{t("cooking:rating")}</dt>
                  <dd>
                    {entry.rating === undefined ? (
                      t("cooking:noRating")
                    ) : (
                      <RatingStars value={entry.rating} />
                    )}
                  </dd>
                </div>
                {entry.note && (
                  <div className="focus-recipe__personal-wide">
                    <dt>{t("cooking:importantNote")}</dt>
                    <dd dir="auto">{entry.note}</dd>
                  </div>
                )}
                {entry.nextTime && (
                  <div className="focus-recipe__personal-wide">
                    <dt>{t("cooking:nextTime")}</dt>
                    <dd dir="auto">{entry.nextTime}</dd>
                  </div>
                )}
                {entry.lastDoneAt && (
                  <div>
                    <dt>{t("cooking:lastMadeLabel")}</dt>
                    <dd>{formatDate(entry.lastDoneAt, locale)}</dd>
                  </div>
                )}
              </dl>
            )}
          </section>
          )}

          {side === "tags" && (
          <section className="focus-brief__panel">
            <h2 className="focus-brief__panel-title">{t("cooking:tags")}</h2>
            <TagList
              tags={entry.tags}
              onRemove={
                editingNotes
                  ? (tag) =>
                      updateEntry(entry.id, { tags: entry.tags.filter((value) => value !== tag) })
                  : undefined
              }
              removeLabel={(tag) => t("cooking:removeTag", { tag })}
            />
            {editingNotes && (
            <form
              className="focus-inline-form mt-2"
              onSubmit={(event) => {
                event.preventDefault();
                const value = newTag.trim();
                if (!value || entry.tags.includes(value)) {
                  setNewTag("");
                  return;
                }
                updateEntry(entry.id, { tags: [...entry.tags, value] });
                setNewTag("");
              }}
            >
              <label className="visually-hidden" htmlFor="recipe-new-tag">
                {t("cooking:addTag")}
              </label>
              <input
                id="recipe-new-tag"
                className="form-control form-control-sm"
                dir="auto"
                list="recipe-tag-options"
                placeholder={t("cooking:addTag")}
                value={newTag}
                onChange={(event) => setNewTag(event.target.value)}
              />
              <datalist id="recipe-tag-options">
                {[...new Set(collectionEntries.flatMap((candidate) => candidate.tags))].map((tag) => (
                  <option key={tag} value={tag} />
                ))}
              </datalist>
              <Button type="submit" size="sm" variant="outline-primary">
                {t("cooking:add")}
              </Button>
            </form>
            )}
          </section>
          )}

          {side === "related" && (
          <>
          {isExternalUrl(entry.sourceUrl) && (
            <section className="focus-brief__panel">
              <h2 className="focus-brief__panel-title">{t("cooking:source")}</h2>
              <ExternalLink href={entry.sourceUrl}>{entry.sourceUrl}</ExternalLink>
            </section>
          )}

          {/*
            * Attached links live in the side column, under the notes and tags.
            * As full-width cards below the recipe, seven of them pushed the
            * method off the screen and left a column of white beside it.
            */}
          {attached.length > 0 && (
            <section className="focus-brief__panel">
              <h2 className="focus-brief__panel-title">{t("cooking:related")}</h2>
              <RelatedLinks items={attached} />
            </section>
          )}

          <Section title={t("cooking:usedIn")} hasContent={usedIn.length > 0}>
            <ul className="list-unstyled focus-linked-events mb-0">
              {usedIn.map((event) => (
                <li key={event.id}>
                  <Link to={`/events/${event.id}`} dir="auto">
                    <Icon name="calendar" size={13} />
                    {event.title}
                  </Link>
                </li>
              ))}
            </ul>
          </Section>
          </>
          )}
        </aside>
      </div>

    </div>
  );
}
