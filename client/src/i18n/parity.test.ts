/**
 * Guards on the translation layer.
 *
 * These are the checks that used to be a paragraph in CLAUDE.md and a promise
 * to remember. A key added to `en/` and forgotten in `he/` renders as the raw
 * key path in half the app, and it is invisible to anyone testing in the other
 * language — which is exactly the kind of failure a test is for.
 */
import { describe, expect, it } from "vitest";

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

type Bundle = Record<string, unknown>;

const NAMESPACES: [string, Bundle, Bundle][] = [
  ["common", enCommon, heCommon],
  ["dashboard", enDashboard, heDashboard],
  ["pages", enPages, hePages],
  ["projects", enProjects, heProjects],
  ["events", enEvents, heEvents],
  ["vision", enVision, heVision],
  ["checklist", enChecklist, heChecklist],
  ["cooking", enCooking, heCooking],
  ["trips", enTrips, heTrips],
  ["manage", enManage, heManage],
  ["family", enFamily, heFamily],
  ["leisure", enLeisure, heLeisure],
];

function flatten(bundle: Bundle, prefix = ""): string[] {
  return Object.entries(bundle).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return value !== null && typeof value === "object"
      ? flatten(value as Bundle, path)
      : [path];
  });
}

/**
 * Strips i18next's plural suffix.
 *
 * Hebrew has one / two / many / other and English has one / other, so the two
 * files legitimately differ in *how many* variants a plural key has. What they
 * must not differ in is which keys exist at all.
 */
const PLURAL = /_(zero|one|two|few|many|other)$/;

function baseKeys(bundle: Bundle): Set<string> {
  return new Set(flatten(bundle).map((key) => key.replace(PLURAL, "")));
}

describe("translation parity", () => {
  it.each(NAMESPACES)("%s has the same keys in both languages", (_name, en, he) => {
    const english = baseKeys(en);
    const hebrew = baseKeys(he);

    expect([...english].filter((key) => !hebrew.has(key))).toEqual([]);
    expect([...hebrew].filter((key) => !english.has(key))).toEqual([]);
  });

  it.each(NAMESPACES)("%s has no empty values", (_name, en, he) => {
    for (const bundle of [en, he]) {
      const empties = flatten(bundle).filter((path) => {
        const value = path
          .split(".")
          .reduce<unknown>((current, part) => (current as Bundle)?.[part], bundle);
        return typeof value === "string" && value.trim() === "";
      });
      expect(empties).toEqual([]);
    }
  });

  it.each(NAMESPACES)("%s keeps the same interpolation names in both languages", (_name, en, he) => {
    const read = (bundle: Bundle, path: string): unknown =>
      path.split(".").reduce<unknown>((current, part) => (current as Bundle)?.[part], bundle);

    const placeholders = (value: unknown): string[] =>
      typeof value === "string" ? [...value.matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1]).sort() : [];

    /*
     * Mismatches are collected and asserted once, so a failure names every
     * offending key rather than stopping at the first.
     */
    const mismatches: string[] = [];

    for (const path of flatten(en)) {
      const english = placeholders(read(en, path));
      if (english.length === 0) continue;
      // The Hebrew counterpart may carry a plural suffix the English one does
      // not; a genuinely missing key is caught by the parity test above.
      const hebrew = placeholders(read(he, path));
      if (hebrew.length === 0) continue;
      if (hebrew.join(",") !== english.join(",")) {
        mismatches.push(`${path}: en(${english.join(",")}) he(${hebrew.join(",")})`);
      }
    }

    expect(mismatches).toEqual([]);
  });
});

describe("Hebrew plurals", () => {
  it("supplies two and many wherever a plural is used", () => {
    // `Intl.PluralRules` for Hebrew returns one / two / many / other, so a key
    // with only one/other renders the wrong form for 2 and for 12.
    const hebrewBundles = NAMESPACES.map(([, , he]) => he);
    const missing: string[] = [];

    for (const bundle of hebrewBundles) {
      const keys = flatten(bundle);
      const plurals = new Set(
        keys.filter((key) => PLURAL.test(key)).map((key) => key.replace(PLURAL, ""))
      );
      for (const base of plurals) {
        for (const form of ["one", "two", "many", "other"]) {
          if (!keys.includes(`${base}_${form}`)) missing.push(`${base}_${form}`);
        }
      }
    }

    expect(missing).toEqual([]);
  });
});
