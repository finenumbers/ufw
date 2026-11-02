import { spawn } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import dns from "node:dns/promises";

const SOCKET_PATH = "/run/awg/helper.sock";
const STATE_PATH = "/run/awg/state.json";
const ROUTES_PATH = "/run/awg/routes";
const CONF_PATH = "/run/awg/awg0.conf";
const IFACE = "awg0";
const PATH_VALUE = "/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin";
const MAX_RESTARTS = 3;

const env = { ...process.env, PATH: PATH_VALUE, WG_PROCESS_FOREGROUND: "1", LOG_LEVEL: "error" };

let daemon = null;
let daemonError = "";
let lastApply = null;
let restartCount = 0;
let stopping = false;
let lastError = "";
let restartTimer = null;
let generation = 0;

function redact(text) {
  return String(text).replace(/[A-Za-z0-9+/]{32,}={0,2}/g, "[redacted]").slice(0, 400);
}

function run(command, args, timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { env });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error(`${command} timed out`));
    }, timeoutMs);
    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }
      reject(new Error(redact(stderr || stdout || `${command} exited ${code}`)));
    });
  });
}

function isIpv4(ip) {
  const parts = ip.split(".");
  if (parts.length !== 4) return false;
  return parts.every((part) => /^\d{1,3}$/.test(part) && Number(part) <= 255);
}

