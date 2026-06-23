import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import { isOperationI18nKey } from "@/types/operation";
import { resolveOperationText, resolveStepLabel } from "@/lib/i18n/operations";

function flattenKeys(value: unknown, prefix = ""): string[] {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return prefix ? [prefix] : [];
  }

  return Object.entries(value as Record<string, unknown>).flatMap(([key, nested]) =>
    flattenKeys(nested, prefix ? `${prefix}.${key}` : key),
  );
}

test("all locale files have the same keys as en.json", () => {
  const messagesDir = path.join(process.cwd(), "src/i18n/messages");
  const en = JSON.parse(fs.readFileSync(path.join(messagesDir, "en.json"), "utf8"));
  const enKeys = new Set(flattenKeys(en));

  for (const file of fs.readdirSync(messagesDir).filter((name) => name.endsWith(".json") && name !== "en.json")) {
    const locale = JSON.parse(fs.readFileSync(path.join(messagesDir, file), "utf8"));
    const localeKeys = new Set(flattenKeys(locale));
    assert.deepEqual(localeKeys, enKeys, `${file} keys mismatch`);
  }
});

test("resolveOperationText uses i18n ref and legacy fallback", () => {
  const text = resolveOperationText(
    (key) => (key === "messages.apply_complete" ? "Done" : key),
    { key: "messages.apply_complete" },
    "legacy",
  );
  assert.equal(text, "Done");

  const legacy = resolveOperationText(
    () => "unused",
    undefined,
    "Старый текст",
  );
  assert.equal(legacy, "Старый текст");
});

test("resolveStepLabel keeps command labels untranslated", () => {
  const label = resolveStepLabel(
    () => "translated",
    { kind: "command", label: "ufw allow 22/tcp", status: "SUCCESS" },
  );
  assert.equal(label, "ufw allow 22/tcp");
});

test("isOperationI18nKey detects message keys", () => {
  assert.equal(isOperationI18nKey("messages.apply_complete"), true);
  assert.equal(isOperationI18nKey("Готово"), false);
});
