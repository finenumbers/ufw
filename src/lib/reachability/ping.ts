import { spawn } from "node:child_process";

const PING_TIMEOUT_MS = 4_000;
const MAX_OUTPUT_CHARS = 16_384;

const IPV4_PATTERN =
  /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d?\d)(?:\.(?:25[0-5]|2[0-4]\d|[01]?\d?\d)){3})$/;

export type PingOutcome =
  | { kind: "reply"; rttMs: number | null }
  | { kind: "timeout" };

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

export function classifyPingResult(input: { code: number | null; stdout: string }): PingOutcome {
  if (input.code !== 0) {
    return { kind: "timeout" };
  }

  const rtt = parsePingRtt(input.stdout);
  return { kind: "reply", rttMs: rtt == null ? null : displayRttMs(rtt) };
}

function probePath(): string {
  const current = (process.env.PATH ?? "")
    .split(":")
    .map((part) => part.trim())
    .filter(Boolean);
  const fallback = ["/usr/local/sbin", "/usr/local/bin", "/usr/sbin", "/usr/bin", "/sbin", "/bin"];
  return [...new Set([...current, ...fallback])].join(":");
}

export function probeAddress(
  ip: string,
  platform: NodeJS.Platform = process.platform,
): Promise<PingOutcome> {
  const command = buildPingCommand(platform, ip);
  if (!command) {
    return Promise.resolve({ kind: "timeout" });
  }

  return new Promise((resolve) => {
    const child = spawn(command.command, command.args, {
      env: {
        PATH: probePath(),
        LC_ALL: "C",
        LANG: "C",
      } as unknown as NodeJS.ProcessEnv,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
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

    child.stderr?.resume();

    child.on("error", () => {
      child.kill("SIGKILL");
      finish({ kind: "timeout" });
    });

    child.on("close", (code) => {
      finish(classifyPingResult({ code, stdout }));
    });
  });
}
