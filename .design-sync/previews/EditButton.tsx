import { EditButton, Icon, StatusBadge, SpaceBadge, BlockedBadge, LabelledText } from "focus-client";

/**
 * The small pencil that opens a thing for editing — and it is a real `<button>`
 * with a real accessible name: `targetLabel` becomes "עריכת Sorcol", so a screen
 * with eleven pencils on it does not announce "עריכה" eleven times.
 *
 * It never floats on its own. It sits at the end of the row that names what it
 * edits — the meta line of a card, or the control strip of a row in edit mode —
 * which is also why the cells here are all in situ.
 */

const noop = () => undefined;

/** Where it lives most often: the meta line of a card, after the badges. */
export const BesideACardTitle = () => (
  <ul className="list-unstyled focus-grid focus-grid--continue mb-0">
    <li>
      <article className="focus-card">
        <div className="focus-card__head">
          <h3 className="focus-card__title">
            <a href="/pages/sorcol" dir="auto">
              Sorcol
            </a>
          </h3>
          <div className="focus-card__meta">
            <BlockedBadge />
            <SpaceBadge spaceId="work-tech" />
            <EditButton targetLabel="Sorcol" onClick={noop} />
          </div>
        </div>

        <p className="focus-card__state focus-clamp-2" dir="auto">
          עצרתי אחרי שהטבלה של המידות עברה למודל החדש — נשאר לחבר את המסך של ההזמנה.
        </p>

        <LabelledText label="הפעולה הבאה" className="focus-card__next">
          לכתוב למעצבת על שתי המידות החסרות
        </LabelledText>
      </article>
    </li>

    <li>
      <article className="focus-card">
        <div className="focus-card__head">
          <h3 className="focus-card__title">
            <a href="/pages/kitchen" dir="auto">
              שיפוץ המטבח
            </a>
          </h3>
          <div className="focus-card__meta">
            <StatusBadge status="active" />
            <SpaceBadge spaceId="home" />
            <EditButton targetLabel="שיפוץ המטבח" onClick={noop} />
          </div>
        </div>

        <p className="focus-card__state focus-clamp-2" dir="auto">
          נמדדו הארונות, חסרה החלטה על הכיור.
        </p>

        <LabelledText label="הפעולה הבאה" className="focus-card__next">
          לקבוע מדידה עם הנגר לשבוע הבא
        </LabelledText>
      </article>
    </li>
  </ul>
);

/**
 * In edit mode a line grows a control strip — up, down, edit, delete — and the
 * pencil is one of four. None of these appear in view mode; ticking something
 * off is not editing, and renaming it is.
 */
export const InAnEditModeRow = () => (
  <ul className="list-unstyled mb-0 d-flex flex-column gap-2">
    {[
      { title: "פסטה עם עגבניות שרי", note: "מנה עיקרית · ל-6 סועדים" },
      { title: "סלט כרוב עם שקדים", note: "סלט · אפשר להכין מראש" },
      { title: "Tiramisu", note: "קינוח · צריך מסקרפונה" },
    ].map((dish) => (
      <li key={dish.title}>
        <div className="focus-dense-row">
          <div className="focus-dense-row__body">
            <p className="focus-dense-row__title mb-0" dir="auto">
              {dish.title}
            </p>
            <p className="focus-dense-row__detail focus-clamp-1 mb-0" dir="auto">
              {dish.note}
            </p>
          </div>
          <div className="focus-dense-row__actions">
            <button
              type="button"
              className="focus-icon-button btn btn-sm btn-link text-secondary"
              aria-label="הזזה למעלה"
            >
              <Icon name="chevronUp" size={15} />
            </button>
            <button
              type="button"
              className="focus-icon-button btn btn-sm btn-link text-secondary"
              aria-label="הזזה למטה"
            >
              <Icon name="chevronDown" size={15} />
            </button>
            <EditButton targetLabel={dish.title} onClick={noop} />
            <button
              type="button"
              className="focus-icon-button btn btn-sm btn-link text-secondary"
              aria-label={`מחיקת ${dish.title}`}
            >
              <Icon name="trash" size={15} />
            </button>
          </div>
        </div>
      </li>
    ))}
  </ul>
);

/**
 * The button itself, at the size it actually renders: a 16px pencil in a
 * link-variant button with a pill-ish hit area. It is deliberately quiet — the
 * title beside it is the thing being read, not the pencil.
 */
export const OnItsOwn = () => (
  <div className="d-flex align-items-center gap-3">
    <span className="focus-card__title" dir="auto">
      תזונה של לונה
    </span>
    <EditButton targetLabel="תזונה של לונה" onClick={noop} />
    <span className="focus-chip focus-chip--muted" dir="ltr">
      aria-label = עריכת תזונה של לונה
    </span>
  </div>
);
