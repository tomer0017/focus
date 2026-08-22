import { Avatar, CompactList, CompactRow } from "focus-client";

/**
 * A picture, or the initials — never an empty grey square.
 *
 * Initials are visibly not a photograph, which is the whole reason they are the
 * fallback: substituting artwork would look like somebody's photo and hide the
 * fact that the address is broken. `photoUrl` is an address only, never bytes
 * and never a data URI, and anything that is not a real `http(s)` destination
 * falls straight through to the initials.
 *
 * People and animals go through the same component, because a dog with a vet
 * and a grandmother with a clinic are the same shape.
 */

export const Sizes = () => (
  <div className="d-flex flex-wrap gap-3 align-items-center">
    <Avatar name="רותי כהן" size={28} />
    <Avatar name="דניאל" size={36} />
    <Avatar name="לונה" size={44} />
    <Avatar name="Maya Ben Ari" size={56} />
    <Avatar name="אבא" size={64} />
  </div>
);

/** One word gives two characters; two words give one each — and a Latin name inside a Hebrew frame. */
export const Initials = () => (
  <div className="d-flex flex-wrap gap-3 align-items-center">
    <Avatar name="סבתא רותי" size={44} />
    <Avatar name="נועם" size={44} />
    <Avatar name="Daniel Ravid" size={44} />
    <Avatar name="לונה" size={44} />
  </div>
);

/** The card the family grid is built from: avatar, name, relationship, what is next. */
export const InProfileCard = () => (
  <article className="focus-profile-card">
    <Avatar name="רותי כהן" size={44} />
    <div className="focus-profile-card__body">
      <h3 className="focus-profile-card__name" dir="auto">
        רותי כהן
      </h3>
      <p className="focus-profile-card__relation" dir="auto">
        סבתא
      </p>
      <p className="focus-profile-card__next" dir="auto">
        תור לרופאת עיניים · בעוד 6 ימים
      </p>
      <p className="focus-profile-card__relation">
        <time dateTime="2026-09-03">3 בספטמבר</time> · מלאו לה 84
      </p>
    </div>
  </article>
);

/** Small, at the start of a dense row — the size it is used at most often. */
export const LeadingARow = () => (
  <CompactList>
    <li>
      <CompactRow
        title="חיסון משולש ללונה"
        eyebrow="וטרינר"
        detail="ד״ר שקד, לקחת את הפנקס"
        leading={<Avatar name="לונה" size={28} />}
        meta={<span>בעוד 9 ימים</span>}
        tone="soon"
      />
    </li>
    <li>
      <CompactRow
        title="להתקשר לסבתא רותי"
        eyebrow="תזכורת"
        detail="כל שבועיים, אחרי ארוחת ערב"
        leading={<Avatar name="רותי כהן" size={28} />}
        meta={<span>מחר</span>}
      />
    </li>
    <li>
      <CompactRow
        title="חיסונים לגן"
        eyebrow="תור"
        detail="טיפת חלב, לקחת פנקס חיסונים"
        leading={<Avatar name="נועם" size={28} />}
        meta={<span>בעוד שבועיים</span>}
      />
    </li>
  </CompactList>
);
