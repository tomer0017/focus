import { useState } from "react";
import { useTranslation } from "react-i18next";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import { Icon } from "./Icon";
import { ExternalLink } from "./ExternalLink";
import { DemoBadgeInline } from "./DemoBadgeInline";
import { THUMBS } from "../../assets/thumbs";
import { useLocale } from "../../i18n/useLocale";
import { formatDate, formatRelativeDay } from "../../lib/format";
import { isExternalUrl } from "../../lib/links";
import type { SavedItem } from "../../types";

/**
 * A saved link, product, clip or document.
 *
 * Two kinds of card, and the difference is visible: an item with a real
 * destination is an external link, marked with an icon and opened in a new tab;
 * an item without one opens an internal preview instead. It never pretends to
 * have a link it does not have.
 *
 * The thumbnail is local artwork and the source is the user's own answer to
 * "where did I get this?" — nothing is fetched from TikTok, YouTube, Instagram
 * or Pinterest, and no metadata is requested from any of them.
 */
export function SavedItemCard({ item }: { item: SavedItem }) {
  const { t } = useTranslation(["common"]);
  const { locale } = useLocale();
  const [preview, setPreview] = useState(false);

  const hasLink = isExternalUrl(item.url);

  return (
    <>
      <article className="focus-saved">
        <img
          className="focus-saved__thumb"
          src={THUMBS[item.thumb]}
          alt=""
          width={320}
          height={180}
          loading="lazy"
        />
        <div className="focus-saved__body">
          <p className="focus-saved__eyebrow">
            <span>{t(`common:savedKinds.${item.kind}`)}</span>
            <span className="focus-source">{t(`common:sources.${item.source}`)}</span>
          </p>

          <h3 className="focus-saved__title" dir="auto">
            {hasLink ? (
              <ExternalLink href={item.url as string} stretched>
                {item.title}
              </ExternalLink>
            ) : (
              <button
                type="button"
                className="focus-saved__open stretched-link"
                onClick={() => setPreview(true)}
              >
                {item.title}
              </button>
            )}
          </h3>

          {item.note && (
            <p className="focus-saved__note" dir="auto">
              {item.note}
            </p>
          )}

          <p className="focus-saved__foot mb-0">
            <time dateTime={item.savedAt}>{formatRelativeDay(item.savedAt, locale)}</time>
            {item.category ? (
              <span className="focus-saved__category" dir="auto">
                {item.category}
              </span>
            ) : null}
            {hasLink ? (
              <span className="focus-saved__cta" aria-hidden="true">
                {t("common:actions.open")}
                <Icon name="external" size={13} />
              </span>
            ) : (
              <DemoBadgeInline />
            )}
          </p>
        </div>
      </article>

      {/* Internal detail for an item with nowhere to send you. */}
      <Modal show={preview} onHide={() => setPreview(false)} centered>
        <Modal.Header closeButton closeLabel={t("common:actions.close")}>
          <Modal.Title as="h2" className="h6" dir="auto">
            {item.title}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <img
            className="focus-preview__image"
            src={THUMBS[item.thumb]}
            alt=""
            width={320}
            height={180}
          />
          <dl className="focus-brief__facts mt-3 mb-0">
            <div className="focus-fact">
              <dt className="focus-fact__label">{t("common:savedKinds.label")}</dt>
              <dd className="focus-fact__value mb-0">{t(`common:savedKinds.${item.kind}`)}</dd>
            </div>
            <div className="focus-fact">
              <dt className="focus-fact__label">{t("common:fields.source")}</dt>
              <dd className="focus-fact__value mb-0">{t(`common:sources.${item.source}`)}</dd>
            </div>
            {item.category && (
              <div className="focus-fact">
                <dt className="focus-fact__label">{t("common:fields.category")}</dt>
                <dd className="focus-fact__value mb-0" dir="auto">
                  {item.category}
                </dd>
              </div>
            )}
            <div className="focus-fact">
              <dt className="focus-fact__label">{t("common:fields.saved")}</dt>
              <dd className="focus-fact__value mb-0">{formatDate(item.savedAt, locale)}</dd>
            </div>
            {item.note && (
              <div className="focus-fact focus-fact--wide">
                <dt className="focus-fact__label">{t("common:fields.note")}</dt>
                <dd className="focus-fact__value mb-0" dir="auto">
                  {item.note}
                </dd>
              </div>
            )}
          </dl>
          <p className="form-text mb-0">{t("common:mock.noLinkHint")}</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" size="sm" onClick={() => setPreview(false)}>
            {t("common:actions.close")}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
