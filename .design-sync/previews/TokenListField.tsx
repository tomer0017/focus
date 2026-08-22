import { TokenListField } from "focus-client";

/**
 * A short list built one entry at a time — the user's own tags, or the times a
 * tablet is taken.
 *
 * Enter adds, and so does the button beside the box: a field whose only way to
 * commit a value is a key press loses that value silently when somebody presses
 * Save instead. Tags are the user's own words, never translated and never
 * prefixed with a hash — there is no global namespace here, and typing a
 * holiday name is how they get found again.
 *
 * Every cell arrives with entries already in it. An empty token list is one
 * input and a button, which says nothing about the thing itself.
 */

const hold = (_values: string[]): void => {};

/** Tags on a leisure item, with the hint that explains where they come from. */
export const Tags = () => (
  <TokenListField
    label="תגיות"
    hint="המילים שלך. כותבים אחת ולוחצים Enter."
    values={["ערב שקט", "בלי מסך", "ביתי"]}
    onChange={hold}
    removeLabel={(value) => `מחיקת ${value}`}
  />
);

/** `inputType="time"` — a clock picker, and every token forced to LTR so 08:00 stays 08:00. */
export const Times = () => (
  <TokenListField
    label="שעות ביום"
    values={["08:00", "14:00", "21:30"]}
    onChange={hold}
    inputType="time"
    removeLabel={(value) => `הסרת ${value}`}
  />
);

/** Enough tags to wrap, which is the layout worth checking: recipes filed for a holiday. */
export const ManyTags = () => (
  <TokenListField
    label="תגיות"
    hint="המילים שלך. כותבים אחת ולוחצים Enter."
    values={["ראש השנה", "טבעוני", "בלי גלוטן", "תנור", "מהיר", "לילדים", "של סבתא", "מראש"]}
    onChange={hold}
    removeLabel={(value) => `מחיקת ${value}`}
  />
);

/** Its place in the leisure form: what the thing is, then the words to find it by. */
export const InLeisureForm = () => (
  <div className="focus-form-stack">
    <div>
      <label htmlFor="leisure-title-demo" className="form-label fw-medium">
        מה זה
      </label>
      <input
        id="leisure-title-demo"
        className="form-control"
        dir="auto"
        value="Perfect Days"
        readOnly
      />
    </div>
    <div>
      <label htmlFor="leisure-note-demo" className="form-label fw-medium">
        הערה
      </label>
      <textarea
        id="leisure-note-demo"
        className="form-control"
        dir="auto"
        rows={2}
        value="שני שעות ורבע, איטי. לא לערב שאין בו כוח."
        readOnly
      />
    </div>
    <TokenListField
      label="תגיות"
      hint="המילים שלך. כותבים אחת ולוחצים Enter."
      values={["סרט", "ערב שקט", "יפן"]}
      onChange={hold}
      removeLabel={(value) => `מחיקת ${value}`}
    />
  </div>
);
