#!/usr/bin/env npx tsx
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function flattenKeys(value: unknown, prefix = ""): string[] {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return prefix ? [prefix] : [];
  }

  return Object.entries(value as Record<string, unknown>).flatMap(([key, nested]) =>
    flattenKeys(nested, prefix ? `${prefix}.${key}` : key),
  );
}

const messagesDir = path.join(process.cwd(), "src/i18n/messages");
const en = JSON.parse(fs.readFileSync(path.join(messagesDir, "en.json"), "utf8"));
const enKeys = new Set(flattenKeys(en));

for (const file of fs.readdirSync(messagesDir).filter((name) => name.endsWith(".json") && name !== "en.json")) {
  const locale = JSON.parse(fs.readFileSync(path.join(messagesDir, file), "utf8"));
  const localeKeys = new Set(flattenKeys(locale));
  assert.deepEqual(localeKeys, enKeys, `${file} keys mismatch`);
}

console.log(`i18n-check passed for ${fs.readdirSync(messagesDir).filter((f) => f.endsWith('.json')).length} locales`);
