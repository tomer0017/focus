import { useState } from "react";
import { useTranslation } from "react-i18next";
import { THUMBS } from "../../assets/thumbs";
import { ExternalLink } from "./ExternalLink";
import { Icon } from "./Icon";
import { isExternalUrl } from "../../lib/links";
import type { SavedItem } from "../../types";

interface RelatedLinksProps {
  items: SavedItem[];
  /** How many to show before "show N more". */
  initial?: number;
}

/**
 * Attached links, as a dense list rather than a wall of cards.
 *
 * Seven links used to mean seven full-width cards, which pushed the recipe off
 * the screen and left a column of white beside them. A link's whole job here is
 * to be recognised and clicked, and a row — thumbnail, name, where it came
 * from — does that in a fifth of the height. There is no description and no
 * metadata beyond the source the user chose, because none of it helps you
 * decide whether to click.
 *
 * The list is capped and grows on request: the common case is two or three, and
 * the case that hurt was the recipe with seven.
 */
export function RelatedLinks({ items, initial = 4 }: RelatedLinksProps) {
  const { t } = useTranslation(["common"]);
  const [expanded, setExpanded] = useState(false);

  if (items.length === 0) return null;

  const shown = expanded ? items : items.slice(0, initial);
  const hidden = items.length - shown.length;

  return (
    <>
      <ul className="list-unstyled focus-related mb-0">
        {shown.map((item) => (
          <li key={item.id} className="focus-related__row">
            <img
              className="focus-related__thumb"
              src={THUMBS[item.thumb]}
              alt=""
              loading="lazy"
            />
            <span className="focus-related__body">
              <span className="focus-related__title" dir="auto">
                {isExternalUrl(item.url) ? (
                  <ExternalLink href={item.url}>{item.title}</ExternalLink>
                ) : (
                  /* No honest destination, so no link at all — plain text and
                     a badge saying why. A link that goes nowhere is worse than
                     no link. See CLAUDE.md → Links. */
                  item.title
                )}
              </span>
              <span className="focus-related__meta">
                <span className="focus-source">{t(`common:sources.${item.source}`)}</span>
                {!isExternalUrl(item.url) && (
                  <span className="focus-related__nolink">
                    <Icon name="alert" size={11} />
                    {t("common:mock.noLink")}
                  </span>
                )}
              </span>
              {/* One line, and only when there is one. */}
              {item.note && (
                <span className="focus-related__note focus-clamp-1" dir="auto">
                  {item.note}
                </span>
              )}
            </span>
          </li>
        ))}
      </ul>

      {hidden > 0 && (
        <button
          type="button"
          className="focus-related__more"
          onClick={() => setExpanded(true)}
        >
          {t("common:actions.showMore", { count: hidden })}
        </button>
      )}
    </>
  );
}
