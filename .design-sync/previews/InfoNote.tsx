import { InfoNote, CompactList, CompactRow } from "focus-client";

/**
 * The small honest line. Focus has two things it must keep saying and must not
 * shout — a reminder only appears while the tab is open, and nothing here is
 * medical or financial advice — so each is one quiet line, printed once, where
 * the claim is actually made. Printed on every row it would be furniture.
 */

export const Info = () => (
  <InfoNote>התזכורות מוצגות רק כשהאפליקציה פתוחה. לא תישלח התראה כשהלשונית סגורה.</InfoNote>
);

export const Caution = () => (
  <InfoNote tone="caution">
    המידע כאן נרשם כפי שנמסר לך. Focus לא מחשב מינון, לא מפרש תוצאה ולא מחליף ייעוץ רפואי.
  </InfoNote>
);

export const BothTones = () => (
  <div className="d-flex flex-column gap-2">
    <InfoNote>אין חיבור לבנק. כל שורה כאן היא מה שהוקלד ידנית.</InfoNote>
    <InfoNote tone="caution">
      מספרי כרטיס מלאים וסיסמאות לא נשמרים — "הכרטיס המשותף" הוא תזכורת, לא אמצעי תשלום.
    </InfoNote>
  </div>
);

export const BeneathAPanel = () => (
  <div className="focus-panel">
    <h3 className="focus-panel__title mb-2">תרופות וויטמינים</h3>
    <CompactList>
      <li>
        <CompactRow
          title="ויטמין D"
          eyebrow="תוסף"
          detail="טיפה אחת בבוקר עם האוכל — לפי מה שאמרה ד״ר לוי"
          meta={<span>כל יום</span>}
        />
      </li>
      <li>
        <CompactRow
          title="אומגה 3"
          eyebrow="תוסף"
          detail="קפסולה בערב"
          meta={<span>כל יום</span>}
        />
      </li>
    </CompactList>
    <div className="mt-2">
      <InfoNote tone="caution">
        המידע כאן נרשם כפי שנמסר לך. Focus רק חוזר עליו — אין כאן חישוב מינון או ייעוץ רפואי.
      </InfoNote>
    </div>
  </div>
);
