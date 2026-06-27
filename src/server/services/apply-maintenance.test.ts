import assert from "node:assert/strict";
import test from "node:test";

import {
  prepareServersForMaintenanceOperation,
  sweepStalePortScans,
  sweepStaleRunningOperationLogs,
} from "@/server/services/apply-maintenance";

test("apply-maintenance exports sweep helpers", () => {
  assert.equal(typeof sweepStalePortScans, "function");
  assert.equal(typeof sweepStaleRunningOperationLogs, "function");
  assert.equal(typeof prepareServersForMaintenanceOperation, "function");
});
