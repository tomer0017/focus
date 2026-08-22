import { TokenListField, WeekdayField } from "focus-client";

/**
 * Seven toggles, and one rule that is easy to get wrong: **empty means every
 * day**, not "no days". That is the common case — a daily tablet should not
 * cost seven clicks — so the control says what empty means underneath instead
 * of leaving the user to work out whether nothing selected means nothing
 * scheduled.
 *
 * The label and the empty line are interface copy the caller supplies, so the
 * cells here pass the same strings the medication form passes.
 */

const hold = (_weekdays: number[]): void => {};
const holdTimes = (_values: string[]): void => {};

/** Sunday, Tuesday, Thursday — the shape a physiotherapy week actually takes. */
export const SelectedDays = () => (
  <WeekdayField label="ימים" value={[0, 2, 4]} onChange={hold} emptyLabel="כל יום" />
);

/** Nothing selected, and the line underneath saying that this is "every day". */
export const EveryDay = () => (
  <WeekdayField label="ימים" value={[]} onChange={hold} emptyLabel="כל יום" />
);

/** The Israeli weekend, and the tail of the strip carrying the selection. */
export const WeekendOnly = () => (
  <WeekdayField label="ימים" value={[5, 6]} onChange={hold} emptyLabel="כל יום" />
);

/** Its home: a medicine written down exactly as it was prescribed, and nothing computed from it. */
export const InMedicationForm = () => (
  <div className="focus-form-stack">
    <div>
      <label htmlFor="med-name-demo" className="form-label fw-medium">
        שם
      </label>
      <input id="med-name-demo" className="form-control" dir="auto" value="ויטמין D" readOnly />
    </div>
    <div>
      <label htmlFor="med-dosage-demo" className="form-label fw-medium">
        מינון
      </label>
      <input
        id="med-dosage-demo"
        className="form-control"
        dir="auto"
        value="טיפה אחת, 1000 יחב״ל"
        aria-describedby="med-dosage-demo-hint"
        readOnly
      />
      <p id="med-dosage-demo-hint" className="form-text mb-0">
        בדיוק כמו שנאמר לך. Focus לא מציע מינון ולא משנה אותו.
      </p>
    </div>
    <TokenListField
      label="שעות ביום"
      values={["08:00"]}
      onChange={holdTimes}
      inputType="time"
      removeLabel={(value) => `הסרת ${value}`}
    />
    <WeekdayField label="ימים" value={[0]} onChange={hold} emptyLabel="כל יום" />
  </div>
);
