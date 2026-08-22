import { useState } from "react";
import {
  CollectionPage,
  CompactList,
  CompactRow,
  EmptyState,
  FilterChips,
  SearchField,
  StatusBadge,
} from "focus-client";

/**
 * The shape every collection screen in Focus takes.
 *
 * Title and one action, then at most two layers of narrowing — a primary tab
 * for *which kind*, a secondary filter for *which state* — then one list. Two
 * layers is a cap: a third would mean a screen where the reader has to hold
 * three choices in their head to know what they are looking at.
 *
 * It owns no state. Which tab is active belongs to the screen, which usually
 * keeps it in the URL so a refresh lands in the same place.
 */

const rows = [
  { id: "1", title: "Sorcol", eyebrow: "טכנולוגיים", detail: "Review the models and print one trial size." },
  { id: "2", title: "מדפים במטבח", eyebrow: "פיזיים", detail: "למדוד שוב את המרחק מהחלון." },
  { id: "3", title: "Oil portrait — grandmother", eyebrow: "אישיים", detail: "Mix a warmer shadow with burnt sienna." },
];

export const WithTabsAndFilter = () => {
  const [tab, setTab] = useState("tech");
  const [status, setStatus] = useState("active");
  const [query, setQuery] = useState("");

  return (
    <CollectionPage
      title="פרויקטים"
      lead="קטגוריה, ואז מצב. ההיסטוריה נשארת נגישה בלי להציף את המסך."
      action={<button className="btn btn-primary btn-sm">ניהול קטגוריות</button>}
      tabs={[
        { id: "personal", label: "אישיים", badge: "1" },
        { id: "tech", label: "טכנולוגיים", badge: "5" },
        { id: "physical", label: "פיזיים", badge: "5" },
      ]}
      tabValue={tab}
      onTabChange={setTab}
      tabsLabel="בחירת קטגוריה"
      toolbar={
        <>
          <FilterChips
            label="סינון לפי מצב"
            value={status}
            onChange={setStatus}
            options={[
              { value: "active", label: "פעיל", count: 3 },
              { value: "blocked", label: "תקועים", count: 1 },
              { value: "completed", label: "הושלם", count: 12 },
            ]}
          />
          <SearchField label="חיפוש פרויקט" value={query} onChange={setQuery} />
        </>
      }
    >
      <CompactList>
        {rows.map((row) => (
          <li key={row.id}>
            <CompactRow
              title={row.title}
              eyebrow={row.eyebrow}
              detail={row.detail}
              badges={<StatusBadge status="active" />}
              meta={<span>לפני יומיים</span>}
            />
          </li>
        ))}
      </CompactList>
    </CollectionPage>
  );
};

/**
 * One category, so no tab strip at all — a control with one option is
 * furniture, and the component drops it rather than drawing it disabled.
 */
export const WithoutTabs = () => (
  <CollectionPage
    title="לימודים"
    lead="איפה עצרת ומה הצעד הבא"
    action={<button className="btn btn-primary btn-sm">מסלול חדש</button>}
  >
    <CompactList>
      <li>
        <CompactRow
          title="TypeScript in depth"
          eyebrow="בינוני"
          detail="Chapter on mapped types — got as far as conditional inference."
          meta={<span>נלמד לפני 4 ימים</span>}
        />
      </li>
    </CompactList>
  </CollectionPage>
);

/** Nothing yet. The whole-screen empty state belongs to the screen, not the list. */
export const Empty = () => (
  <CollectionPage
    title="טיולים"
    lead="מה קרוב, מה עוד צריך הכנה, ואיפה מה שכבר היה"
    action={<button className="btn btn-primary btn-sm">טיול חדש</button>}
  >
    <EmptyState
      title="עדיין אין טיולים"
      hint="מתחילים משם, תאריכים ויעד. כל השאר מתמלא תוך כדי."
    />
  </CollectionPage>
);
