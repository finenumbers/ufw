import assert from "node:assert/strict";
import test from "node:test";

import { applyAddressResults } from "@/lib/reachability/cycle";
import type { ProbeTarget } from "@/lib/reachability/target";

const up: ProbeTarget = { kind: "ip", ip: "203.0.113.10" };
const down: ProbeTarget = { kind: "ip", ip: "203.0.113.11" };

test("applyAddressResults keeps each address independent", () => {
  const result = applyAddressResults({
    servers: [
      { id: "a", host: "203.0.113.10" },
      { id: "b", host: "203.0.113.11" },
    ],
    targets: new Map([
      ["203.0.113.10", up],
      ["203.0.113.11", down],
    ]),
    outcomes: new Map([
      ["203.0.113.10", { kind: "reply", rttMs: 83 }],
      ["203.0.113.11", { kind: "timeout" }],
    ]),
    previous: new Map(),
  });

  assert.deepEqual(result.servers, [
    { id: "a", status: "reachable", rttMs: 83 },
    { id: "b", status: "unreachable", rttMs: null },
  ]);
});

test("applyAddressResults copies one shared address to every matching server", () => {
  const result = applyAddressResults({
    servers: [
      { id: "a", host: "203.0.113.10" },
      { id: "b", host: "203.0.113.10" },
      { id: "c", host: "203.0.113.11" },
    ],
    targets: new Map([
      ["203.0.113.10", up],
      ["203.0.113.11", down],
    ]),
    outcomes: new Map([["203.0.113.10", { kind: "reply", rttMs: 12 }]]),
    previous: new Map(),
  });

  assert.deepEqual(result.servers, [
    { id: "a", status: "reachable", rttMs: 12 },
    { id: "b", status: "reachable", rttMs: 12 },
    { id: "c", status: "unreachable", rttMs: null },
  ]);
});
