import assert from "node:assert/strict";
import test from "node:test";

import {
  PORT_SCAN_IN_PROGRESS,
  replacePortScanFindings,
} from "@/server/services/port-scan.service";

test("PORT_SCAN_IN_PROGRESS is the overlap guard error code", () => {
  assert.equal(PORT_SCAN_IN_PROGRESS, "scan_in_progress");
});

test("replacePortScanFindings uses a transaction for delete and create", async () => {
  let transactionCalls = 0;
  let deleteCalled = false;
  let createCalled = false;

  const client = {
    $transaction: async (operations: Array<Promise<unknown>>) => {
      transactionCalls += 1;
      assert.equal(operations.length, 2);
      for (const operation of operations) {
        await operation;
      }
    },
    portScanFinding: {
      deleteMany: async () => {
        deleteCalled = true;
      },
      createMany: async () => {
        createCalled = true;
      },
    },
  };

  await replacePortScanFindings(
    "scan-1",
    [
      {
        port: 22,
        protocol: "tcp",
        state: "open",
        serviceName: "ssh",
        product: null,
        version: null,
        banner: null,
        cpe: null,
        source: "NAABU",
        enrichmentStatus: "ENRICHED",
        ufwCoverage: "UNKNOWN",
        rawJson: {},
      },
    ],
    client,
  );

  assert.equal(transactionCalls, 1);
  assert.equal(deleteCalled, true);
  assert.equal(createCalled, true);
});

test("replacePortScanFindings keeps delete-only transaction when findings are empty", async () => {
  let operationCount = 0;

  const client = {
    $transaction: async (operations: Array<Promise<unknown>>) => {
      operationCount = operations.length;
      for (const operation of operations) {
        await operation;
      }
    },
    portScanFinding: {
      deleteMany: async () => undefined,
      createMany: async () => undefined,
    },
  };

  await replacePortScanFindings("scan-1", [], client);

  assert.equal(operationCount, 1);
});

test("replacePortScanFindings propagates createMany failures inside transaction", async () => {
  const client = {
    $transaction: async (operations: Array<Promise<unknown>>) => {
      for (const operation of operations) {
        await operation;
      }
    },
    portScanFinding: {
      deleteMany: async () => undefined,
      createMany: async () => {
        throw new Error("create failed");
      },
    },
  };

  await assert.rejects(
    () =>
      replacePortScanFindings(
        "scan-1",
        [
          {
            port: 22,
            protocol: "tcp",
            state: "open",
            serviceName: "ssh",
            product: null,
            version: null,
            banner: null,
            cpe: null,
            source: "NAABU",
            enrichmentStatus: "ENRICHED",
            ufwCoverage: "UNKNOWN",
            rawJson: {},
          },
        ],
        client,
      ),
    /create failed/,
  );
});
