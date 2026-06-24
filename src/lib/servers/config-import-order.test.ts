import assert from "node:assert/strict";
import test from "node:test";

import { serverConfigKey } from "@/lib/servers/config-format";

test("config import delete set excludes servers still present in desired config", () => {
  const existing = [
    { host: "a.example.com", port: 22, identityName: "prod" },
    { host: "b.example.com", port: 22, identityName: "prod" },
  ];

  const desired = [{ host: "a.example.com", port: 22, identityName: "prod" }];

  const desiredKeys = new Set(
    desired.map((entry) => serverConfigKey(entry.host, entry.port, entry.identityName)),
  );

  const toDelete = existing.filter(
    (entry) => !desiredKeys.has(serverConfigKey(entry.host, entry.port, entry.identityName)),
  );

  assert.equal(toDelete.length, 1);
  assert.equal(toDelete[0]?.host, "b.example.com");
});
