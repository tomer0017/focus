import { useTranslation } from "react-i18next";
import { Icon } from "../../components/ui/Icon";

interface RatingInputProps {
  value?: number;
  label: string;
  onChange: (rating: number | undefined) => void;
}

const STARS = [1, 2, 3, 4, 5];

/** The same five stars, read-only, for view mode. */
export function RatingStars({ value }: { value: number }) {
  return (
    <span className="focus-rating__stars" aria-hidden="true">
      {STARS.map((star) => (
        <span key={star} className={star <= value ? "is-filled" : ""}>
          <Icon name="star" size={16} />
        </span>
      ))}
    </span>
  );
}

/**
 * A five-point personal rating.
 *
 * Radio buttons under the stars, so it is operable from a keyboard and the
 * current value is announced — a row of clickable icons with no input is the
 * usual version of this control and the usual accessibility failure.
 */
export function RatingInput({ value, label, onChange }: RatingInputProps) {
  const { t } = useTranslation(["cooking"]);

  return (
    <fieldset className="focus-rating">
      <legend className="focus-labelled__label">{label}</legend>
      <div className="focus-rating__stars">
        {STARS.map((star) => (
          <label key={star} className="focus-rating__star">
            <input
              type="radio"
              name="recipe-rating"
              className="visually-hidden"
              checked={value === star}
              onChange={() => onChange(star)}
            />
            <span className={value !== undefined && star <= value ? "is-filled" : ""}>
              <Icon name="star" size={18} />
            </span>
            <span className="visually-hidden">{t("cooking:ratingStars", { count: star })}</span>
          </label>
        ))}
        {value !== undefined && (
          <button type="button" className="focus-summary__undo" onClick={() => onChange(undefined)}>
            {t("cooking:clearRating")}
          </button>
        )}
      </div>
    </fieldset>
  );
}
