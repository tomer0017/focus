import { ShowMore, CompactList, CompactRow, SectionHeading } from "focus-client";

/**
 * Progressive disclosure for a long list. Fourteen subscriptions is not
 * information, it is a wall; six of them plus a button that says how many are
 * behind it is both readable and honest — which "…" is not. The hidden rows
 * enter the DOM when the button is pressed, so a keyboard and a screen reader
 * take the same path a mouse does. There is no pagination anywhere in Focus.
 */

interface Row {
  id: string;
  title: string;
  eyebrow: string;
  detail: string;
  meta: string;
}

const SUBSCRIPTIONS: Row[] = [
  { id: "netflix", title: "Netflix", eyebrow: "מנוי", detail: "החשבון המשותף — מתחדש אוטומטית", meta: "₪54.90 / חודש" },
  { id: "spotify", title: "Spotify Family", eyebrow: "מנוי", detail: "שישה מקומות, ארבעה בשימוש", meta: "₪34.90 / חודש" },
  { id: "icloud", title: "iCloud 2TB", eyebrow: "מנוי", detail: "הגיבוי של שני הטלפונים והמחשב", meta: "₪39.90 / חודש" },
  { id: "gym", title: "מנוי לחדר כושר", eyebrow: "מנוי", detail: "הולמס פלייס — התחייבות עד מרץ", meta: "₪229 / חודש" },
  { id: "car-ins", title: "ביטוח רכב מקיף", eyebrow: "ביטוח", detail: "איילון — לבדוק הצעה חלופית לפני החידוש", meta: "₪3,180 / שנה" },
  { id: "home-ins", title: "ביטוח דירה", eyebrow: "ביטוח", detail: "הראל — מבנה ותכולה", meta: "₪1,440 / שנה" },
  { id: "health-ins", title: "ביטוח בריאות משלים", eyebrow: "ביטוח", detail: "כולל את שני הילדים", meta: "₪318 / חודש" },
  { id: "dog-ins", title: "ביטוח ללונה", eyebrow: "ביטוח", detail: "וטרינר וניתוחים", meta: "₪89 / חודש" },
  { id: "figma", title: "Figma Professional", eyebrow: "מנוי", detail: "לעבודה על Painter Platform", meta: "$15 / חודש" },
  { id: "domain", title: "דומיין sorcol.co.il", eyebrow: "מנוי", detail: "חידוש שנתי, מתחדש אוטומטית", meta: "₪72 / שנה" },
  { id: "hosting", title: "אחסון ושרת", eyebrow: "מנוי", detail: "Hetzner — החשבון על הכרטיס העסקי", meta: "€11 / חודש" },
  { id: "news", title: "הארץ דיגיטלי", eyebrow: "מנוי", detail: "מבצע שנה ראשונה נגמר בנובמבר", meta: "₪39 / חודש" },
  { id: "storage", title: "מחסן בקומת הקרקע", eyebrow: "תשלום קבוע", detail: "משולם לוועד הבית", meta: "₪120 / חודש" },
  { id: "water", title: "מסנן מים", eyebrow: "מנוי", detail: "החלפת פילטר כלולה", meta: "₪49 / חודש" },
];

const HEALTH: Row[] = [
  { id: "blood", title: "בדיקת דם — המשך", eyebrow: "תור", detail: "צום 12 שעות לפני", meta: "בעוד 4 ימים" },
  { id: "dentist", title: "ניקוי אבנית", eyebrow: "תור", detail: "מרפאת שיניים ברחוב ויצמן", meta: "בעוד 12 ימים" },
  { id: "derm", title: "מעקב שומות", eyebrow: "תור", detail: "פעם בשנה — הופנתה על ידי ד״ר לוי", meta: "בעוד 3 שבועות" },
  { id: "eyes", title: "בדיקת ראייה", eyebrow: "תור", detail: "המשקפיים בני ארבע שנים", meta: "לקבוע" },
  { id: "vet", title: "חיסון משולש ללונה", eyebrow: "וטרינר", detail: "הפנקס במגירה במטבח", meta: "בעוד חודש" },
  { id: "vitd", title: "ויטמין D", eyebrow: "תוסף", detail: "טיפה בבוקר עם האוכל", meta: "כל יום" },
  { id: "omega", title: "אומגה 3", eyebrow: "תוסף", detail: "קפסולה בערב", meta: "כל יום" },
  { id: "iron", title: "ברזל", eyebrow: "תוסף", detail: "לשלושה חודשים, לפי מה שנאמר בקופה", meta: "כל יום" },
];

const renderRows = (visible: Row[]) => (
  <CompactList>
    {visible.map((row) => (
      <li key={row.id}>
        <CompactRow
          title={row.title}
          eyebrow={row.eyebrow}
          detail={row.detail}
          meta={<span>{row.meta}</span>}
        />
      </li>
    ))}
  </CompactList>
);

export const LongList = () => (
  <ShowMore items={SUBSCRIPTIONS} limit={6}>
    {renderRows}
  </ShowMore>
);

export const TightLimit = () => (
  <ShowMore items={HEALTH} limit={3}>
    {renderRows}
  </ShowMore>
);

export const InSection = () => (
  <section className="focus-section focus-section--full">
    <SectionHeading title="ביטוחים ומנויים" />
    <ShowMore items={SUBSCRIPTIONS.slice(0, 9)} limit={4}>
      {renderRows}
    </ShowMore>
  </section>
);
