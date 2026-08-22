import { CompactList, CompactRow, FilterChips } from "focus-client";

/**
 * One filter, two presentations, no duplicated state.
 *
 * Above `sm` it is a row of real buttons carrying `aria-pressed`; below `sm` it
 * is a native `<select>` instead, because a horizontal chip strip at 320px
 * either overflows the viewport or becomes a scroll surface with no scrollbar.
 * The two are alternates of each other — `d-none` removes an element from the
 * accessibility tree, so exactly one is ever in it. These cells are captured at
 * 900px wide, so what shows is the chip half; the `<select>` is there, one
 * media query away.
 *
 * The selected chip is never signalled by colour alone: it is a pressed button
 * with its own border and weight.
 */

const hold = (_value: string): void => {};

/** The strip at the top of `/manage` — five views over the same screen, driven by `?view=`. */
export const ManageViews = () => (
  <div className="focus-toolbar">
    <FilterChips
      label="איזה חלק בניהול השוטף"
      options={[
        { value: "all", label: "הכול" },
        { value: "money", label: "כספים והתחייבויות" },
        { value: "health", label: "בריאות" },
        { value: "shopping", label: "קניות ואוכל" },
        { value: "dates", label: "תאריכים חשובים" },
      ]}
      value="money"
      onChange={hold}
    />
  </div>
);

/** Counts sit inside the chip, and only where there is something to count. */
export const WithCounts = () => (
  <div className="focus-toolbar">
    <FilterChips
      label="סוג"
      options={[
        { value: "all", label: "הכול", count: 34 },
        { value: "movie", label: "סרט", count: 12 },
        { value: "series", label: "סדרה", count: 6 },
        { value: "book", label: "ספר", count: 9 },
        { value: "place", label: "מקום", count: 4 },
        { value: "evening", label: "רעיון לערב", count: 3 },
      ]}
      value="movie"
      onChange={hold}
    />
  </div>
);

/** Two strips in one toolbar, the way the leisure screen filters kind and state together. */
export const TwoFilters = () => (
  <div className="focus-toolbar">
    <FilterChips
      label="סוג"
      options={[
        { value: "all", label: "הכול", count: 34 },
        { value: "movie", label: "סרט", count: 12 },
        { value: "book", label: "ספר", count: 9 },
      ]}
      value="all"
      onChange={hold}
    />
    <FilterChips
      label="מצב"
      options={[
        { value: "all", label: "הכול" },
        { value: "idea", label: "רעיון" },
        { value: "done", label: "היה" },
      ]}
      value="idea"
      onChange={hold}
    />
  </div>
);

/** What it is for: the strip, then the list it narrowed. */
export const AboveAList = () => (
  <>
    <div className="focus-toolbar">
      <FilterChips
        label="איזה חלק בניהול השוטף"
        options={[
          { value: "all", label: "הכול" },
          { value: "money", label: "כספים והתחייבויות" },
          { value: "health", label: "בריאות" },
          { value: "shopping", label: "קניות ואוכל" },
          { value: "dates", label: "תאריכים חשובים" },
        ]}
        value="health"
        onChange={hold}
      />
    </div>
    <CompactList>
      <li>
        <CompactRow
          title="בדיקת דם — המשך"
          eyebrow="תור"
          detail="צום 12 שעות לפני, מרפאת כללית ברחוב ויצמן"
          meta={<span>בעוד 4 ימים</span>}
          tone="soon"
        />
      </li>
      <li>
        <CompactRow
          title="ויטמין D"
          eyebrow="תרופות וויטמינים"
          detail="טיפה אחת בבוקר, אחרי ארוחה"
          meta={<span>כל יום</span>}
        />
      </li>
      <li>
        <CompactRow
          title="חיסון משולש ללונה"
          eyebrow="וטרינר"
          detail="ד״ר שקד — לקחת את הפנקס"
          meta={<span>בעוד 9 ימים</span>}
        />
      </li>
    </CompactList>
  </>
);
