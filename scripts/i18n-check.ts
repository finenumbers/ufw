#!/usr/bin/env npx tsx
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const DYNAMIC_KEY_PREFIXES = [
  "operations.types.",
  "operations.messages.",
  "operations.steps.",
  "operations.phases.",
  "operations.status.",
];

function flattenKeys(value: unknown, prefix = ""): string[] {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return prefix ? [prefix] : [];
  }

  return Object.entries(value as Record<string, unknown>).flatMap(([key, nested]) =>
    flattenKeys(nested, prefix ? `${prefix}.${key}` : key),
  );
}

function collectSourceFiles(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return collectSourceFiles(full);
    }
    if (entry.isFile() && (full.endsWith(".ts") || full.endsWith(".tsx"))) {
      return [full];
    }
    return [];
  });
}

function readSourceText(): string {
  const srcDir = path.join(process.cwd(), "src");
  return collectSourceFiles(srcDir)
    .map((file) => fs.readFileSync(file, "utf8"))
    .join("\n");
}

function isDynamicKey(key: string): boolean {
  return DYNAMIC_KEY_PREFIXES.some((prefix) => key.startsWith(prefix));
}

function isKeyReferenced(key: string, sourceText: string): boolean {
  if (isDynamicKey(key)) {
    return true;
  }

  const leaf = key.split(".").pop();
  if (leaf && (sourceText.includes(`"${leaf}"`) || sourceText.includes(`'${leaf}'`))) {
    return true;
  }

  const parts = key.split(".");
  if (parts.length >= 2) {
    const suffix = parts.slice(1).join(".");
    if (sourceText.includes(`"${suffix}"`) || sourceText.includes(`'${suffix}'`)) {
      return true;
    }
  }

  return sourceText.includes(`"${key}"`) || sourceText.includes(`'${key}'`);
}

const messagesDir = path.join(process.cwd(), "src/i18n/messages");
const en = JSON.parse(fs.readFileSync(path.join(messagesDir, "en.json"), "utf8"));
const enKeys = new Set(flattenKeys(en));
const sourceText = readSourceText();

for (const file of fs.readdirSync(messagesDir).filter((name) => name.endsWith(".json") && name !== "en.json")) {
  const locale = JSON.parse(fs.readFileSync(path.join(messagesDir, file), "utf8"));
  const localeKeys = new Set(flattenKeys(locale));
  assert.deepEqual(localeKeys, enKeys, `${file} keys mismatch`);
}

const orphanKeys = [...enKeys].filter((key) => !isKeyReferenced(key, sourceText)).sort();
assert.equal(
  orphanKeys.length,
  0,
  `Orphan i18n keys in en.json (not referenced in src/): ${orphanKeys.join(", ")}`,
);

console.log(
  `i18n-check passed for ${fs.readdirSync(messagesDir).filter((f) => f.endsWith(".json")).length} locales (${enKeys.size} keys, 0 orphans)`,
);
