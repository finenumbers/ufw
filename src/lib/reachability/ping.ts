import { spawn } from "node:child_process";

const PING_TIMEOUT_MS = 4_000;
const MAX_OUTPUT_CHARS = 16_384;

const PROBE_FAILURE =
  /operation not permitted|permission denied|cap_net_raw|command not found|invalid option|socktype:\s*SOCK_/i;

export type PingOutcome =
  | { kind: "reply"; rttMs: number | null }
  | { kind: "timeout" }
  | { kind: "unavailable"; reason: string };

export function displayRttMs(rtt: number): number {
  return Math.max(1, Math.round(rtt));
}

/** One echo, then exit. Same command on Linux and macOS: `ping -c 1 <host>`. */
export function buildPingCommand(host: string): { command: string; args: string[] } | null {
  const trimmed = host.trim();
  if (!trimmed || trimmed.length > 253 || trimmed.startsWith("-") || /\s/.test(trimmed)) {
    return null;
  }

  return { command: "ping", args: ["-c", "1", trimmed] };
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

function probeFailureReason(text: string): string | null {
  const line = text
    .split("\n")
    .map((part) => part.trim())
    .find((part) => PROBE_FAILURE.test(part));
  return line ? line.slice(0, 200) : null;
}

export function classifyPingResult(input: {
  code: number | null;
  stdout: string;
  stderr?: string;
}): PingOutcome {
  const rtt = parsePingRtt(input.stdout);
  if (rtt != null || input.code === 0) {
    return { kind: "reply", rttMs: rtt == null ? null : displayRttMs(rtt) };
  }

  const reason = probeFailureReason(`${input.stderr ?? ""}\n${input.stdout}`);
  if (reason) {
    return { kind: "unavailable", reason };
  }

  return { kind: "timeout" };
}

function probePath(): string {
  const current = (process.env.PATH ?? "")
    .split(":")
    .map((part) => part.trim())
    .filter(Boolean);
  const fallback = ["/usr/local/sbin", "/usr/local/bin", "/usr/sbin", "/usr/bin", "/sbin", "/bin"];
  return [...new Set([...current, ...fallback])].join(":");
}

export function probeAddress(host: string): Promise<PingOutcome> {
  const command = buildPingCommand(host);
  if (!command) {
    return Promise.resolve({ kind: "unavailable", reason: "unsupported ping target" });
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
      finish(classifyPingResult({ code: null, stdout, stderr }));
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
      finish({ kind: "unavailable", reason: error.code ?? error.message });
    });

    child.on("close", (code) => {
      finish(classifyPingResult({ code, stdout, stderr }));
    });
  });
}
