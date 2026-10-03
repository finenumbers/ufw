import { isIpv4 } from "@/lib/awg/policy";

export const AWG_CONF_MAX_BYTES = 64 * 1024;
export const DEFAULT_AWG_MTU = 1280;
export const DEFAULT_AWG_KEEPALIVE = 25;

const INTERFACE_KEYS = new Set([
  "PrivateKey",
  "ListenPort",
  "FwMark",
  "Jc",
  "Jmin",
  "Jmax",
  "S1",
  "S2",
  "S3",
  "S4",
  "H1",
  "H2",
  "H3",
  "H4",
  "I1",
  "I2",
  "I3",
  "I4",
  "I5",
  "HeaderProtectionKey",
  "ContentPaddingAddition",
  "RekeyAfterTime",
  "RekeyTimeout",
  "RejectAfterTime",
  "KeepaliveTimeout",
  "MaxHandshakeAttempts",
  "RandomTrailers",
  "DisableCookies",
]);

const PEER_KEYS = new Set([
  "PublicKey",
  "PresharedKey",
  "AllowedIPs",
  "Endpoint",
  "PersistentKeepalive",
  "AdvancedSecurity",
]);

const QUICK_ONLY_KEYS = new Set([
  "Address",
  "DNS",
  "MTU",
  "Table",
  "PreUp",
  "PostUp",
  "PreDown",
  "PostDown",
  "SaveConfig",
]);

export type SanitizedAwgConfig = {
  address: string;
  mtu: number;
  endpointHost: string;
  endpointPort: number;
  allowedIps: string;
  peerPublicKey: string;
  keepalive: number;
  setconf: string;
};

type Section = "none" | "interface" | "peer";

function fail(message: string): never {
  throw new Error(message);
}

function stripComment(line: string): string {
  const mark = line.indexOf("#");
  return (mark === -1 ? line : line.slice(0, mark)).trim();
}

function parseEndpoint(value: string): { host: string; port: number } {
  const trimmed = value.trim();
  const bracket = trimmed.match(/^\[([^\]]+)\]:(\d+)$/);
  if (bracket) {
    fail("AmneziaWG endpoint must be an IPv4 address or hostname");
  }
  const colon = trimmed.lastIndexOf(":");
  if (colon <= 0) {
    fail("AmneziaWG endpoint must include a port");
  }
  const host = trimmed.slice(0, colon).trim();
  const port = Number(trimmed.slice(colon + 1));
  if (!host || host.includes(" ") || !Number.isInteger(port) || port < 1 || port > 65535) {
    fail("AmneziaWG endpoint must include a port");
  }
  if (host.includes(":")) {
    fail("AmneziaWG endpoint must be an IPv4 address or hostname");
  }
  return { host, port };
}

function parseAddress(value: string): string {
  const first = value
    .split(",")
    .map((part) => part.trim())
    .find((part) => part && !part.includes(":"));
  if (!first) {
    fail("AmneziaWG address must be IPv4");
  }
  const [ip, prefix] = first.split("/");
  if (!ip || !isIpv4(ip)) {
    fail("AmneziaWG address must be IPv4");
  }
  if (prefix !== undefined && (!/^\d+$/.test(prefix) || Number(prefix) < 0 || Number(prefix) > 32)) {
    fail("AmneziaWG address prefix is invalid");
  }
  return ip;
}

function renderSetconf(interfaceLines: string[], peerLines: string[]): string {
  return `[Interface]\n${interfaceLines.join("\n")}\n\n[Peer]\n${peerLines.join("\n")}\n`;
}

