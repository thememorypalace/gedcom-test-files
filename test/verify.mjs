// Checks that every file shows the faults listed in manifest.json, using
// @thememorypalace/gedcom-tools as one reference reader. Other tools may
// name or grade the faults differently; the manifest describes the intent.
// Run with: npm test

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { checkGedcom } from "@thememorypalace/gedcom-tools";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(readFileSync(join(root, "manifest.json"), "utf8"));
const verbose = process.argv.includes("--verbose");
let failed = 0;

for (const entry of manifest) {
  const result = checkGedcom(readFileSync(join(root, entry.file)));
  const found = new Set(result.issues.map((i) => i.code));
  const missing = entry.faults.filter((f) => !found.has(f));
  // A file meant to be clean must not produce errors or warnings.
  // Differences that are known bugs in the reference reader are listed in the manifest and reported, not failed.
  const known = new Set((entry.knownDifferences ?? []).flatMap((d) => d.codes));
  const unexpected = entry.faults.length === 0 ? result.issues.filter((i) => i.severity !== "info" && !known.has(i.code)).map((i) => i.code) : [];
  const ok = missing.length === 0 && unexpected.length === 0;
  if (!ok) failed++;
  const detail = verbose ? `  [${result.issues.map((i) => `${i.code}:${i.severity}`).join(" ")}]` : "";
  const knownNote = [...known].filter((c) => found.has(c)).length ? "  (known difference in the reference reader)" : "";
  console.log(`${ok ? "ok  " : "FAIL"} ${entry.file}${knownNote}${missing.length ? `  missing: ${missing.join(", ")}` : ""}${unexpected.length ? `  unexpected: ${unexpected.join(", ")}` : ""}${detail}`);
}

console.log(`\n${manifest.length - failed} of ${manifest.length} files as described`);
process.exit(failed ? 1 : 0);
