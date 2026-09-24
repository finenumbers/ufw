import assert from "node:assert/strict";
import test from "node:test";

import { applyAddressResults } from "@/lib/reachability/cycle";
import type { HostObservation } from "@/lib/reachability/sample";

const reachable: HostObservation = {
  status: "reachable",
  rttMs: 12,
  consecutiveFailures: 0,
};

test("applyAddressResults keeps each host independent", () => {
  const result = applyAddressResults({
    servers: [
      { id: "a", host: "poland.gate.finenumbers.com" },
      { id: "b", host: "203.0.113.11" },
    ],
    skipped: new Set(),
    outcomes: new Map([
      ["poland.gate.finenumbers.com", { kind: "reply", rttMs: 83 }],
      ["203.0.113.11", { kind: "timeout" }],
    ]),
    previous: new Map(),
  });

  assert.equal(result.probeUnavailable, false);
  assert.deepEqual(result.servers, [
    { id: "a", status: "reachable", rttMs: 83 },
    { id: "b", status: "unreachable", rttMs: null },
  ]);
});

test("applyAddressResults copies one shared host to every matching server", () => {
  const result = applyAddressResults({
    servers: [
      { id: "a", host: "203.0.113.10" },
      { id: "b", host: "203.0.113.10" },
      { id: "c", host: "203.0.113.11" },
    ],
    skipped: new Set(),
    outcomes: new Map([["203.0.113.10", { kind: "reply", rttMs: 12 }]]),
    previous: new Map(),
  });

  assert.deepEqual(result.servers, [
    { id: "a", status: "reachable", rttMs: 12 },
    { id: "b", status: "reachable", rttMs: 12 },
    { id: "c", status: "unknown", rttMs: null },
  ]);
});

test("applyAddressResults does not paint the fleet when ping cannot run", () => {
  const result = applyAddressResults({
    servers: [
      { id: "a", host: "poland.gate.finenumbers.com" },
      { id: "b", host: "203.0.113.11" },
    ],
    skipped: new Set(),
    outcomes: new Map([
      ["poland.gate.finenumbers.com", { kind: "unavailable", reason: "ENOENT" }],
      ["203.0.113.11", { kind: "timeout" }],
    ]),
    previous: new Map([["203.0.113.11", reachable]]),
  });

  assert.equal(result.probeUnavailable, true);
  assert.deepEqual(result.servers, [
    { id: "a", status: "unknown", rttMs: null },
    { id: "b", status: "reachable", rttMs: 12 },
  ]);
});

test("applyAddressResults leaves skipped hosts without a badge", () => {
  const result = applyAddressResults({
    servers: [{ id: "a", host: "127.0.0.1" }],
    skipped: new Set(["127.0.0.1"]),
    outcomes: new Map(),
    previous: new Map(),
  });

  assert.equal(result.probeUnavailable, false);
  assert.deepEqual(result.servers, [{ id: "a", status: "unknown", rttMs: null }]);
});
