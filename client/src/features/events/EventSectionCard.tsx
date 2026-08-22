import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Button from "react-bootstrap/Button";
import { Icon } from "../../components/ui/Icon";
import { SavedItemCard } from "../../components/ui/SavedItemCard";
import { Checklist } from "../../components/ui/Checklist";
import { checklistAsTasks, sectionAsChecklist } from "../../lib/eventChecklist";
import { BoardImage } from "../../components/ui/BoardImage";
import { THUMBS } from "../../assets/thumbs";
import { useLocale } from "../../i18n/useLocale";
import { formatNumber } from "../../lib/format";
import { isListSection } from "../../lib/eventTemplates";
import type { CollectionEntry, EventSection, SavedItem, VisionBoard } from "../../types";

interface EventSectionCardProps {
  section: EventSection;
  /** `view` hides every structural control; boxes stay tickable. */
  mode: "view" | "edit";
  savedItems: SavedItem[];
  collectionEntries: CollectionEntry[];
  visionBoards: VisionBoard[];
  isFirst: boolean;
  isLast: boolean;
  onPatch: (patch: Partial<EventSection>) => void;
  onMove: (direction: -1 | 1) => void;
  onRemove: () => void;
}

/**
 * One section of an event.
 *
 * The section's name comes from its `kind` until the user renames it, which is
 * why a template can be seeded in either language and still read correctly in
 * the other. Reference sections point at saved items and recipes by id — an
 * event never gets its own copy of a recipe that already exists.
 */