export function parseAmneziaWgConf(input: string): SanitizedAwgConfig {
  if (Buffer.byteLength(input, "utf8") > AWG_CONF_MAX_BYTES) {
    fail("AmneziaWG config is too large");
  }

  const text = input.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const trimmedStart = text.trim();
  if (
    trimmedStart.startsWith("{") ||
    trimmedStart.startsWith("PK") ||
    trimmedStart.includes("[AmneziaVPN]")
  ) {
    fail("Upload one AmneziaWG .conf file, not an AmneziaVPN backup");
  }
  if (!trimmedStart.includes("[Interface]") || !trimmedStart.includes("[Peer]")) {
    fail("Upload one AmneziaWG .conf file, not an AmneziaVPN backup");
  }

  let section: Section = "none";
  let peers = 0;
  let interfaces = 0;
  const interfaceLines: string[] = [];
  const peerLines: string[] = [];
  let address: string | null = null;
  let mtu = DEFAULT_AWG_MTU;
  let endpointHost: string | null = null;
  let endpointPort: number | null = null;
  let allowedIps: string | null = null;
  let peerPublicKey: string | null = null;
  let keepalive = DEFAULT_AWG_KEEPALIVE;
  let sawKeepalive = false;

  for (const rawLine of text.split("\n")) {
    const line = stripComment(rawLine);
    if (!line) {
      continue;
    }
    if (/^\[interface\]$/i.test(line)) {
      interfaces += 1;
      if (interfaces > 1) {
        fail("AmneziaWG config must contain one interface");
      }
      section = "interface";
      continue;
    }
    if (/^\[peer\]$/i.test(line)) {
      peers += 1;
      if (peers > 1) {
        fail("AmneziaWG config must contain one peer");
      }
      section = "peer";
      continue;
    }
    if (section === "none" || line.startsWith("[")) {
      fail(`Unsupported AmneziaWG field: ${line}`);
    }

    const splitAt = line.indexOf("=");
    if (splitAt <= 0) {
      fail(`Unsupported AmneziaWG field: ${line}`);
    }
    const key = line.slice(0, splitAt).trim();
    const value = line.slice(splitAt + 1).trim();
    if (!key || !value || value.includes("\n")) {
      fail(`Unsupported AmneziaWG field: ${key || line}`);
    }

    if (section === "interface") {
      if (key === "Address") {
        address = parseAddress(value);
        continue;
      }
      if (key === "MTU") {
        const parsed = Number(value);
        if (!Number.isInteger(parsed) || parsed < 1280 || parsed > 1500) {
          fail("AmneziaWG MTU must be between 1280 and 1500");
        }
        mtu = parsed;
        continue;
      }
      if (QUICK_ONLY_KEYS.has(key)) {
        continue;
      }
      if (!INTERFACE_KEYS.has(key)) {
        fail(`Unsupported AmneziaWG field: ${key}`);
      }
      interfaceLines.push(`${key} = ${value}`);
      continue;
    }

    if (key === "Endpoint") {
      const endpoint = parseEndpoint(value);
      endpointHost = endpoint.host;
      endpointPort = endpoint.port;
      peerLines.push(`Endpoint = ${endpoint.host}:${endpoint.port}`);
      continue;
    }
    if (key === "AllowedIPs") {
      allowedIps = value;
      peerLines.push(`AllowedIPs = ${value}`);
      continue;
    }
    if (key === "PublicKey") {
      peerPublicKey = value;
      peerLines.push(`PublicKey = ${value}`);
      continue;
    }
    if (key === "PersistentKeepalive") {
      if (!/^\d+(?:-\d+)?$/.test(value)) {
        fail("AmneziaWG PersistentKeepalive is invalid");
      }
      const first = Number(value.split("-")[0]);
      if (!Number.isInteger(first) || first < 0 || first > 65535) {
        fail("AmneziaWG PersistentKeepalive is invalid");
      }
      keepalive = first;
      sawKeepalive = true;
      peerLines.push(`PersistentKeepalive = ${value}`);
      continue;
    }
    if (QUICK_ONLY_KEYS.has(key) || !PEER_KEYS.has(key)) {
      fail(`Unsupported AmneziaWG field: ${key}`);
    }
    peerLines.push(`${key} = ${value}`);
  }

  if (interfaces !== 1 || peers !== 1) {
    fail("AmneziaWG config must contain one interface and one peer");
  }
  if (!address || !endpointHost || endpointPort === null || !allowedIps || !peerPublicKey) {
    fail("AmneziaWG config is missing Address, PrivateKey, PublicKey, AllowedIPs, or Endpoint");
  }
  if (!interfaceLines.some((line) => line.startsWith("PrivateKey = "))) {
    fail("AmneziaWG config is missing Address, PrivateKey, PublicKey, AllowedIPs, or Endpoint");
  }
  if (!sawKeepalive) {
    peerLines.push(`PersistentKeepalive = ${DEFAULT_AWG_KEEPALIVE}`);
  }

  const setconf = renderSetconf(interfaceLines, peerLines);
  if (/\b(?:DNS|Table|Address|PreUp|PostUp|PreDown|PostDown|SaveConfig)\s*=/.test(setconf)) {
    fail("AmneziaWG config still contains routing or script fields");
  }

  return {
    address,
    mtu,
    endpointHost,
    endpointPort,
    allowedIps,
    peerPublicKey,
    keepalive,
    setconf,
  };
}
