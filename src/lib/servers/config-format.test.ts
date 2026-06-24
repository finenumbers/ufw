import assert from "node:assert/strict";
import test from "node:test";

import {
  assertUniqueServerConfigKeys,
  buildServersConfigFilename,
  diffServersConfigEntries,
  normalizeServersConfigFile,
  parseNormalizedServersConfigFile,
  parseServersConfigFile,
  serializeServersConfigFile,
  serverConfigKey,
  UNSUPPORTED_CONFIG_FORMAT_MESSAGE,
} from "@/lib/servers/config-format";

const baseIdentity = {
  name: "Prod root",
  username: "root",
  authMethod: "PASSWORD" as const,
  password: "secret",
};

const baseEntryV1 = {
  name: "Prod",
  host: "203.0.113.10",
  port: 22,
  username: "root",
  authMethod: "PASSWORD" as const,
  sshHostKeyFingerprint: "SHA256:abc",
  password: "secret",
};

const baseEntryV2 = {
  name: "Prod",
  host: "203.0.113.10",
  port: 22,
  identityName: "Prod root",
  sshHostKeyFingerprint: "SHA256:abc",
};

test("parseServersConfigFile rejects legacy array-only configuration", () => {
  assert.throws(
    () => parseServersConfigFile(JSON.stringify([baseEntryV1])),
    new RegExp(UNSUPPORTED_CONFIG_FORMAT_MESSAGE.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
  );
});

test("parseServersConfigFile rejects v1 configuration files", () => {
  assert.throws(
    () =>
      parseServersConfigFile(
        JSON.stringify({
          format: "ufw-remote-manager-servers",
          version: 1,
          servers: [baseEntryV1],
        }),
      ),
    new RegExp(UNSUPPORTED_CONFIG_FORMAT_MESSAGE.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
  );
});

test("parseServersConfigFile rejects empty server entries produced by broken client export", () => {
  assert.throws(
    () =>
      parseServersConfigFile(
        serializeServersConfigFile({
          format: "ufw-remote-manager-servers",
          version: 2,
          exportedAt: "2026-06-23T12:00:00.000Z",
          identities: [baseIdentity],
          servers: [{}, {}, {}] as never,
        }),
      ),
    /servers\.0\.name: Required/,
  );
});

test("serializeServersConfigFile round-trips v2 through parseServersConfigFile", () => {
  const data = {
    format: "ufw-remote-manager-servers" as const,
    version: 2 as const,
    exportedAt: "2026-06-23T12:00:00.000Z",
    identities: [baseIdentity],
    servers: [baseEntryV2],
  };

  const parsed = parseServersConfigFile(serializeServersConfigFile(data));
  assert.deepEqual(parsed, data);
});

test("parseNormalizedServersConfigFile accepts v2 configuration", () => {
  const normalized = parseNormalizedServersConfigFile(
    serializeServersConfigFile({
      format: "ufw-remote-manager-servers",
      version: 2,
      exportedAt: "2026-06-23T12:00:00.000Z",
      identities: [baseIdentity],
      servers: [baseEntryV2],
    }),
  );

  assert.equal(normalized.identities.length, 1);
  assert.equal(normalized.servers[0]?.identityName, "Prod root");
});

test("assertUniqueServerConfigKeys rejects duplicate server keys", () => {
  assert.throws(
    () =>
      assertUniqueServerConfigKeys([
        { host: "203.0.113.10", port: 22, identityName: "Prod root" },
        { host: "203.0.113.10", port: 22, identityName: "Prod root" },
      ]),
    /Duplicate server entry/,
  );
});

test("diffServersConfigEntries detects create update and delete", () => {
  const incoming = normalizeServersConfigFile({
    format: "ufw-remote-manager-servers",
    version: 2,
    identities: [
      baseIdentity,
      {
        name: "Staging admin",
        username: "admin",
        authMethod: "PASSWORD",
        password: "other",
      },
    ],
    servers: [
      baseEntryV2,
      {
        name: "Staging",
        host: "198.51.100.2",
        port: 22,
        identityName: "Staging admin",
      },
    ],
  });

  const diff = diffServersConfigEntries(incoming, [
    {
      id: "1",
      name: "Renamed Prod",
      host: "203.0.113.10",
      port: 22,
      identityName: "Prod root",
      sshHostKeyFingerprint: "SHA256:abc",
      identity: baseIdentity,
    },
    {
      id: "2",
      name: "Legacy",
      host: "192.0.2.5",
      port: 22,
      identityName: "Legacy root",
      sshHostKeyFingerprint: null,
      identity: {
        name: "Legacy root",
        username: "root",
        authMethod: "PASSWORD",
        password: "legacy",
      },
    },
  ]);

  assert.equal(diff.toCreate.length, 1);
  assert.equal(diff.toCreate[0]?.host, "198.51.100.2");
  assert.equal(diff.toUpdate.length, 1);
  assert.equal(diff.toUpdate[0]?.host, "203.0.113.10");
  assert.equal(diff.toDelete.length, 1);
  assert.equal(diff.toDelete[0]?.host, "192.0.2.5");
});

test("serverConfigKey is case-insensitive for host", () => {
  assert.equal(
    serverConfigKey("Example.com", 22, "Prod root"),
    serverConfigKey("example.com", 22, "Prod root"),
  );
});

test("buildServersConfigFilename uses ISO date", () => {
  assert.equal(
    buildServersConfigFilename(new Date("2026-06-23T15:30:00.000Z")),
    "ufw-servers-2026-06-23.json",
  );
});