function ipv4ToInt(ip) {
  const parts = ip.split(".").map((part) => Number(part));
  return (((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0);
}

function ipv4InCidr(ip, cidr) {
  const [network, prefixRaw] = cidr.split("/");
  const prefix = prefixRaw === undefined ? 32 : Number(prefixRaw);
  if (!isIpv4(ip) || !isIpv4(network) || !Number.isInteger(prefix) || prefix < 0 || prefix > 32) {
    return false;
  }
  if (prefix === 0) return true;
  const mask = (0xffffffff << (32 - prefix)) >>> 0;
  return (ipv4ToInt(ip) & mask) === (ipv4ToInt(network) & mask);
}

async function localCidrs() {
  const { stdout } = await run("ip", ["-4", "-o", "addr", "show"]);
  const cidrs = [];
  for (const line of stdout.split("\n")) {
    const match = line.match(/\binet\s+(\d+\.\d+\.\d+\.\d+\/\d+)/);
    if (match) cidrs.push(match[1]);
  }
  return cidrs;
}

function readState() {
  try {
    return JSON.parse(fs.readFileSync(STATE_PATH, "utf8"));
  } catch {
    return null;
  }
}

function canonicalIpv4(ip) {
  const text = String(ip ?? "").trim();
  if (!isIpv4(text)) return null;
  return text.split(".").map((part) => String(Number(part))).join(".");
}

function validRouteHost(host) {
  const text = String(host ?? "").trim();
  if (!text || text.length > 253 || /\s/.test(text)) return null;
  return text;
}

function readRouteRecords() {
  let text = "";
  try {
    text = fs.readFileSync(ROUTES_PATH, "utf8");
  } catch {
    return [];
  }
  const records = [];
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const tab = trimmed.indexOf("\t");
    const ip = canonicalIpv4(tab === -1 ? trimmed : trimmed.slice(0, tab));
    const hostText = tab === -1 ? "" : trimmed.slice(tab + 1).trim();
    if (!ip) continue;
    if (hostText && !validRouteHost(hostText)) continue;
    records.push({ ip, host: hostText });
  }
  return records;
}

function writeRouteRecords(records) {
  const lines = records.map((record) => (record.host ? `${record.ip}\t${record.host}` : record.ip));
  fs.writeFileSync(ROUTES_PATH, lines.length ? `${lines.join("\n")}\n` : "", { mode: 0o600 });
}

function kernelHostIps(dump) {
  if (!Array.isArray(dump)) return [];
  const ips = [];
  for (const row of dump) {
    const dst = typeof row?.dst === "string" ? row.dst : "";
    if (!dst || dst === "default" || dst.includes(":")) continue;
    const slash = dst.indexOf("/");
    const address = slash === -1 ? dst : dst.slice(0, slash);
    const prefix = slash === -1 ? null : dst.slice(slash + 1);
    if (prefix !== null && prefix !== "32") continue;
    const ip = canonicalIpv4(address);
    if (ip) ips.push(ip);
  }
  return [...new Set(ips)];
}

async function readKernelDump() {
  const { stdout } = await run("ip", ["-json", "route", "show", "dev", IFACE]);
  const dump = JSON.parse(stdout || "[]");
  if (!Array.isArray(dump)) throw new Error("AmneziaWG route list failed");
  return dump;
}

async function endpointIp() {
  const state = readState();
  if (!state?.endpointHost) {
    throw new Error("AmneziaWG is down");
  }
  if (isIpv4(state.endpointHost)) {
    return state.endpointHost;
  }
  const looked = await dns.lookup(state.endpointHost, { family: 4 });
  return looked.address;
}

async function assertRouteAllowed(ip) {
  if (!isIpv4(ip)) {
    throw new Error("Only IPv4 host routes are allowed");
  }
  const value = ipv4ToInt(ip);
  const first = value >>> 24;
  if (first === 0 || first === 127 || first >= 224 || (first === 169 && ((value >>> 16) & 0xff) === 254)) {
    throw new Error("Resolved IP is not allowed");
  }
  const state = readState();
  if (state?.address && ip === state.address) {
    throw new Error("Resolved IP is not allowed");
  }
  const endpoint = canonicalIpv4(await endpointIp());
  const target = canonicalIpv4(ip);
  if (endpoint && target && target === endpoint) {
    throw new Error("Use the node address inside the VPN, not the Amnezia endpoint");
  }
  for (const cidr of await localCidrs()) {
    if (ipv4InCidr(ip, cidr)) {
      throw new Error("Resolved IP is inside the container network");
    }
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForSocket() {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    if (fs.existsSync(`/var/run/amneziawg/${IFACE}.sock`)) {
      return;
    }
    if (!daemon) {
      throw new Error(redact(daemonError || "AmneziaWG process stopped"));
    }
    await sleep(100);
  }
  throw new Error("AmneziaWG socket did not appear");
}

async function configure(apply) {
  fs.mkdirSync("/run/awg", { recursive: true, mode: 0o750 });
  fs.mkdirSync("/var/run/amneziawg", { recursive: true, mode: 0o755 });
  if (/\b(?:DNS|Table|Address|PreUp|PostUp|PreDown|PostDown|SaveConfig)\s*=/.test(apply.setconf)) {
    throw new Error("Refusing to apply a config that changes routes or runs scripts");
  }
  fs.writeFileSync(CONF_PATH, apply.setconf, { mode: 0o600 });
  fs.writeFileSync(
    STATE_PATH,
    JSON.stringify({
      address: apply.address,
      endpointHost: apply.endpointHost,
      endpointPort: apply.endpointPort,
    }),
    { mode: 0o600 },
  );
  await waitForSocket();
  let configured = false;
  let last = "awg setconf failed";
  for (let attempt = 0; attempt < 10; attempt += 1) {
    try {
      await run("awg", ["setconf", IFACE, CONF_PATH]);
      configured = true;
      break;
    } catch (error) {
      last = error instanceof Error ? error.message : String(error);
      await sleep(100);
    }
  }
  if (!configured) {
    throw new Error(last);
  }
  await run("ip", ["addr", "replace", `${apply.address}/32`, "dev", IFACE]);
  await run("ip", ["link", "set", "dev", IFACE, "mtu", String(apply.mtu), "up"]);
  await run("iptables", [
    "-t",
    "mangle",
    "-C",
    "OUTPUT",
    "-o",
    IFACE,
    "-p",
    "tcp",
    "--tcp-flags",
    "SYN,RST",
    "SYN",
    "-j",
    "TCPMSS",
    "--clamp-mss-to-pmtu",
  ]).catch(() =>
    run("iptables", [
      "-t",
      "mangle",
      "-A",
      "OUTPUT",
      "-o",
      IFACE,
      "-p",
      "tcp",
      "--tcp-flags",
      "SYN,RST",
      "SYN",
      "-j",
      "TCPMSS",
      "--clamp-mss-to-pmtu",
    ]),
  );
}

function scheduleRestart() {
  if (stopping || !lastApply || restartTimer) {
    return;
  }
  if (restartCount >= MAX_RESTARTS) {
    lastError = "AmneziaWG process stopped";
    return;
  }
  restartCount += 1;
  const apply = lastApply;
  restartTimer = setTimeout(() => {
    restartTimer = null;
    startDaemon(apply).catch((error) => {
      lastError = redact(error instanceof Error ? error.message : String(error));
    });
  }, 1000 * restartCount);
}

function startDaemon(apply) {
  const token = generation + 1;
  generation = token;
  stopping = false;
  daemonError = "";
  const child = spawn("/usr/local/bin/amneziawg-go", ["-f", IFACE], {
    env,
    stdio: ["ignore", "ignore", "pipe"],
  });
  daemon = child;
  child.stderr.on("data", (chunk) => {
    daemonError = (daemonError + chunk.toString()).slice(-2000);
  });
  child.on("exit", () => {
    if (token !== generation) {
      return;
    }
    if (daemon === child) {
      daemon = null;
    }
    scheduleRestart();
  });
  return configure(apply);
}

async function applyConfig(payload) {
  if (!payload || typeof payload.setconf !== "string" || !isIpv4(payload.address)) {
    throw new Error("Invalid AmneziaWG apply request");
  }
  const mtu = Number(payload.mtu);
  if (!Number.isInteger(mtu) || mtu < 1280 || mtu > 1500) {
    throw new Error("AmneziaWG MTU must be between 1280 and 1500");
  }
  await downTunnel(false);
  lastApply = payload;
  restartCount = 0;
  lastError = "";
  await startDaemon(payload);
}

async function downTunnel(clearApply) {
  generation += 1;
  stopping = true;
  if (restartTimer) {
    clearTimeout(restartTimer);
    restartTimer = null;
  }
  if (daemon) {
    daemon.kill("SIGTERM");
    daemon = null;
  }
  await run("iptables", [
    "-t",
    "mangle",
    "-D",
    "OUTPUT",
    "-o",
    IFACE,
    "-p",
    "tcp",
    "--tcp-flags",
    "SYN,RST",
    "SYN",
    "-j",
    "TCPMSS",
    "--clamp-mss-to-pmtu",
  ]).catch(() => {});
  await run("ip", ["link", "del", "dev", IFACE]).catch(() => {});
  for (const file of [CONF_PATH, STATE_PATH, ROUTES_PATH]) {
    try {
      fs.unlinkSync(file);
    } catch {
      // already gone
    }
  }
  if (clearApply) {
    lastApply = null;
    restartCount = 0;
  }
  stopping = false;
}

async function interfaceUp() {
  try {
    await run("ip", ["link", "show", "dev", IFACE]);
    return Boolean(daemon);
  } catch {
    return false;
  }
}

async function status() {
  const up = await interfaceUp();
  if (!up) {
    return { up: false, latestHandshake: null, rx: 0, tx: 0, error: lastError || null };
  }
  try {
    const handshakes = await run("awg", ["show", IFACE, "latest-handshakes"]);
    const transfer = await run("awg", ["show", IFACE, "transfer"]);
    const handshakeLine = handshakes.stdout.trim().split("\n").find(Boolean) ?? "";
    const transferLine = transfer.stdout.trim().split("\n").find(Boolean) ?? "";
    const handshake = Number(handshakeLine.split("\t")[1] ?? 0);
    const parts = transferLine.split("\t");
    return {
      up: true,
      latestHandshake: handshake > 0 ? handshake : null,
      rx: Number(parts[1] ?? 0),
      tx: Number(parts[2] ?? 0),
      error: null,
    };
  } catch (error) {
    return {
      up: true,
      latestHandshake: null,
      rx: 0,
      tx: 0,
      error: redact(error instanceof Error ? error.message : String(error)),
    };
  }
}

async function replaceRoute(ip) {
  const state = readState();
  if (!state?.address || !(await interfaceUp())) {
    throw new Error("AmneziaWG is down");
  }
  await assertRouteAllowed(ip);
  await run("ip", ["route", "replace", `${ip}/32`, "dev", IFACE, "src", state.address]);
  const got = await run("ip", ["route", "get", ip]);
  return got.stdout.trim();
}

async function deleteHostRoute(ip) {
  try {
    await run("ip", ["route", "del", `${ip}/32`, "dev", IFACE]);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/No such process|not found|Cannot find device/i.test(message)) return;
    throw new Error("AmneziaWG route removal failed");
  }
}

async function ensureRoute(ip, host) {
  const canonical = canonicalIpv4(ip);
  const routeHost = validRouteHost(host);
  if (!canonical || !routeHost) {
    throw new Error("Only IPv4 host routes are allowed");
  }
  const records = readRouteRecords();
  const previousIps = records
    .filter((record) => record.host.toLowerCase() === routeHost.toLowerCase())
    .map((record) => record.ip);
  const routeGet = await replaceRoute(canonical);
  const next = records.filter((record) => record.host.toLowerCase() !== routeHost.toLowerCase());
  next.push({ ip: canonical, host: routeHost });
  for (const old of new Set(previousIps)) {
    if (old === canonical || next.some((record) => record.ip === old)) continue;
    await deleteHostRoute(old);
  }
  writeRouteRecords(next);
  return { ip: canonical, routeGet };
}

async function removeRoute(ip) {
  const canonical = canonicalIpv4(ip);
  if (!canonical) {
    throw new Error("Only IPv4 host routes are allowed");
  }
  await deleteHostRoute(canonical);
  writeRouteRecords(readRouteRecords().filter((record) => record.ip !== canonical));
  return { ip: canonical };
}

async function dropHost(host) {
  const routeHost = validRouteHost(host);
  if (!routeHost) throw new Error("AmneziaWG host is invalid");
  writeRouteRecords(
    readRouteRecords().filter((record) => record.host.toLowerCase() !== routeHost.toLowerCase()),
  );
  return { host: routeHost };
}

async function syncRoutes(routes) {
  if (!Array.isArray(routes)) throw new Error("Only IPv4 host routes are allowed");
  const desired = [];
  const seenHosts = new Set();
  const seenBare = new Set();
  for (const route of routes) {
    const ip = canonicalIpv4(route?.ip);
    const hostText = String(route?.host ?? "").trim();
    if (!ip) throw new Error("Only IPv4 host routes are allowed");
    if (hostText && !validRouteHost(hostText)) throw new Error("AmneziaWG host is invalid");
    const hostKey = hostText.toLowerCase();
    if (hostKey) {
      if (seenHosts.has(hostKey)) continue;
      seenHosts.add(hostKey);
    } else if (seenBare.has(ip)) {
      continue;
    } else {
      seenBare.add(ip);
    }
    desired.push({ ip, host: hostText });
  }
  const desiredIps = new Set(desired.map((route) => route.ip));
  const kernel = (await interfaceUp()) ? kernelHostIps(await readKernelDump()) : [];
  const toInstall = [...desiredIps].filter((ip) => !kernel.includes(ip));
  for (const address of toInstall) {
    await assertRouteAllowed(address);
  }
  for (const address of kernel) {
    if (!desiredIps.has(address)) await deleteHostRoute(address);
  }
  for (const address of toInstall) {
    await replaceRoute(address);
  }
  writeRouteRecords(desired);
  return { routes: desired };
}

async function listRoutes() {
  const up = await interfaceUp();
  const records = readRouteRecords();
  if (!up) return { up: false, kernel: [], records };
  let kernel;
  try {
    kernel = await readKernelDump();
  } catch {
    throw new Error("AmneziaWG route list failed");
  }
  return { up: true, kernel, records };
}

async function handle(message) {
  const command = message?.cmd;
  if (command === "status") return status();
  if (command === "apply") return applyConfig(message);
  if (command === "down") {
    await downTunnel(true);
    lastError = "";
    return { up: false };
  }
  if (command === "routes") return listRoutes();
  if (command === "ensure-route") return ensureRoute(message.ip, message.host);
  if (command === "remove-route") return removeRoute(message.ip);
  if (command === "drop-host") return dropHost(message.host);
  if (command === "sync-routes") return syncRoutes(message.routes);
  throw new Error("Unknown AmneziaWG helper command");
}

fs.mkdirSync("/run/awg", { recursive: true, mode: 0o750 });
try {
  fs.unlinkSync(SOCKET_PATH);
} catch {
  // first start
}

const server = net.createServer((socket) => {
  let buffer = "";
  socket.on("data", (chunk) => {
    buffer += chunk.toString("utf8");
    const newline = buffer.indexOf("\n");
    if (newline === -1) {
      if (buffer.length > 1_000_000) socket.destroy();
      return;
    }
    const line = buffer.slice(0, newline);
    buffer = "";
    Promise.resolve()
      .then(() => handle(JSON.parse(line)))
      .then((result) => {
        socket.end(`${JSON.stringify({ ok: true, result })}\n`);
      })
      .catch((error) => {
        socket.end(`${JSON.stringify({ ok: false, error: redact(error instanceof Error ? error.message : String(error)) })}\n`);
      });
  });
});

server.listen(SOCKET_PATH, () => {
  try {
    fs.chmodSync(SOCKET_PATH, 0o660);
    spawn("chgrp", ["nodejs", SOCKET_PATH], { env });
    spawn("chgrp", ["nodejs", "/run/awg"], { env });
  } catch {
    // entrypoint also sets the group
  }
});
