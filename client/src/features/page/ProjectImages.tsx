import { useState } from "react";
import { useTranslation } from "react-i18next";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import { BoardImage } from "../../components/ui/BoardImage";
import { ExternalLink } from "../../components/ui/ExternalLink";
import { Icon } from "../../components/ui/Icon";
import { UrlImageField } from "../../components/ui/UrlImageField";
import { isExternalUrl, normaliseUrl } from "../../lib/links";
import { useLocale } from "../../i18n/useLocale";
import { formatDate } from "../../lib/format";
import type { ProjectProgressImage, SavedItem, ThumbKey } from "../../types";
import type { VisionImagePatch } from "../../state/pagesContext";

/**
 * The two kinds of picture a project has: where it is going, and where it is.
 *
 * A painting wants a reference and a photograph of the canvas as it stands. A
 * living room wants the Pinterest board it is copying and a shot of the corner
 * that still has the old sofa in it. Both are the same mechanism, so both are
 * in this file rather than in two.
 *
 * Only addresses are stored. A source that is a page rather than a picture — a
 * Pinterest board is the usual one — is kept as a link and shown as a link; it
 * is never given a stand-in image, because a drawing in place of somebody's
 * photograph hides the fact that nothing was loaded.
 */

interface PictureSource {
  imageUrl?: string;
  savedItemId?: string;
  linkUrl?: string;
}

/** Clearing all three keeps the sources mutually exclusive on every change. */
const blankSources = { imageUrl: undefined, savedItemId: undefined, linkUrl: undefined };

/** A progress entry with no picture and no link would render an empty card. */
function hasSource(entry: ProjectProgressImage): boolean {
  return Boolean(
    isExternalUrl(entry.imageUrl) || entry.savedItemId || isExternalUrl(entry.linkUrl)
  );
}

/** What a source resolves to: an address to try, and any artwork it was seeded with. */
interface ResolvedPicture {
  imageUrl?: string;
  thumb?: ThumbKey;
}

/**
 * Resolves a source down to what `<BoardImage>` should try.
 *
 * A saved item has no picture of its own — it has a destination and, when it
 * was seeded, a piece of local artwork. Both are handed over: `BoardImage`
 * tries the address first and falls back to the artwork **only** when there is
 * no address at all, which is the rule in CLAUDE.md. Artwork is never
 * substituted for an address that failed to load.
 */
function resolveImage(source: PictureSource, savedItems: SavedItem[]): ResolvedPicture {
  if (source.imageUrl) return { imageUrl: source.imageUrl };
  if (source.savedItemId) {
    const item = savedItems.find((entry) => entry.id === source.savedItemId);
    if (item) return { imageUrl: item.url, thumb: item.thumb };
  }
  return {};
}

/** True when a resolved source has something to draw. */
function hasPicture(picture: ResolvedPicture): boolean {
  return Boolean(picture.imageUrl || picture.thumb);
}

interface PictureFieldsProps {
  idPrefix: string;
  source: PictureSource;
  savedItems: SavedItem[];
  onChange: (source: PictureSource) => void;
}

/**
 * One picker, three sources — typed address, something already saved, or a page
 * link with no picture behind it. They are mutually exclusive on purpose: a
 * picture that could come from two places is a picture nobody can change with
 * confidence.
 */
