import assert from "node:assert/strict";
import test from "node:test";

import { parseAmneziaWgConf } from "@/lib/awg/parse-conf";

const SAMPLE = `
[Interface]
PrivateKey = AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=
Address = 10.8.1.2/24
DNS = 1.1.1.1
MTU = 1420
Jc = 4
PostUp = iptables -A FORWARD -j ACCEPT
Table = auto

[Peer]
PublicKey = BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB=
AllowedIPs = 0.0.0.0/0, ::/0
Endpoint = vpn.example.com:51820
PersistentKeepalive = 25
`;

test("parseAmneziaWgConf keeps obfuscation and drops routes, DNS, and scripts", () => {
  const parsed = parseAmneziaWgConf(`\uFEFF${SAMPLE.replace(/\n/g, "\r\n")}`);
  assert.equal(parsed.address, "10.8.1.2");
  assert.equal(parsed.mtu, 1420);
  assert.equal(parsed.endpointHost, "vpn.example.com");
  assert.equal(parsed.endpointPort, 51820);
  assert.equal(parsed.allowedIps, "0.0.0.0/0, ::/0");
  assert.equal(parsed.keepalive, 25);
  assert.match(parsed.setconf, /Jc = 4/);
  assert.doesNotMatch(parsed.setconf, /DNS|PostUp|Table|Address/);
});

test("parseAmneziaWgConf defaults MTU and keepalive", () => {
  const parsed = parseAmneziaWgConf(`
[Interface]
PrivateKey = AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=
Address = 10.8.1.2/32
[Peer]
PublicKey = BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB=
AllowedIPs = 10.8.1.0/24
Endpoint = 203.0.113.10:4433
`);
  assert.equal(parsed.mtu, 1280);
  assert.equal(parsed.keepalive, 25);
  assert.match(parsed.setconf, /PersistentKeepalive = 25/);
});

test("parseAmneziaWgConf rejects a second peer, scripts as unknown fields, and backups", () => {
  assert.throws(() => parseAmneziaWgConf(`${SAMPLE}\n[Peer]\nPublicKey = C=\n`), /one peer/);
  assert.throws(
    () =>
      parseAmneziaWgConf(`
[Interface]
PrivateKey = AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=
Address = 10.8.1.2/32
Foo = 1
[Peer]
PublicKey = BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB=
AllowedIPs = 0.0.0.0/0
Endpoint = 203.0.113.10:51820
`),
    /Unsupported AmneziaWG field: Foo/,
  );
  assert.throws(() => parseAmneziaWgConf('{"containers":[]}'), /backup/);
  assert.throws(() => parseAmneziaWgConf("x".repeat(70_000)), /too large/);
});
