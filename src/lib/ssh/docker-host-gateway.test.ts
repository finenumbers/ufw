import assert from "node:assert/strict";
import test from "node:test";

import {
  dockerHostTimeoutMessage,
  isIpv4InCidr,
  parseContainerRoutes,
} from "@/lib/ssh/docker-host-gateway";

const routeTable = `
Iface Destination Gateway Flags RefCnt Use Metric Mask MTU Window IRTT
eth0 000015AC 00000000 0001 0 0 0 0000FFFF 0 0 0
eth0 00000000 010015AC 0003 0 0 0 00000000 0 0 0
docker0 000011AC 00000000 0001 0 0 0 0000FFFF 0 0 0
docker0 00000000 010011AC 0003 0 0 100 00000000 0 0 0
`;

test("parseContainerRoutes uses the lowest-metric gateway inside its own subnet", () => {
  const routes = parseContainerRoutes(routeTable);
  assert.equal(routes.gateway, "172.21.0.1");
  assert.equal(routes.subnet, "172.21.0.0/16");
  assert.deepEqual(routes.connectedSubnets.sort(), ["172.17.0.0/16", "172.21.0.0/16"]);
});

test("parseContainerRoutes ignores AmneziaWG host routes", () => {
  const routes = parseContainerRoutes(`
Iface Destination Gateway Flags RefCnt Use Metric Mask MTU Window IRTT
eth0 000017AC 00000000 0001 0 0 0 0000FFFF 0 0 0
eth1 000015AC 00000000 0001 0 0 0 0000FFFF 0 0 0
awg0 B7467C8A 00000000 0001 0 0 0 FFFFFFFF 0 0 0
`);
  assert.deepEqual(routes.connectedSubnets.sort(), ["172.21.0.0/16", "172.23.0.0/16"]);
});

test("parseContainerRoutes ignores a default gateway that is not on its interface subnet", () => {
  const routes = parseContainerRoutes(`
Iface Destination Gateway Flags RefCnt Use Metric Mask
eth0 000015AC 00000000 0001 0 0 0 0000FFFF
eth0 00000000 010011AC 0003 0 0 0 00000000
`);
  assert.equal(routes.gateway, null);
  assert.equal(routes.subnet, null);
  assert.deepEqual(routes.connectedSubnets, ["172.21.0.0/16"]);
});

test("isIpv4InCidr matches the container subnet and rejects docker0", () => {
  assert.equal(isIpv4InCidr("172.21.0.1", "172.21.0.0/16"), true);
  assert.equal(isIpv4InCidr("172.17.0.1", "172.21.0.0/16"), false);
});

test("dockerHostTimeoutMessage names the gateway and the ufw subnet", () => {
  assert.match(
    dockerHostTimeoutMessage({
      gateway: "172.21.0.1",
      subnet: "172.21.0.0/16",
      connectedSubnets: ["172.21.0.0/16"],
    }),
    /ufw allow from 172\.21\.0\.0\/16 to any port 22/,
  );
});
