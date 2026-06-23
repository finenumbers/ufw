import assert from "node:assert/strict";
import test from "node:test";

import { normalizeImportRow } from "@/lib/imports/normalize-row";

test("normalizeImportRow reads table-order columns", () => {
  const row = normalizeImportRow({
    group: "SSH",
    name: "Allow SSH",
    action: "ALLOW",
    direction: "IN",
    interface: "eth0",
    fromAddress: "any",
    fromPort: "1024:65535",
    toAddress: "any",
    toPort: "22",
    protocol: "TCP",
    logMode: "NONE",
    ipv6: false,
  });

  assert.equal(row.group, "SSH");
  assert.equal(row.name, "Allow SSH");
  assert.equal(row.toPort, "22");
  assert.equal(row.ipv6, false);
});

test("normalizeImportRow supports legacy column aliases", () => {
  const row = normalizeImportRow({
    Action: "DENY",
    Direction: "OUT",
    From: "10.0.0.0/8",
    Port: "443",
    Group: "Web",
    Name: "Block outbound HTTPS",
  });

  assert.equal(row.action, "DENY");
  assert.equal(row.direction, "OUT");
  assert.equal(row.fromAddress, "10.0.0.0/8");
  assert.equal(row.toPort, "443");
  assert.equal(row.group, "Web");
  assert.equal(row.name, "Block outbound HTTPS");
});

test("normalizeImportRow accepts extended import fields after table columns", () => {
  const row = normalizeImportRow({
    group: "Apps",
    name: "Nginx",
    action: "ALLOW",
    appName: "Nginx Full",
    ruleComment: "web server",
    notes: "local note",
  });

  assert.equal(row.appName, "Nginx Full");
  assert.equal(row.ruleComment, "web server");
  assert.equal(row.notes, "local note");
});
