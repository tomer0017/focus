import { SectionHeading, CompactList, CompactRow } from "focus-client";

/**
 * A section title and nothing else. The explanatory sub-line that used to sit
 * under every heading was removed — repeating "חסום, ומחכה לך" beneath a
 * heading that already says "דורש תשומת לב" is noise, and it doubled the
 * vertical cost of every section. The optional trailing action is the one
 * thing allowed on the row: usually "show all", with the count behind it.
 */

export const TitleOnly = () => <SectionHeading title="דורש תשומת לב" />;

export const WithShowAll = () => (
  <SectionHeading
    title="ממשיכים מאיפה שעצרת"
    action={
      <a href="/projects" className="focus-section-action">
        הצג הכל (עוד 4)
      </a>
    }
  />
);

export const WithAddAction = () => (
  <SectionHeading
    title="תורים וחידושים"
    action={
      <button type="button" className="btn btn-sm btn-link text-decoration-none">
        הוספה
      </button>
    }
  />
);

export const AboveContent = () => (
  <section className="focus-section focus-section--full">
    <SectionHeading
      title="חוזר על עצמו"
      action={
        <a href="/manage" className="focus-section-action">
          הצג הכל (עוד 6)
        </a>
      }
    />
    <CompactList>
      <li>
        <CompactRow
          title="ביטוח דירה"
          eyebrow="חידוש"
          detail="הראל — נשלחה הצעה חלופית מהסוכן"
          meta={<span>1 בספטמבר</span>}
          tone="soon"
        />
      </li>
      <li>
        <CompactRow
          title="טיפול נגד פרעושים ללונה"
          eyebrow="חיית מחמד"
          detail="פיפטה, פעם בחודש"
          meta={<span>בעוד 9 ימים</span>}
        />
      </li>
    </CompactList>
  </section>
);
