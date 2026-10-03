import dns from "node:dns/promises";

import {
  assertAwgConnectAllowed,
  awgDestinationBlockReason,
  ipv4CoveredByAllowedIps,
  isIpv4,
  validateAwgHost,
} from "@/lib/awg/policy";
import { awgGate } from "@/lib/awg/gate";
import { readContainerRoutes } from "@/lib/ssh/docker-host-gateway";
import { db } from "@/lib/db";
import {
  awgHelperRequest,
  type AwgHelperStatus,
} from "@/server/services/awg-helper-client";

const CONFIG_ID = "default";

export async function steerAwgDestination(host: string): Promise<string> {
  return awgGate.shared(() => steerAwgDestinationUnlocked(host));
}

export async function steerAwgDestinationUnlocked(host: string): Promise<string> {
  const row = await db.amneziaWgConfig.findUnique({ where: { id: CONFIG_ID } });
  if (!row) {
    throw new Error("Upload an AmneziaWG config before using it for a node");
  }
  if (!row.enabled) {
    throw new Error("AmneziaWG is down");
  }

  const status = await awgHelperRequest<AwgHelperStatus>({ cmd: "status" });
  const ip = await resolveAwgIp(host, row);
  const ensured = await awgHelperRequest<{ ip: string; routeGet: string }>({
    cmd: "ensure-route",
    ip,
  });
  assertAwgConnectAllowed(status.up, ensured.routeGet);
  return ip;
}

export async function resolveAwgIp(
  host: string,
  row: {
    endpointHost: string;
    address: string;
    allowedIps: string;
  },
): Promise<string> {
  const hostError = validateAwgHost(host);
  if (hostError) {
    throw new Error(hostError);
  }
  if (host.trim().toLowerCase() === row.endpointHost.trim().toLowerCase()) {
    throw new Error("Use the node address inside the VPN, not the Amnezia endpoint");
  }

  const ip = isIpv4(host.trim())
    ? host.trim()
    : (await dns.lookup(host.trim(), { family: 4 })).address;
  const endpointIp = isIpv4(row.endpointHost)
    ? row.endpointHost
    : (await dns.lookup(row.endpointHost, { family: 4 })).address;
  const routes = await readContainerRoutes();
  const blocked = awgDestinationBlockReason(ip, {
    endpointIp,
    tunnelAddress: row.address,
    containerCidrs: routes.connectedSubnets,
  });
  if (blocked) {
    throw new Error(blocked);
  }
  if (!ipv4CoveredByAllowedIps(ip, row.allowedIps)) {
    throw new Error("This address is outside the AmneziaWG AllowedIPs");
  }
  return ip;
}
