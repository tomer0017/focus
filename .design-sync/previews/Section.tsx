import { Section, CompactList, CompactRow, Icon } from "focus-client";

/**
 * The wrapper every dashboard and space-view section goes through.
 *
 * Two things are worth seeing here and nowhere else: the optional trailing
 * action on the heading row, and the fact that a section with nothing in it
 * renders *nothing at all* — no heading, no "nothing here" panel.
 *
 * `span` is a layout decision, so a short section shares a row with the next
 * short one. That only shows up inside `.focus-sections`, which is why every
 * cell is wrapped in it.
 */

export const WithRows = () => (
  <div className="focus-sections">
    <Section title="מנויים פעילים" hasContent span="full">
      <CompactList>
        <li>
          <CompactRow
            title="Netflix"
            eyebrow="מנוי"
            detail="החשבון המשותף — מתחדש אוטומטית בכרטיס של הבית"
            meta={<span>₪54.90 / חודש</span>}
          />
        </li>
        <li>
          <CompactRow
            title="Spotify משפחתי"
            eyebrow="מנוי"
            detail="שישה מקומות, ארבעה בשימוש"
            meta={<span>₪29.90 / חודש</span>}
          />
        </li>
        <li>
          <CompactRow
            title="גיבוי ענן"
            eyebrow="מנוי"
            detail="שנתי — נגמר המקום, כדאי לבדוק חבילה גדולה יותר"
            meta={<span>₪310 / שנה</span>}
          />
        </li>
      </CompactList>
    </Section>
  </div>
);

export const WithShowAllAction = () => (
  <div className="focus-sections">
    <Section
      title="דורש תשומת לב"
      hasContent
      span="full"
      action={
        <a href="/projects" className="focus-section-action">
          הצג הכול (עוד 4)
        </a>
      }
    >
      <CompactList>
        <li>
          <CompactRow
            title="Sorcol"
            eyebrow="פרויקט"
            detail="Waiting on the models for the remaining sizes."
            leading={<Icon name="alert" size={16} />}
            tone="due"
          />
        </li>
        <li>
          <CompactRow
            title="תאורה במטבח"
            eyebrow="פרויקט"
            detail="החשמלאי לא חוזר. צריך למצוא מישהו אחר."
            leading={<Icon name="alert" size={16} />}
            tone="due"
          />
        </li>
      </CompactList>
    </Section>
  </div>
);

/**
 * Two short sections, both `span="auto"`.
 *
 * The section grid is `auto-fit, minmax(430px, 1fr)`, so above roughly 890px
 * these two share a row instead of each sitting alone in a thin column with
 * two thirds of the width blank. Below that — including this cell, which is
 * captured at 900px — they stack, which is the same layout and the correct
 * one for a narrow screen.
 */
export const ShortSectionsSpanAuto = () => (
  <div className="focus-sections">
    <Section title="גישה מהירה" hasContent span="auto">
      <CompactList>
        <li>
          <CompactRow
            title="Painter Platform"
            eyebrow="פרויקט"
            detail="Custom domains are next, once uploads stop failing."
          />
        </li>
        <li>
          <CompactRow title="רשימת קניות שבועית" eyebrow="צ׳קליסט" detail="7 מתוך 19 סומנו" />
        </li>
      </CompactList>
    </Section>

    <Section title="נשמר לאחרונה" hasContent span="auto">
      <CompactList>
        <li>
          <CompactRow
            title="Oak sideboard, 180cm"
            eyebrow="מוצר"
            detail="נמוך מספיק לגומחה — צריך למדוד שוב"
          />
        </li>
        <li>
          <CompactRow
            title="Neapolitan dough, start to finish"
            eyebrow="סרטון"
            detail="הבצק שיצא הכי טוב עד עכשיו"
          />
        </li>
      </CompactList>
    </Section>
  </div>
);

/** Nothing to show renders nothing — no heading, no placeholder panel. */
export const EmptyRendersNothing = () => (
  <div className="focus-sections">
    <Section title="מוקפא" hasContent={false} span="auto">
      <CompactList>
        <li>
          <CompactRow title="לעולם לא ייראה" eyebrow="—" />
        </li>
      </CompactList>
    </Section>
    <p className="text-secondary small mb-0" dir="auto">
      (hasContent={"{false}"} — the section renders nothing at all. That is the rule,
      not a broken cell.)
    </p>
  </div>
);