function PictureFields({ idPrefix, source, savedItems, onChange }: PictureFieldsProps) {
  const { t } = useTranslation(["pages", "common"]);
  // Only items that can supply a picture: a real destination, or artwork they
  // were seeded with. Offering the rest would promise a picture that is not there.
  const withImages = savedItems.filter((item) => isExternalUrl(item.url) || item.thumb);

  return (
    <>
      <UrlImageField
        id={`${idPrefix}-url`}
        label={t("pages:images.addressLabel")}
        hint={t("pages:images.addressHint")}
        value={source.imageUrl ?? ""}
        onChange={(value) => onChange({ imageUrl: value })}
      />

      {withImages.length > 0 && (
        <div className="mb-3">
          <label htmlFor={`${idPrefix}-saved`} className="form-label fw-medium">
            {t("pages:images.fromSaved")}
          </label>
          <select
            id={`${idPrefix}-saved`}
            className="form-select"
            value={source.savedItemId ?? ""}
            onChange={(event) =>
              onChange(event.target.value ? { savedItemId: event.target.value } : {})
            }
          >
            <option value="">{t("pages:images.noneSelected")}</option>
            {withImages.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="mb-3">
        <label htmlFor={`${idPrefix}-link`} className="form-label fw-medium">
          {t("pages:images.pageLink")}
        </label>
        <input
          id={`${idPrefix}-link`}
          type="url"
          className="form-control"
          dir="ltr"
          placeholder="https://"
          value={source.linkUrl ?? ""}
          aria-describedby={`${idPrefix}-link-hint`}
          onChange={(event) => onChange({ linkUrl: event.target.value })}
        />
        <p id={`${idPrefix}-link-hint`} className="form-text mb-0">
          {t("pages:images.pageLinkHint")}
        </p>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ vision */

interface VisionImageProps {
  title: string;
  source: PictureSource;
  savedItems: SavedItem[];
  isEditing: boolean;
  onSave: (patch: VisionImagePatch) => void;
}

export function ProjectVisionImage({
  title,
  source,
  savedItems,
  isEditing,
  onSave,
}: VisionImageProps) {
  const { t } = useTranslation(["pages", "common"]);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<PictureSource>(source);

  const picture = resolveImage(source, savedItems);
  const link = source.linkUrl;
  const hasSomething = hasPicture(picture) || Boolean(link);

  const start = (): void => {
    setDraft(source);
    setOpen(true);
  };

  // Nothing set and nothing to set it with: no empty band on the page.
  if (!hasSomething && !isEditing) return null;

  return (
    <div className="focus-vision-image">
      {hasPicture(picture) && (
        <BoardImage
          imageUrl={picture.imageUrl}
          thumb={picture.thumb}
          className="focus-vision-image__picture"
          alt={t("pages:images.visionAlt", { name: title })}
        />
      )}

      {!hasPicture(picture) && link && (
        <p className="focus-vision-image__link mb-0">
          <Icon name="link" size={16} />
          <ExternalLink href={link}>{t("pages:images.openBoard")}</ExternalLink>
        </p>
      )}

      {isEditing && (
        <div className="focus-vision-image__controls">
          <Button variant="outline-primary" size="sm" onClick={start}>
            <Icon name="image" size={15} />
            {hasSomething ? t("pages:images.replaceVision") : t("pages:images.addVision")}
          </Button>
          {hasSomething && (
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={() => onSave({})}
            >
              {t("pages:images.remove")}
            </Button>
          )}
        </div>
      )}

      <Modal show={open} onHide={() => setOpen(false)} centered scrollable>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            onSave({
              visionImageUrl: normaliseUrl(draft.imageUrl),
              visionSavedItemId: draft.savedItemId,
              visionLinkUrl: normaliseUrl(draft.linkUrl),
            });
            setOpen(false);
          }}
        >
          <Modal.Header closeButton closeLabel={t("common:actions.cancel")}>
            <Modal.Title as="h2" className="h5">
              {t("pages:images.visionTitle")}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <PictureFields
              idPrefix="vision"
              source={draft}
              savedItems={savedItems}
              onChange={setDraft}
            />
            <p className="form-text mb-0">{t("pages:images.storageHint")}</p>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" type="button" onClick={() => setOpen(false)}>
              {t("common:actions.cancel")}
            </Button>
            <Button variant="primary" type="submit">
              {t("common:actions.save")}
            </Button>
          </Modal.Footer>
        </form>
      </Modal>
    </div>
  );
}

/* ---------------------------------------------------------------- progress */

interface ProgressImagesProps {
  images: ProjectProgressImage[];
  savedItems: SavedItem[];
  isEditing: boolean;
  onChange: (images: ProjectProgressImage[]) => void;
}

export function ProjectProgressImages({
  images,
  savedItems,
  isEditing,
  onChange,
}: ProgressImagesProps) {
  const { t } = useTranslation(["pages", "common"]);
  const { locale } = useLocale();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ProjectProgressImage | null>(null);

  const ordered = [...images].sort((a, b) => a.order - b.order);

  const openNew = (): void => {
    const entry: ProjectProgressImage = {
      id: `progress-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
      order: ordered.length,
    };
    setDraft(entry);
    setEditingId(entry.id);
  };

  const commit = (): void => {
    if (!draft) return;
    const exists = ordered.some((entry) => entry.id === draft.id);
    const next = exists
      ? ordered.map((entry) => (entry.id === draft.id ? draft : entry))
      : [...ordered, draft];
    onChange(next.map((entry, index) => ({ ...entry, order: index })));
    setEditingId(null);
    setDraft(null);
  };

  const move = (index: number, direction: -1 | 1): void => {
    const target = index + direction;
    if (target < 0 || target >= ordered.length) return;
    const next = [...ordered];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next.map((entry, position) => ({ ...entry, order: position })));
  };

  if (ordered.length === 0 && !isEditing) return null;

  return (
    <div className="focus-progress-images">
      {ordered.length > 0 && (
        <ul className="list-unstyled focus-grid focus-grid--progress mb-0">
          {ordered.map((entry, index) => {
            const picture = resolveImage(entry, savedItems);
            return (
              <li key={entry.id}>
                <figure className="focus-progress-card">
                  {hasPicture(picture) ? (
                    <BoardImage
                      imageUrl={picture.imageUrl}
                      thumb={picture.thumb}
                      className="focus-progress-card__picture"
                      alt={entry.note ?? ""}
                    />
                  ) : entry.linkUrl ? (
                    <p className="focus-progress-card__link mb-0">
                      <Icon name="link" size={15} />
                      <ExternalLink href={entry.linkUrl}>
                        {t("pages:images.openBoard")}
                      </ExternalLink>
                    </p>
                  ) : (
                    <BoardImage className="focus-progress-card__picture" />
                  )}

                  <figcaption className="focus-progress-card__caption">
                    {entry.capturedAt && (
                      <time className="focus-progress-card__when" dateTime={entry.capturedAt}>
                        {formatDate(entry.capturedAt, locale)}
                      </time>
                    )}
                    {entry.note && (
                      <span className="focus-progress-card__note" dir="auto">
                        {entry.note}
                      </span>
                    )}
                  </figcaption>

                  {isEditing && (
                    <div className="focus-progress-card__actions">
                      <button
                        type="button"
                        className="focus-icon-button border"
                        disabled={index === 0}
                        onClick={() => move(index, -1)}
                        aria-label={t("pages:images.moveEarlier")}
                      >
                        <Icon name="chevronUp" size={15} />
                      </button>
                      <button
                        type="button"
                        className="focus-icon-button border"
                        disabled={index === ordered.length - 1}
                        onClick={() => move(index, 1)}
                        aria-label={t("pages:images.moveLater")}
                      >
                        <Icon name="chevronDown" size={15} />
                      </button>
                      <button
                        type="button"
                        className="focus-icon-button border"
                        onClick={() => {
                          setDraft(entry);
                          setEditingId(entry.id);
                        }}
                        aria-label={t("pages:images.editProgress")}
                      >
                        <Icon name="edit" size={15} />
                      </button>
                      <button
                        type="button"
                        className="focus-icon-button border focus-icon-button--danger"
                        onClick={() =>
                          onChange(
                            ordered
                              .filter((item) => item.id !== entry.id)
                              .map((item, position) => ({ ...item, order: position }))
                          )
                        }
                        aria-label={t("pages:images.removeProgress")}
                      >
                        <Icon name="trash" size={15} />
                      </button>
                    </div>
                  )}
                </figure>
              </li>
            );
          })}
        </ul>
      )}

      {isEditing && (
        <Button variant="outline-primary" size="sm" className="mt-3" onClick={openNew}>
          <Icon name="plus" size={15} />
          {t("pages:images.addProgress")}
        </Button>
      )}

      <Modal
        show={editingId !== null}
        onHide={() => setEditingId(null)}
        centered
        scrollable
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
            commit();
          }}
        >
          <Modal.Header closeButton closeLabel={t("common:actions.cancel")}>
            <Modal.Title as="h2" className="h5">
              {t("pages:images.progressTitle")}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {draft && (
              <>
                <PictureFields
                  idPrefix="progress"
                  source={draft}
                  savedItems={savedItems}
                  onChange={(source) => setDraft({ ...draft, ...blankSources, ...source })}
                />
                <div className="mb-3">
                  <label htmlFor="progress-when" className="form-label fw-medium">
                    {t("pages:images.capturedAt")}
                  </label>
                  <input
                    id="progress-when"
                    type="date"
                    className="form-control"
                    value={draft.capturedAt?.slice(0, 10) ?? ""}
                    onChange={(event) =>
                      setDraft({ ...draft, capturedAt: event.target.value || undefined })
                    }
                  />
                </div>
                <div className="mb-0">
                  <label htmlFor="progress-note" className="form-label fw-medium">
                    {t("pages:images.noteLabel")}
                  </label>
                  <textarea
                    id="progress-note"
                    className="form-control"
                    rows={2}
                    dir="auto"
                    value={draft.note ?? ""}
                    onChange={(event) =>
                      setDraft({ ...draft, note: event.target.value || undefined })
                    }
                  />
                </div>
              </>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" type="button" onClick={() => setEditingId(null)}>
              {t("common:actions.cancel")}
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={!draft || !hasSource(draft)}
            >
              {t("common:actions.save")}
            </Button>
          </Modal.Footer>
        </form>
      </Modal>
    </div>
  );
}