export function EventSectionCard({
  section,
  mode,
  savedItems,
  collectionEntries,
  visionBoards,
  isFirst,
  isLast,
  onPatch,
  onMove,
  onRemove,
}: EventSectionCardProps) {
  const { t } = useTranslation(["events", "common"]);
  const { locale } = useLocale();
  const editable = mode === "edit";
  const [renaming, setRenaming] = useState(false);
  const [draftTitle, setDraftTitle] = useState(section.titleOverride ?? "");
  const [pick, setPick] = useState("");

  const title = section.titleOverride ?? t(`events:sectionKinds.${section.kind}`);
  const linkedSaved = savedItems.filter((item) => section.savedItemIds?.includes(item.id));
  const linkedRecipes = collectionEntries.filter((entry) =>
    section.collectionEntryIds?.includes(entry.id)
  );

  const renderList = () => (
    <Checklist
      checklist={sectionAsChecklist(section)}
      mode={mode}
      hideProgress={false}
      hideGroupChrome
      onChange={(change) =>
        onPatch({ items: checklistAsTasks(change(sectionAsChecklist(section))) })
      }
    />
  );

  const renderSavedPicker = (candidates: SavedItem[]) => (
    <form
      className="focus-inline-form mt-2"
      onSubmit={(event) => {
        event.preventDefault();
        if (!pick) return;
        onPatch({ savedItemIds: [...(section.savedItemIds ?? []), pick] });
        setPick("");
      }}
    >
      <label className="visually-hidden" htmlFor={`pick-${section.id}`}>
        {t("events:linkSaved")}
      </label>
      <select
        id={`pick-${section.id}`}
        className="form-select form-select-sm"
        value={pick}
        onChange={(event) => setPick(event.target.value)}
      >
        <option value="">{t("events:linkSaved")}</option>
        {candidates.map((item) => (
          <option key={item.id} value={item.id}>
            {item.title}
          </option>
        ))}
      </select>
      <Button type="submit" variant="outline-primary" size="sm" disabled={!pick}>
        {t("events:add")}
      </Button>
    </form>
  );

  const renderReferences = () => {
    const candidates = savedItems.filter((item) => !section.savedItemIds?.includes(item.id));
    return (
      <>
        {linkedSaved.length === 0 && !editable && (
          <p className="focus-tab-empty mb-0">{t("events:nothingLinked")}</p>
        )}
        {linkedSaved.length > 0 && (
          <ul className="list-unstyled focus-grid focus-grid--saved mb-0">
            {linkedSaved.map((item) => (
              <li key={item.id}>
                <div className="focus-linked">
                  <SavedItemCard item={item} />
                  {editable && (
                  <button
                    type="button"
                    className="focus-unlink"
                    onClick={() =>
                      onPatch({
                        savedItemIds: (section.savedItemIds ?? []).filter((id) => id !== item.id),
                      })
                    }
                  >
                    <Icon name="trash" size={13} />
                    {t("events:unlink")}
                  </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
        {editable && renderSavedPicker(candidates)}
      </>
    );
  };

  const renderRecipes = () => {
    const candidates = collectionEntries.filter(
      (entry) => !section.collectionEntryIds?.includes(entry.id)
    );
    return (
      <>
        {linkedRecipes.length > 0 && (
          <ul className="list-unstyled focus-grid focus-grid--saved mb-0">
            {linkedRecipes.map((entry) => (
              <li key={entry.id}>
                <div className="focus-linked">
                  <article className="focus-saved">
                    <img
                      className="focus-saved__thumb"
                      src={THUMBS[entry.thumb]}
                      alt=""
                      width={320}
                      height={180}
                      loading="lazy"
                    />
                    <div className="focus-saved__body">
                      <p className="focus-saved__eyebrow">
                        <span>{t("events:sectionKinds.recipes")}</span>
                      </p>
                      <h4 className="focus-saved__title" dir="auto">
                        <Link to={`/pages/${entry.pageId}`}>{entry.title}</Link>
                      </h4>
                      {entry.note && (
                        <p className="focus-saved__note" dir="auto">
                          {entry.note}
                        </p>
                      )}
                    </div>
                  </article>
                  {editable && (
                    <button
                      type="button"
                      className="focus-unlink"
                      onClick={() =>
                        onPatch({
                          collectionEntryIds: (section.collectionEntryIds ?? []).filter(
                            (id) => id !== entry.id
                          ),
                        })
                      }
                    >
                      <Icon name="trash" size={13} />
                      {t("events:unlink")}
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}

        {editable && (
        <form
          className="focus-inline-form mt-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (!pick) return;
            onPatch({ collectionEntryIds: [...(section.collectionEntryIds ?? []), pick] });
            setPick("");
          }}
        >
          <label className="visually-hidden" htmlFor={`recipe-${section.id}`}>
            {t("events:linkRecipe")}
          </label>
          <select
            id={`recipe-${section.id}`}
            className="form-select form-select-sm"
            value={pick}
            onChange={(event) => setPick(event.target.value)}
          >
            <option value="">{t("events:linkRecipe")}</option>
            {candidates.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.title}
              </option>
            ))}
          </select>
          <Button type="submit" variant="outline-primary" size="sm" disabled={!pick}>
            {t("events:add")}
          </Button>
        </form>
        )}
      </>
    );
  };

  const renderVision = () => {
    const board = visionBoards.find((entry) => entry.id === section.visionBoardId);
    if (!board) {
      return <p className="focus-tab-empty mb-0">{t("events:noBoard")}</p>;
    }
    return (
      <div>
        <ul className="list-unstyled focus-vision-strip mb-2">
          {board.tiles.slice(0, 4).map((tile) => (
            <li key={tile.id}>
              <BoardImage imageUrl={tile.imageUrl} thumb={tile.thumb} />
              {tile.caption && <span dir="auto">{tile.caption}</span>}
            </li>
          ))}
        </ul>
        <Link to="/vision" className="focus-section-action">
          {t("events:openBoard")}
        </Link>
      </div>
    );
  };

  const renderBudget = () =>
    !editable ? (
      <div>
        {section.amount !== undefined && (
          <p className="focus-budget__amount mb-1">{formatNumber(section.amount, locale)}</p>
        )}
        {section.body ? (
          <p className="mb-0" dir="auto">
            {section.body}
          </p>
        ) : (
          section.amount === undefined && (
            <p className="focus-tab-empty mb-0">{t("events:nothingYet")}</p>
          )
        )}
      </div>
    ) : (
    <div>
      <label className="form-label fw-medium" htmlFor={`budget-${section.id}`}>
        {t("events:budgetAmount")}
      </label>
      <input
        id={`budget-${section.id}`}
        type="number"
        min={0}
        className="form-control focus-number"
        value={section.amount ?? ""}
        onChange={(event) =>
          onPatch({ amount: event.target.value === "" ? undefined : Number(event.target.value) })
        }
      />
      {section.amount !== undefined && (
        <p className="focus-fact__value mt-1 mb-2">{formatNumber(section.amount, locale)}</p>
      )}
      <textarea
        className="form-control"
        rows={2}
        dir="auto"
        aria-label={t("events:notesFor", { name: title })}
        value={section.body ?? ""}
        onChange={(event) => onPatch({ body: event.target.value })}
      />
    </div>
    );

  const renderBody = () =>
    editable ? (
      <textarea
        className="form-control"
        rows={3}
        dir="auto"
        aria-label={t("events:notesFor", { name: title })}
        value={section.body ?? ""}
        onChange={(event) => onPatch({ body: event.target.value })}
      />
    ) : section.body ? (
      <p className="focus-section-text mb-0" dir="auto">
        {section.body}
      </p>
    ) : (
      <p className="focus-tab-empty mb-0">{t("events:nothingYet")}</p>
    );

  const renderContent = () => {
    if (isListSection(section.kind)) return renderList();
    switch (section.kind) {
      case "budget":
        return renderBudget();
      case "recipes":
        return renderRecipes();
      case "vision":
        return renderVision();
      case "links":
      case "inspiration":
        return renderReferences();
      case "decor":
      case "food":
        return (
          <>
            {renderBody()}
            <div className="mt-2">{renderReferences()}</div>
          </>
        );
      default:
        return renderBody();
    }
  };

  return (
    <section className="focus-event-section">
      <header className="focus-event-section__head">
        {renaming && editable ? (
          <form
            className="focus-inline-form flex-grow-1"
            onSubmit={(event) => {
              event.preventDefault();
              onPatch({ titleOverride: draftTitle.trim() || undefined });
              setRenaming(false);
            }}
          >
            <label className="visually-hidden" htmlFor={`rename-${section.id}`}>
              {t("events:renameSection")}
            </label>
            <input
              id={`rename-${section.id}`}
              className="form-control form-control-sm"
              value={draftTitle}
              dir="auto"
              autoFocus
              onChange={(event) => setDraftTitle(event.target.value)}
            />
            <Button type="submit" size="sm" variant="outline-primary">
              {t("common:actions.save")}
            </Button>
          </form>
        ) : (
          <h3 className="focus-event-section__title mb-0" dir="auto">
            {title}
          </h3>
        )}

        {editable && (
        <div className="focus-event-section__controls">
          <button
            type="button"
            className="focus-icon-button border"
            onClick={() => {
              setDraftTitle(section.titleOverride ?? title);
              setRenaming((current) => !current);
            }}
            aria-label={t("events:renameSectionNamed", { name: title })}
          >
            <Icon name="edit" size={14} />
          </button>
          <button
            type="button"
            className="focus-icon-button border"
            disabled={isFirst}
            onClick={() => onMove(-1)}
            aria-label={t("events:moveSectionUp", { name: title })}
          >
            <Icon name="chevronUp" size={14} />
          </button>
          <button
            type="button"
            className="focus-icon-button border"
            disabled={isLast}
            onClick={() => onMove(1)}
            aria-label={t("events:moveSectionDown", { name: title })}
          >
            <Icon name="chevronDown" size={14} />
          </button>
          <button
            type="button"
            className="focus-icon-button border"
            onClick={onRemove}
            aria-label={t("events:removeSection", { name: title })}
          >
            <Icon name="trash" size={14} />
          </button>
        </div>
        )}
      </header>

      <div className="focus-event-section__body">{renderContent()}</div>
    </section>
  );
}
