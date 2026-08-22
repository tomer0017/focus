/**
 * Source hygiene.
 *
 * The rules in CLAUDE.md that were previously enforced by remembering them.
 * Each of these has already been broken at least once in this repository's
 * history, and each is invisible until somebody opens the app in the other
 * language or at the wrong width.
 *
 * These read the source as text on purpose. A lint rule would be the tidier
 * home for some of them, but writing four custom ESLint plugins to check four
 * greps is not a trade this project makes.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/*
 * `fileURLToPath`, not `url.pathname`: this repository lives under a Hebrew
 * directory name, and a URL's pathname is percent-encoded.
 */
const ROOT = fileURLToPath(new URL(".", import.meta.url));
const SKIP = new Set(["legacy", "node_modules", ".claude", "assets"]);

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    if (SKIP.has(entry)) return [];
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return walk(full);
    return /\.(ts|tsx)$/.test(entry) ? [full] : [];
  });
}

const FILES = walk(ROOT).filter((file) => !file.endsWith(".test.ts") && !file.endsWith(".test.tsx"));
const TSX = FILES.filter((file) => file.endsWith(".tsx"));

/** Path relative to `src`, for a readable failure message. */
const rel = (file: string): string => file.slice(ROOT.length);

interface Hit {
  file: string;
  line: number;
  text: string;
}

function scan(files: string[], pattern: RegExp, skipLine?: (line: string) => boolean): Hit[] {
  const hits: Hit[] = [];
  for (const file of files) {
    readFileSync(file, "utf8")
      .split("\n")
      .forEach((line, index) => {
        if (skipLine?.(line)) return;
        if (pattern.test(line)) hits.push({ file: rel(file), line: index + 1, text: line.trim() });
      });
  }
  return hits;
}

/** Comment lines are prose about the rules, not code that breaks them. */
const isComment = (line: string): boolean => /^\s*(\/\/|\*|\/\*)/.test(line);

describe("direction-agnostic layout", () => {
  it("uses no Bootstrap physical spacing utilities", () => {
    // The project ships the LTR Bootstrap build in both directions, so `ms-2`
    // would not flip in Hebrew. Logical `focus-*` classes and flex gaps do.
    const hits = scan(
      TSX,
      /className=\{?["'`][^"'`]*(?<![\w-])(m[se]-(auto|[0-5])|p[se]-[0-5]|text-(start|end)|float-(start|end|left|right))(?![\w-])/,
      isComment
    );
    expect(hits).toEqual([]);
  });

  it("uses no physical CSS properties in the stylesheet", () => {
    const css = readFileSync(join(ROOT, "index.css"), "utf8").split("\n");

    /*
     * Zeroing a physical property is allowed, and is how Bootstrap's own
     * physical rules are undone before a logical one replaces them —
     * `padding-left: 0` cannot favour a direction. Any non-zero value can.
     */
    const isZero = (line: string): boolean => /:\s*0(px|rem|em|%)?\s*(!important)?\s*;/.test(line);

    const offenders: string[] = [];
    css.forEach((line, index) => {
      const physical =
        /^\s*(margin|padding|border)-(left|right)\s*:/.test(line) ||
        /^\s*(left|right)\s*:/.test(line);
      if (physical && !isZero(line)) {
        offenders.push(`index.css:${index + 1} ${line.trim()}`);
      }
    });
    expect(offenders).toEqual([]);
  });
});

describe("no hardcoded interface strings", () => {
  /**
   * Attributes that are read aloud or shown, and therefore must be translated.
   *
   * A literal is only flagged when it contains a letter — `alt=""` is the
   * correct, deliberate value for a decorative image, and `placeholder="https://"`
   * is a format hint rather than language.
   */
  const ATTRIBUTES = ["placeholder", "aria-label", "title", "alt"];

  it.each(ATTRIBUTES)("has no literal %s in JSX", (attribute) => {
    const pattern = new RegExp(`${attribute}=["'][^"'{]*[A-Za-z\\u0590-\\u05FF][^"']*["']`);
    const hits = scan(TSX, pattern, isComment).filter(
      (hit) =>
        // A URL scheme is a format, not a sentence.
        !/=["']https?:\/\/["']/.test(hit.text) &&
        // Bare `alt=""` never matches; an alt bound to user content is fine.
        !/alt=\{/.test(hit.text)
    );
    expect(hits).toEqual([]);
  });
});

describe("storage boundary", () => {
  it("touches window.localStorage in exactly one module", () => {
    const hits = scan(FILES, /window\.localStorage/, isComment);
    expect([...new Set(hits.map((hit) => hit.file))]).toEqual(["lib/storage/localStore.ts"]);
  });

  it("never calls alert() for an error", () => {
    // CLAUDE.md: an error is an ErrorState, never a browser dialog.
    expect(scan(FILES, /(?<![\w.])alert\s*\(/, isComment)).toEqual([]);
  });
});

describe("date and number formatting", () => {
  it("constructs Intl formatters only in lib/format.ts", () => {
    const hits = scan(FILES, /new Intl\.(DateTimeFormat|NumberFormat|RelativeTimeFormat)/, isComment);
    expect([...new Set(hits.map((hit) => hit.file))]).toEqual(["lib/format.ts"]);
  });

  it("never formats a date inline with toLocaleDateString", () => {
    expect(scan(FILES, /toLocale(Date|Time)String/, isComment)).toEqual([]);
  });
});

describe("legacy", () => {
  it("is excluded from the type-checked and linted source", () => {
    // Nothing may import from it, which is what keeps it archived rather than
    // half-maintained.
    expect(scan(FILES, /from ["'][^"']*\/legacy\//, isComment)).toEqual([]);
  });
});
