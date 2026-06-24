import assert from "node:assert/strict";
import test from "node:test";

import { isOperationI18nKey } from "@/types/operation";
import { resolveOperationText, resolveStepLabel } from "@/lib/i18n/operations";

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
