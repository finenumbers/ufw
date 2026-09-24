import { spawn } from "node:child_process";

const PING_TIMEOUT_MS = 3_000;
const MAX_OUTPUT_CHARS = 16_384;

const IPV4_PATTERN =
  /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d?\d)(?:\.(?:25[0-5]|2[0-4]\d|[01]?\d?\d)){3})$/;

export type PingOutcome =
  | { kind: "reply"; rttMs: number }
  | { kind: "timeout" }
  | { kind: "unavailable" };

export function isPingableAddress(ip: string): boolean {
  if (!ip || ip.length > 64 || ip.startsWith("-") || ip.includes("%")) {
    return false;
  }

  if (IPV4_PATTERN.test(ip)) {
    return true;
  }

  return ip.includes(":") && /^[0-9a-f:.]+$/i.test(ip);
}

export function displayRttMs(rtt: number): number {
  return Math.max(1, Math.round(rtt));
}

export function buildPingCommand(
  platform: NodeJS.Platform,
  ip: string,
): { command: string; args: string[] } | null {
  if (!isPingableAddress(ip)) {
    return null;
  }

  const ipv6 = ip.includes(":");
  if (platform === "linux") {
    return {
      command: "ping",
      args: [ipv6 ? "-6" : "-4", "-n", "-c", "1", "-W", "2", "-w", "3", ip],
    };
  }

  if (platform === "darwin") {
    if (ipv6) {
      return { command: "ping6", args: ["-n", "-c", "1", ip] };
    }
    return { command: "ping", args: ["-n", "-c", "1", "-W", "2000", ip] };
  }

  return null;
}

export function parsePingRtt(stdout: string): number | null {
  const match = stdout.match(/(?:time|время)\s*[=<]\s*(\d+(?:[.,]\d+)?)/i);
  if (!match?.[1]) {
    return null;
  }

  const value = Number(match[1].replace(",", "."));
  if (!Number.isFinite(value) || value < 0) {
    return null;
  }

  return value;
}

function isProbeUnavailable(stderr: string, code: string | undefined): boolean {
  if (code === "ENOENT" || code === "EPERM" || code === "EACCES") {
    return true;
  }

  return /operation not permitted|permission denied/i.test(stderr);
}

export function probeAddress(
  ip: string,
  platform: NodeJS.Platform = process.platform,
): Promise<PingOutcome> {
  const command = buildPingCommand(platform, ip);
  if (!command) {
    return Promise.resolve({ kind: "unavailable" });
  }

  return new Promise((resolve) => {
    const child = spawn(command.command, command.args, {
      env: {
        PATH: process.env.PATH ?? "/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin",
        LC_ALL: "C",
        LANG: "C",
      },
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    let settled = false;

    const finish = (outcome: PingOutcome) => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timer);
      resolve(outcome);
    };

    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      finish({ kind: "timeout" });
    }, PING_TIMEOUT_MS);

    child.stdout?.on("data", (chunk: Buffer) => {
      if (stdout.length < MAX_OUTPUT_CHARS) {
        stdout += chunk.toString("utf8");
      }
    });

    child.stderr?.on("data", (chunk: Buffer) => {
      if (stderr.length < MAX_OUTPUT_CHARS) {
        stderr += chunk.toString("utf8");
      }
    });

    child.on("error", (error: NodeJS.ErrnoException) => {
      child.kill("SIGKILL");
      finish(isProbeUnavailable(stderr, error.code) ? { kind: "unavailable" } : { kind: "timeout" });
    });

    child.on("close", (code) => {
      if (isProbeUnavailable(stderr, undefined)) {
        finish({ kind: "unavailable" });
        return;
      }

      if (code === 0) {
        const rtt = parsePingRtt(stdout);
        finish(rtt == null ? { kind: "timeout" } : { kind: "reply", rttMs: displayRttMs(rtt) });
        return;
      }

      finish({ kind: "timeout" });
    });
  });
}
