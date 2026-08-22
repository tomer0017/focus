import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { STORAGE_KEYS } from "../lib/storage/keys";
import { readJson, writeJson } from "../lib/storage/localStore";

import enCommon from "./locales/en/common.json";
import enDashboard from "./locales/en/dashboard.json";
import enPages from "./locales/en/pages.json";
import enProjects from "./locales/en/projects.json";
import enEvents from "./locales/en/events.json";
import enVision from "./locales/en/vision.json";
import enChecklist from "./locales/en/checklist.json";
import enCooking from "./locales/en/cooking.json";
import enTrips from "./locales/en/trips.json";
import enManage from "./locales/en/manage.json";
import enFamily from "./locales/en/family.json";
import enLeisure from "./locales/en/leisure.json";
import heCommon from "./locales/he/common.json";
import heDashboard from "./locales/he/dashboard.json";
import hePages from "./locales/he/pages.json";
import heProjects from "./locales/he/projects.json";
import heEvents from "./locales/he/events.json";
import heVision from "./locales/he/vision.json";
import heChecklist from "./locales/he/checklist.json";
import heCooking from "./locales/he/cooking.json";
import heTrips from "./locales/he/trips.json";
import heManage from "./locales/he/manage.json";
import heFamily from "./locales/he/family.json";
import heLeisure from "./locales/he/leisure.json";

export const SUPPORTED_LANGUAGES = ["he", "en"] as const;
export type Language = (typeof SUPPORTED_LANGUAGES)[number];

/** Hebrew is the default; a stored preference always wins. */
export const DEFAULT_LANGUAGE: Language = "he";

export function isLanguage(value: unknown): value is Language {
  return typeof value === "string" && (SUPPORTED_LANGUAGES as readonly string[]).includes(value);
}

/**
 * Reads the stored preference through the same storage layer as everything
 * else — the app has exactly one module that touches `window.localStorage`.
 * A missing or unreadable preference simply means the default.
 */
export function readStoredLanguage(): Language | null {
  const stored = readJson<string | null>(STORAGE_KEYS.language, null);
  return isLanguage(stored) ? stored : null;
}

export function storeLanguage(language: Language): void {
  writeJson(STORAGE_KEYS.language, language);
}

/**
 * Applies the language to the document itself: `lang` for assistive tech and
 * `dir` for layout. Everything RTL in the app follows from this one attribute
 * plus CSS logical properties — there is no second RTL layout.
 */
export function applyDocumentLanguage(language: Language): void {
  const root = document.documentElement;
  root.lang = language;
  root.dir = i18n.dir(language);
}

i18n.use(initReactI18next).init({
  resources: {
    en: {
      common: enCommon,
      dashboard: enDashboard,
      pages: enPages,
      projects: enProjects,
      events: enEvents,
      vision: enVision,
      checklist: enChecklist,
      cooking: enCooking,
      trips: enTrips,
      manage: enManage,
      family: enFamily,
      leisure: enLeisure,
    },
    he: {
      common: heCommon,
      dashboard: heDashboard,
      pages: hePages,
      projects: heProjects,
      events: heEvents,
      vision: heVision,
      checklist: heChecklist,
      cooking: heCooking,
      trips: heTrips,
      manage: heManage,
      family: heFamily,
      leisure: heLeisure,
    },
  },
  lng: readStoredLanguage() ?? DEFAULT_LANGUAGE,
  fallbackLng: DEFAULT_LANGUAGE,
  defaultNS: "common",
  ns: [
    "common",
    "dashboard",
    "pages",
    "projects",
    "events",
    "vision",
    "checklist",
    "cooking",
    "trips",
    "manage",
    "family",
    "leisure",
  ],
  interpolation: {
    // React already escapes everything it renders.
    escapeValue: false,
  },
});

export default i18n;
