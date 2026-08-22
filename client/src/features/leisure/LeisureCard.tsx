import { useTranslation } from "react-i18next";
import { THUMBS } from "../../assets/thumbs";
import { Icon } from "../../components/ui/Icon";
import { ExternalLink } from "../../components/ui/ExternalLink";
import { isImageUrl } from "../../lib/links";
import type { LeisureItem } from "../../types";

interface LeisureCardProps {
  item: LeisureItem;
  onEdit: (item: LeisureItem) => void;
  onPlan: (id: string) => void;
  onDone: (id: string) => void;
}

/** At most three tags, then a count — the rule recipe cards already follow. */
const TAG_LIMIT = 3;

/**
 * One idea, compact.
 *
 * A small picture, the name, the kind, up to three tags and one action. There
 * is deliberately no description in this view: a list is for *finding* the
 * thing, and a paragraph on every card turns twelve ideas into a page of prose
 * nobody scrolls to the bottom of.
 *
 * No minimum height, and nothing stretches to match a neighbour.
 */
export function LeisureCard({ item, onEdit, onPlan, onDone }: LeisureCardProps) {
  const { t } = useTranslation(["leisure", "common"]);

  const artwork = item.thumb ? THUMBS[item.thumb] : undefined;
  const picture = isImageUrl(item.imageUrl) ? item.imageUrl : artwork;

  const tags = item.tags.slice(0, TAG_LIMIT);
  const hidden = item.tags.length - tags.length;

  return (
    <article className="focus-profile-card">
      {picture && (
        <img
          className="focus-leisure-thumb"
          src={picture}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      )}

      <div className="focus-profile-card__body">
        <p className="focus-dense-row__eyebrow">{t(`leisure:kinds.${item.kind}`)}</p>
        <h3 className="focus-profile-card__name" dir="auto">
          {item.url ? <ExternalLink href={item.url}>{item.title}</ExternalLink> : item.title}
        </h3>

        <p className="focus-profile-card__relation">
          {[
            item.minutes !== undefined
              ? `${item.minutes} ${t("leisure:fields.minutesUnit")}`
              : undefined,
            item.energy ? t(`leisure:energy.${item.energy}`) : undefined,
            item.place ? t(`leisure:place.${item.place}`) : undefined,
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>

        {tags.length > 0 && (
          <p className="focus-profile-card__relation" dir="auto">
            {tags.join(" · ")}
            {hidden > 0 && ` +${hidden}`}
          </p>
        )}
      </div>

      <div className="focus-dense-row__actions">
        {item.status !== "done" && (
          <button
            type="button"
            className="focus-icon-button btn btn-sm btn-link text-secondary"
            aria-label={`${t("leisure:actions.markDone")} — ${item.title}`}
            onClick={() => onDone(item.id)}
          >
            <Icon name="check" size={16} />
          </button>
        )}
        {item.status === "idea" && (
          <button
            type="button"
            className="focus-icon-button btn btn-sm btn-link text-secondary"
            aria-label={`${t("leisure:actions.plan")} — ${item.title}`}
            onClick={() => onPlan(item.id)}
          >
            <Icon name="star" size={16} />
          </button>
        )}
        <button
          type="button"
          className="focus-icon-button btn btn-sm btn-link text-secondary"
          aria-label={t("common:actions.editNamed", { name: item.title })}
          onClick={() => onEdit(item)}
        >
          <Icon name="edit" size={16} />
        </button>
      </div>
    </article>
  );
}
