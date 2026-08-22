#!/usr/bin/env node
/**
 * Guard against placeholder destinations coming back.
 *
 * A card pointing at `example.com/cooler` looks like a working link and is not
 * one: it takes the user out of the app and lands them on a parking page. This
 * fails the check if a placeholder host, or a `url: "#"`, is written into the
 * client source again. Run with `npm run check:links`.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = "client/src";
const SKIP = new Set(["legacy", "node_modules"]);

/** Patterns that must never appear as a destination in source. */
const FORBIDDEN = [
  { pattern: /https?:\/\/(www\.)?example\.(com|org|net)/i, label: "placeholder host" },
  { pattern: /\burl:\s*["'`]#["'`]/, label: 'url: "#"' },
  { pattern: /\bhref=["']#["']/, label: 'href="#"' },
];

/** Files allowed to mention the patterns, because they define or test them. */
const ALLOWED_FILES = ["lib/links.ts"];

/**
 * Test files are exempt.
 *
 * This check exists to stop a placeholder destination being *rendered*. A test
 * that feeds one in to prove the migration strips it is the opposite of the
 * problem, and rewriting it to dodge a grep would make the test say less than
 * it means.
 */
const isTest = (file) => /\.test\.tsx?$/.test(file);

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    if (SKIP.has(entry)) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (/\.(ts|tsx|json)$/.test(entry)) out.push(full);
  }
  return out;
}

const problems = [];
for (const file of walk(ROOT)) {
  if (ALLOWED_FILES.some((allowed) => file.endsWith(allowed))) continue;
  if (isTest(file)) continue;
  const lines = readFileSync(file, "utf8").split("\n");
  lines.forEach((line, index) => {
    for (const { pattern, label } of FORBIDDEN) {
      if (pattern.test(line)) {
        problems.push(`${file}:${index + 1}  ${label}\n    ${line.trim()}`);
      }
    }
  });
}

if (problems.length > 0) {
  console.error(`Placeholder destinations found (${problems.length}):\n`);
  console.error(problems.join("\n"));
  console.error("\nA saved item with no real destination must have no `url` at all.");
  process.exit(1);
}

console.log("check:links — no placeholder destinations in client/src");
