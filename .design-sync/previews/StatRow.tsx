import { StatRow } from "focus-client";

/**
 * Two to four numbers on one line — and deliberately not a KPI strip.
 *
 * Every figure here is one somebody actually asked for: what came in, what went
 * out, what is still unpaid. There is no delta against last month and no
 * coloured arrow, because neither changes what anybody does next.
 *
 * The values arrive **already formatted** through `lib/format.ts`; the row never
 * formats anything itself. The fixtures below are the exact output of
 * `formatMoney` / `formatSignedMoney` in `he-IL`, bidi marks included, so the
 * currency symbol lands where the real screen puts it.
 */

/** The money view: in, out, balance, and what is still owed. */
export const MonthOfMoney = () => (
  <StatRow
    stats={[
      { label: "נכנס", value: "‏18,400 ‏₪" },
      { label: "יצא", value: "‏12,730 ‏₪" },
      { label: "מאזן", value: "‏‎+5,670 ‏₪" },
      { label: "טרם שולם", value: "‏940 ‏₪" },
    ]}
  />
);

/** `muted` softens a figure that is context rather than headline — here, the count. */
export const WithMutedFigure = () => (
  <StatRow
    stats={[
      { label: "בערך לחודש", value: "‏1,284 ‏₪" },
      { label: "בערך לשנה", value: "‏15,408 ‏₪" },
      { label: "פעילים", value: "11", muted: true },
    ]}
  />
);

/** A menu asks two questions, so it shows two numbers. Nothing is padded out to four. */
export const TwoNumbers = () => (
  <StatRow
    stats={[
      { label: "מנות", value: "9" },
      { label: "סועדים", value: "14" },
    ]}
  />
);
