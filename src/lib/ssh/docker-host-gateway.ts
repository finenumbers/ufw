import fs from "node:fs/promises";

export type ContainerRoutes = {
  gateway: string | null;
  subnet: string | null;
  connectedSubnets: string[];
};

export const EMPTY_CONTAINER_ROUTES: ContainerRoutes = {
  gateway: null,
  subnet: null,
  connectedSubnets: [],
};

type RouteRow = {
  iface: string;
  destination: number;
  gateway: number;
  flags: number;
  metric: number;
  mask: number;
};

function leHexToNetworkOrder(hex: string): number | null {
  if (!/^[0-9a-f]{8}$/i.test(hex)) {
    return null;
  }
  const value = Number.parseInt(hex, 16);
  if (!Number.isFinite(value)) {
    return null;
  }
  const first = value & 0xff;
  const second = (value >> 8) & 0xff;
  const third = (value >> 16) & 0xff;
  const fourth = (value >> 24) & 0xff;
  return ((first << 24) | (second << 16) | (third << 8) | fourth) >>> 0;
}

function formatIpv4(value: number): string {
  return [
    (value >>> 24) & 0xff,
    (value >>> 16) & 0xff,
    (value >>> 8) & 0xff,
    value & 0xff,
  ].join(".");
}

function prefixLength(mask: number): number {
  let bits = 0;
  let rest = mask >>> 0;
  while (rest & 0x80000000) {
    bits += 1;
    rest = (rest << 1) >>> 0;
  }
  return bits;
}

function cidrOf(network: number, mask: number): string {
  return `${formatIpv4(network & mask)}/${prefixLength(mask)}`;
}

function parseRows(routeTable: string): RouteRow[] {
  const rows: RouteRow[] = [];
  for (const line of routeTable.split("\n").slice(1)) {
    const parts = line.trim().split(/\s+/);
    if (parts.length < 8) {
      continue;
    }
    const destination = leHexToNetworkOrder(parts[1] ?? "");
    const gateway = leHexToNetworkOrder(parts[2] ?? "");
    const mask = leHexToNetworkOrder(parts[7] ?? "");
    const flags = Number.parseInt(parts[3] ?? "", 16);
    const metric = Number.parseInt(parts[6] ?? "", 10);
    if (destination == null || gateway == null || mask == null || !Number.isFinite(flags)) {
      continue;
    }
    rows.push({
      iface: parts[0] ?? "",
      destination,
      gateway,
      flags,
      metric: Number.isFinite(metric) ? metric : Number.MAX_SAFE_INTEGER,
      mask,
    });
  }
  return rows;
}

/** Default gateway and the connected subnet of that interface. Ignores other bridges such as docker0. */
export function parseContainerRoutes(routeTable: string): ContainerRoutes {
  const rows = parseRows(routeTable);
  const connectedSubnets = rows
    .filter((row) => row.gateway === 0 && row.mask !== 0 && row.destination !== 0)
    .map((row) => cidrOf(row.destination, row.mask));

  const defaults = rows
    .filter((row) => row.destination === 0 && (row.flags & 0x2) !== 0 && row.gateway !== 0)
    .sort((left, right) => left.metric - right.metric);

  const chosen = defaults[0];
  if (!chosen) {
    return { gateway: null, subnet: null, connectedSubnets };
  }

  const match = rows.find(
    (row) =>
      row.iface === chosen.iface &&
      row.gateway === 0 &&
      row.mask !== 0 &&
      (chosen.gateway & row.mask) === (row.destination & row.mask),
  );
  if (!match) {
    return { gateway: null, subnet: null, connectedSubnets };
  }

  return {
    gateway: formatIpv4(chosen.gateway),
    subnet: cidrOf(match.destination, match.mask),
    connectedSubnets,
  };
}

export function isIpv4InCidr(ip: string, cidr: string): boolean {
  const [network, prefixRaw] = cidr.split("/");
  const prefix = Number(prefixRaw);
  if (!network || !Number.isInteger(prefix) || prefix < 0 || prefix > 32) {
    return false;
  }
  const ipParts = ip.split(".").map((part) => Number(part));
  const networkParts = network.split(".").map((part) => Number(part));
  if (
    ipParts.length !== 4 ||
    networkParts.length !== 4 ||
    ipParts.some((part) => !Number.isInteger(part) || part < 0 || part > 255) ||
    networkParts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)
  ) {
    return false;
  }
  const ipInt =
    ((ipParts[0]! << 24) | (ipParts[1]! << 16) | (ipParts[2]! << 8) | ipParts[3]!) >>> 0;
  const networkInt =
    ((networkParts[0]! << 24) |
      (networkParts[1]! << 16) |
      (networkParts[2]! << 8) |
      networkParts[3]!) >>>
    0;
  const mask = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;
  return (ipInt & mask) === (networkInt & mask);
}

export function dockerHostOutsideMessage(address: string, subnets: string[]): string {
  const where = subnets.length > 0 ? subnets.join(", ") : "the container network";
  return `Docker host alias ${address} is outside ${where}`;
}

export function dockerHostTimeoutMessage(routes: ContainerRoutes | null): string {
  if (routes?.gateway && routes.subnet) {
    return `SSH connection to the Docker host timed out at ${routes.gateway}. On that machine run: ufw allow from ${routes.subnet} to any port 22 proto tcp. sshd must listen on all interfaces.`;
  }
  return "SSH connection to the Docker host timed out. Allow TCP/22 from the app container subnet, and make sure sshd listens on all interfaces.";
}

export async function readContainerRoutes(): Promise<ContainerRoutes> {
  try {
    const routeTable = await fs.readFile("/proc/net/route", "utf8");
    return parseContainerRoutes(routeTable);
  } catch {
    return EMPTY_CONTAINER_ROUTES;
  }
}
