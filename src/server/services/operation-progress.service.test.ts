import assert from "node:assert/strict";
import test from "node:test";

import {
  mergeOperationMetadata,
  updateStepStatus,
  upsertStep,
} from "@/server/services/operation-progress.service";

test("mergeOperationMetadata preserves steps when patching phaseI18n", () => {
  const merged = mergeOperationMetadata(
    {
      steps: [{ id: "a", label: "Step A", status: "PENDING" }],
      errors: [],
    },
    { phase: "ufw_commands", phaseI18n: { key: "phases.ufw_commands" } },
  );

  assert.equal(merged.phase, "ufw_commands");
  assert.equal(merged.phaseI18n?.key, "phases.ufw_commands");
  assert.equal(merged.steps?.length, 1);
});

test("upsertStep replaces existing step by id", () => {
  const steps = upsertStep(
    [{ id: "a", label: "Old", status: "PENDING" }],
    { id: "a", label: "New", kind: "command", status: "RUNNING" },
  );

  assert.equal(steps.length, 1);
  assert.equal(steps[0]?.label, "New");
  assert.equal(steps[0]?.status, "RUNNING");
});

test("updateStepStatus updates only matching step", () => {
  const steps = updateStepStatus(
    [
      { id: "a", label: "A", status: "PENDING" },
      { id: "b", label: "B", status: "PENDING" },
    ],
    "b",
    "FAILED",
    { error: "boom" },
  );

  assert.equal(steps[0]?.status, "PENDING");
  assert.equal(steps[1]?.status, "FAILED");
  assert.equal(steps[1]?.error, "boom");
});
