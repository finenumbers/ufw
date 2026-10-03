import assert from "node:assert/strict";
import test from "node:test";

import {
  assertAwgConnectAllowed,
  awgDestinationBlockReason,
  ipv4CoveredByAllowedIps,
  routeDevice,
  validateAwgHost,
} from "@/lib/awg/policy";
import { validateSshHost } from "@/lib/validations/ssh-host";

test("direct SSH policy still rejects private addresses", () => {
  assert.equal(validateSshHost("10.8.1.5"), "Host IP is not allowed");
});

test("AWG host policy allows a VPN address and rejects metadata, endpoint, and container nets", () => {
  assert.equal(validateAwgHost("10.8.1.5"), null);
  assert.equal(validateAwgHost("100.64.0.5"), null);
  assert.match(validateAwgHost("169.254.169.254") ?? "", /not allowed/);
  assert.match(validateAwgHost("2001:db8::1") ?? "", /IPv4/);
  assert.match(
    awgDestinationBlockReason("203.0.113.8", { endpointIp: "203.0.113.8" }) ?? "",
    /endpoint/,
  );
  assert.match(
    awgDestinationBlockReason("172.18.0.4", { containerCidrs: ["172.18.0.0/16"] }) ?? "",
    /container network/,
  );
});

test("AllowedIPs coverage does not treat the system default route as permission to dial directly", () => {
  assert.equal(ipv4CoveredByAllowedIps("10.8.1.9", "0.0.0.0/0, ::/0"), true);
  assert.equal(ipv4CoveredByAllowedIps("203.0.113.9", "10.8.1.0/24"), false);
  assert.equal(ipv4CoveredByAllowedIps("10.8.1.9", "10.8.1.0/24"), true);
});

test("connection is refused unless the installed route uses awg0", () => {
  assert.equal(routeDevice("10.8.1.5 via 172.18.0.1 dev eth0 src 172.18.0.2"), "eth0");
  assert.throws(
    () => assertAwgConnectAllowed(true, "10.8.1.5 via 172.18.0.1 dev eth0 src 172.18.0.2"),
    /outside AmneziaWG/,
  );
  assert.throws(() => assertAwgConnectAllowed(false, "10.8.1.5 dev awg0 src 10.8.1.2"), /down/);
  assert.doesNotThrow(() =>
    assertAwgConnectAllowed(true, "10.8.1.5 dev awg0 src 10.8.1.2 uid 0"),
  );
});
