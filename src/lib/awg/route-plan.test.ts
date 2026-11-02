import assert from "node:assert/strict";
import test from "node:test";

import {
  decideHostRemoval,
  decideOrphanRemoval,
  parseKernelRoutes,
  planReconcile,
  projectAwgRoutes,
} from "@/lib/awg/route-plan";

test("parseKernelRoutes reads bare host routes and ignores networks", () => {
  assert.deepEqual(
    parseKernelRoutes([
      { dst: "10.8.0.5", dev: "awg0" },
      { dst: "10.8.0.6/32" },
      { dst: "10.0.0.0/24" },
      { dst: "default" },
      { dst: "10.8.0.5" },
      { dst: "2001:db8::1" },
    ]),
    ["10.8.0.5", "10.8.0.6"],
  );
});

test("removal compares literal addresses with leading zeros", () => {
  assert.deepEqual(
    decideHostRemoval({
      host: "10.8.0.01",
      records: [],
      kernelIps: ["10.8.0.1"],
      resolvedIp: null,
      otherHosts: [],
    }),
    { kind: "apply", ip: "10.8.0.1", deleteIp: "10.8.0.1", routeKept: false },
  );
});

test("removal deletes the recorded route instead of a newer DNS answer", () => {
  assert.deepEqual(
    decideHostRemoval({
      host: "node.example",
      records: [{ ip: "10.8.0.5", host: "node.example" }],
      kernelIps: ["10.8.0.5", "10.8.0.9"],
      resolvedIp: "10.8.0.9",
      otherHosts: [],
    }),
    { kind: "apply", ip: "10.8.0.5", deleteIp: "10.8.0.5", routeKept: false },
  );
});

test("removal keeps a /32 that another host still uses", () => {
  const decision = decideHostRemoval({
    host: "web.example",
    records: [
      { ip: "10.8.0.5", host: "web.example" },
      { ip: "10.8.0.5", host: "db.example" },
    ],
    kernelIps: ["10.8.0.5"],
    resolvedIp: null,
    otherHosts: ["db.example"],
  });
  assert.deepEqual(decision, {
    kind: "apply",
    ip: "10.8.0.5",
    deleteIp: null,
    routeKept: true,
  });
});

test("removal keeps a /32 claimed by another literal address", () => {
  const decision = decideHostRemoval({
    host: "web.example",
    records: [{ ip: "10.8.0.5", host: "web.example" }],
    kernelIps: ["10.8.0.5"],
    resolvedIp: null,
    otherHosts: ["10.8.0.05"],
  });
  assert.equal(decision.kind, "apply");
  if (decision.kind === "apply") {
    assert.equal(decision.routeKept, true);
    assert.equal(decision.deleteIp, null);
  }
});

test("a hostname with no record and no DNS answer is not removed", () => {
  assert.deepEqual(
    decideHostRemoval({
      host: "node.example",
      records: [],
      kernelIps: ["10.8.0.8"],
      resolvedIp: null,
      otherHosts: [],
    }),
    { kind: "abort" },
  );
});

test("a resolved address that is not installed only clears the flag", () => {
  assert.deepEqual(
    decideHostRemoval({
      host: "node.example",
      records: [],
      kernelIps: ["10.9.0.1"],
      resolvedIp: "10.8.0.5",
      otherHosts: [],
    }),
    { kind: "apply", ip: "10.8.0.5", deleteIp: null, routeKept: false },
  );
});

test("reconcile keeps the previous address when DNS fails", () => {
  const planned = planReconcile({
    hosts: ["a.example", "b.example"],
    records: [
      { ip: "10.8.0.5", host: "a.example" },
      { ip: "10.8.0.6", host: "b.example" },
    ],
    kernelIps: ["10.8.0.5", "10.8.0.6"],
    resolvedByHost: new Map<string, string | null>([
      ["a.example", null],
      ["b.example", "10.8.0.6"],
    ]),
  });
  assert.deepEqual(
    planned.records.map((record) => record.ip).sort(),
    ["10.8.0.5", "10.8.0.6"],
  );
});

test("reconcile follows a successful resolve and releases the previous address", () => {
  const planned = planReconcile({
    hosts: ["a.example"],
    records: [{ ip: "10.8.0.5", host: "a.example" }],
    kernelIps: ["10.8.0.5"],
    resolvedByHost: new Map<string, string | null>([["a.example", "10.8.0.7"]]),
  });
  assert.deepEqual(planned.records, [{ ip: "10.8.0.7", host: "a.example" }]);
});

test("reconcile drops an unclaimed kernel route when every host is resolved", () => {
  const planned = planReconcile({
    hosts: ["a.example"],
    records: [{ ip: "10.8.0.5", host: "a.example" }],
    kernelIps: ["10.8.0.5", "10.8.0.9"],
    resolvedByHost: new Map<string, string | null>([["a.example", "10.8.0.5"]]),
  });
  assert.deepEqual(
    planned.records.map((record) => record.ip),
    ["10.8.0.5"],
  );
});

test("reconcile keeps an unclaimed kernel route while a host is unresolved", () => {
  const planned = planReconcile({
    hosts: ["a.example", "b.example"],
    records: [{ ip: "10.8.0.5", host: "a.example" }],
    kernelIps: ["10.8.0.5", "10.8.0.9"],
    resolvedByHost: new Map<string, string | null>([
      ["a.example", "10.8.0.5"],
      ["b.example", null],
    ]),
  });
  assert.deepEqual(
    planned.records.map((record) => record.ip).sort(),
    ["10.8.0.5", "10.8.0.9"],
  );
});

test("projection joins servers to installed routes and leaves the rest as orphans", () => {
  const view = projectAwgRoutes({
    servers: [
      { id: "1", name: "web", host: "web.example", port: 22 },
      { id: "2", name: "db", host: "10.8.0.6", port: 2222 },
      { id: "3", name: "web-2", host: "Web.Example", port: 22 },
    ],
    records: [{ ip: "10.8.0.5", host: "web.example" }],
    kernelIps: ["10.8.0.5", "10.8.0.6", "10.8.0.9"],
  });

  assert.equal(view.servers[0]?.installed, true);
  assert.equal(view.servers[0]?.ip, "10.8.0.5");
  assert.deepEqual(
    view.servers[0]?.sameHost.map((server) => server.id),
    ["1", "3"],
  );
  assert.equal(view.servers[1]?.installed, true);
  assert.equal(view.servers[1]?.ip, "10.8.0.6");
  assert.deepEqual(view.orphans, [{ ip: "10.8.0.9" }]);
});

test("an orphan route that still belongs to a node is refused", () => {
  assert.deepEqual(
    decideOrphanRemoval({
      ip: "10.8.0.5",
      records: [{ ip: "10.8.0.5", host: "web.example" }],
      kernelIps: ["10.8.0.5"],
      hosts: ["web.example"],
    }),
    { ok: false, reason: "claimed" },
  );
  assert.deepEqual(
    decideOrphanRemoval({
      ip: "10.8.0.9",
      records: [],
      kernelIps: ["10.8.0.9"],
      hosts: ["web.example"],
    }),
    { ok: true, ip: "10.8.0.9" },
  );
});
