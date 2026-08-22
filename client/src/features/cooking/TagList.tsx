import { Icon } from "../../components/ui/Icon";

interface TagListProps {
  tags: string[];
  /** Show at most this many, then "+N". Omit to show all of them. */
  limit?: number;
  /** Present when tags can be removed. */
  onRemove?: (tag: string) => void;
  /** Present when tags filter something. */
  onSelect?: (tag: string) => void;
  removeLabel?: (tag: string) => string;
  activeTag?: string | null;
}

/**
 * Tags — the user's own words, never translated, and never called hashtags.
 * A `#` prefix would imply a global namespace this app does not have.
 */
export function TagList({
  tags,
  limit,
  onRemove,
  onSelect,
  removeLabel,
  activeTag,
}: TagListProps) {
  if (tags.length === 0) return null;

  const visible = limit === undefined ? tags : tags.slice(0, limit);
  const hidden = tags.length - visible.length;

  return (
    <ul className="list-unstyled focus-tags mb-0">
      {visible.map((tag) => (
        <li key={tag}>
          <span className={`focus-tag ${activeTag === tag ? "is-active" : ""}`}>
            {onSelect ? (
              <button type="button" className="focus-tag__button" onClick={() => onSelect(tag)} dir="auto">
                <Icon name="tag" size={11} />
                {tag}
              </button>
            ) : (
              <span className="focus-tag__button" dir="auto">
                <Icon name="tag" size={11} />
                {tag}
              </span>
            )}
            {onRemove && (
              <button
                type="button"
                className="focus-tag__remove"
                onClick={() => onRemove(tag)}
                aria-label={removeLabel ? removeLabel(tag) : tag}
              >
                <Icon name="plus" size={11} className="focus-tag__x" />
              </button>
            )}
          </span>
        </li>
      ))}
      {hidden > 0 && (
        <li>
          <span className="focus-tag focus-tag--more" title={tags.slice(visible.length).join(", ")}>
            <span className="focus-tag__button">+{hidden}</span>
          </span>
        </li>
      )}
    </ul>
  );
}
