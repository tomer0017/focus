import { CompactList, CompactRow, StatusBadge, Avatar, Icon } from "focus-client";

/**
 * The list the dense row lives in — a `<ul>`, so assistive tech announces how
 * many there are.
 *
 * `CompactRow` on its own is a single fact on a line; the thing worth looking
 * at is what a run of them does. These cells are the compositions the app
 * actually builds: the learning list, a month of obligations with mixed tones,
 * and a panel of subscriptions with badges and quiet row actions.
 */

export const LearningList = () => (
  <CompactList>
    <li>
      <CompactRow
        title="קליגרפיה"
        eyebrow="מתחילה"
        detail="עצרתי באות ג׳ — היד עדיין רועדת בקו היורד"
        badges={<span className="focus-chip focus-chip--muted">חומרים: 4</span>}
        meta={<span>נלמד לפני 3 ימים</span>}
      />
    </li>
    <li>
      <CompactRow
        title="TypeScript generics"
        eyebrow="Intermediate"
        detail="Stopped halfway through conditional types — reread the mapped-type chapter first."
        badges={<span className="focus-chip focus-chip--muted">חומרים: 7</span>}
        meta={<span>נלמד לפני שבועיים</span>}
      />
    </li>
    <li>
      <CompactRow
        title="ספרדית"
        eyebrow="בסיסי"
        detail="הפועל ser מול estar — עדיין מתבלבלת"
        meta={<span>עוד לא נלמד</span>}
      />
    </li>
    <li>
      <CompactRow
        title="גיטרה"
        eyebrow="מתקדמת"
        detail="F בארה עדיין לא נקייה, לתרגל 10 דקות לפני כל שיר"
        badges={<span className="focus-chip focus-chip--muted">חומרים: 2</span>}
        meta={<span>נלמד לפני חודש</span>}
      />
    </li>
  </CompactList>
);

/** A long list, with the tone stripe doing what it does — reinforcing, never carrying. */
export const MonthOfObligations = () => (
  <CompactList>
    <li>
      <CompactRow
        title="חשבון חשמל"
        eyebrow="תשלום"
        detail="דו-חודשי, ירד מהוראת קבע"
        meta={<span>באיחור של 4 ימים</span>}
        tone="due"
      />
    </li>
    <li>
      <CompactRow
        title="חיסון משולש ללונה"
        eyebrow="וטרינר"
        detail="ד״ר שקד, לקחת את הפנקס"
        meta={<span>היום</span>}
        tone="due"
      />
    </li>
    <li>
      <CompactRow
        title="ביטוח דירה"
        eyebrow="חידוש"
        detail="לבקש הצעה נגדית לפני שמאשרים אוטומטית"
        meta={<span>בעוד 5 ימים</span>}
        tone="soon"
      />
    </li>
    <li>
      <CompactRow
        title="להתקשר לסבתא רותי"
        eyebrow="תזכורת"
        detail="כל שבועיים, אחרי ארוחת ערב"
        meta={<span>בעוד שבוע</span>}
        tone="soon"
      />
    </li>
    <li>
      <CompactRow
        title="ארנונה"
        eyebrow="תשלום"
        detail="שני חודשים קדימה, שילמנו מראש בהנחה"
        meta={<span>1 בחודש</span>}
      />
    </li>
    <li>
      <CompactRow
        title="בדיקת דם — המשך"
        eyebrow="תור"
        detail="צום 12 שעות, מרפאת בית הכרם"
        meta={<span>בעוד 3 שבועות</span>}
      />
    </li>
    <li>
      <CompactRow
        title="טסט שנתי"
        eyebrow="רכב"
        detail="בוצע במוסך ברחוב הרצל, קיבלנו טופס"
        meta={<span>הושלם</span>}
        tone="done"
      />
    </li>
  </CompactList>
);

/** Badges beside the title, quiet actions at the end, an avatar leading the row. */
export const WithBadgesAndActions = () => (
  <CompactList>
    <li>
      <CompactRow
        title="Sorcol"
        eyebrow="פרויקט"
        detail="Sizing product and marketing site — the size model is the product."
        leading={<Icon name="board" size={18} />}
        badges={<StatusBadge status="active" />}
        meta={<span>עודכן לפני יומיים</span>}
        actions={
          <button type="button" className="btn btn-sm btn-link focus-icon-button text-secondary">
            <Icon name="edit" size={16} />
          </button>
        }
      />
    </li>
    <li>
      <CompactRow
        title="החלפת הספה בסלון"
        eyebrow="פרויקט"
        detail="מדדנו 2.40 — צריך לוודא שנכנס במעלית"
        leading={<Icon name="home" size={18} />}
        badges={<StatusBadge status="paused" />}
        meta={<span>עודכן לפני חודשיים</span>}
        actions={
          <button type="button" className="btn btn-sm btn-link focus-icon-button text-secondary">
            <Icon name="edit" size={16} />
          </button>
        }
      />
    </li>
    <li>
      <CompactRow
        title="לונה — חיסונים"
        eyebrow="משפחה"
        detail="הפנקס אצל הווטרינר, לצלם בביקור הבא"
        leading={<Avatar name="לונה" size={28} />}
        badges={<span className="focus-chip focus-chip--muted">כלבה</span>}
        meta={<span>בעוד 9 ימים</span>}
        actions={
          <button type="button" className="btn btn-sm btn-link focus-icon-button text-secondary">
            <Icon name="check" size={16} />
          </button>
        }
      />
    </li>
  </CompactList>
);
