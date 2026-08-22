import { TemplatePicker } from "focus-client";

/**
 * The one picker: what you used last, then what is recommended, then — only if
 * asked — everything. Forty options on arrival is how a template system stops
 * being used, so "all templates" stays collapsed behind a count.
 *
 * Nothing appears twice. A template that is both recent and recommended is
 * listed under Recent only, which is the same de-duplication rule the overview
 * follows.
 *
 * `name` and `hint` are interface copy that the *caller* has already
 * translated — the picker never translates anything itself, which is what lets
 * one component serve checklists, reminders, menus, profiles and learning
 * pages without knowing about any of them.
 */

type PickerTemplate = {
  id: string;
  name: string;
  hint?: string;
  recommended?: boolean;
};

const SHOPPING: PickerTemplate[] = [
  {
    id: "shop-weekly",
    name: "קנייה שבועית",
    hint: "מסודר לפי הדרך שבה מסודר הסופר.",
    recommended: true,
  },
  { id: "shop-shabbat", name: "קנייה לשבת", hint: "חלות, יין, דגים ותוספות.", recommended: true },
  { id: "shop-monthly", name: "קנייה חודשית", hint: "שימורים, ניקיון ומה שנקנה בגדול." },
  { id: "shop-holiday", name: "קנייה לחג" },
  { id: "shop-hosting", name: "אירוח", hint: "מה שנגמר תמיד כשמגיעים אורחים." },
  { id: "shop-pharmacy", name: "בית מרקחת" },
];

const QUICK_CREATE: PickerTemplate[] = [
  {
    id: "tpl-insurance",
    name: "פוליסת ביטוח",
    hint: "חברה, עלות, תאריך חידוש ותזכורת.",
    recommended: true,
  },
  {
    id: "tpl-subscription",
    name: "מנוי",
    hint: "שירות, מחיר, תדירות חיוב והיכן מבטלים.",
    recommended: true,
  },
  {
    id: "tpl-appointment",
    name: "תור לרופא",
    hint: "תאריך, מקום, מה להביא ומה לעשות לפני.",
    recommended: true,
  },
  { id: "tpl-checkup", name: "מעקב רפואי", hint: "בדיקה שחוזרת, והתוצאה האחרונה שרשמת." },
  {
    id: "tpl-medication",
    name: "תרופה או ויטמין",
    hint: "שעות ביום והמינון שקיבלת.",
    recommended: true,
  },
  { id: "tpl-menu-shabbat", name: "תפריט שבת", hint: "מנות, סועדים, ורשימת קניות כשתבקש." },
  { id: "tpl-birthday", name: "יום הולדת", hint: "מחשב את התאריך כל שנה מתוך תאריך הלידה." },
];

const noop = () => {};

/**
 * The shopping flow, as `NewListModal` composes it: one template used last
 * week, the rest recommended, everything else folded away.
 */
export const ShoppingTemplates = () => (
  <TemplatePicker
    templates={SHOPPING}
    recentIds={["shop-shabbat"]}
    onPick={noop}
    label="בחירת תבנית"
  />
);

/**
 * Quick create, where the same picker feeds five entirely different forms.
 * Two recents push two of the recommended entries out of that group rather
 * than listing them in both.
 */
export const QuickCreateTemplates = () => (
  <TemplatePicker
    templates={QUICK_CREATE}
    recentIds={["tpl-appointment", "tpl-medication"]}
    onPick={noop}
    label="בחירת תבנית"
  />
);

/** Nothing used yet: the Recent group renders nothing at all, heading included. */
export const NothingUsedYet = () => (
  <TemplatePicker templates={SHOPPING} recentIds={[]} onPick={noop} label="בחירת תבנית" />
);

/** Inside the dialog it actually lives in, under its own label. */
export const InAForm = () => (
  <div className="focus-form-stack" style={{ maxInlineSize: 460 }}>
    <div>
      <p className="form-label fw-medium mb-1">התחלה מתבנית</p>
      <TemplatePicker
        templates={SHOPPING}
        recentIds={["shop-weekly", "shop-holiday"]}
        onPick={noop}
        label="בחירת תבנית"
      />
    </div>
  </div>
);
