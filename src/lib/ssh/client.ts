import { Client, type ConnectConfig } from "ssh2";

import { createChildLogger } from "@/lib/logger";
import { resolveSshConnectHost } from "@/lib/ssh/resolve-host";
import { createHostKeyVerifier } from "@/lib/ssh/host-key";

const log = createChildLogger("ssh-client");

const DEFAULT_EXEC_TIMEOUT_MS = 120_000;
const MAX_STREAM_BYTES = 1_048_576;

export type SshConnectionConfig = {
  host: string;
  port: number;
  username: string;
  password?: string;
  privateKey?: string;
  passphrase?: string;
  readyTimeout?: number;
  expectedHostKeyFingerprint?: string | null;
  execTimeoutMs?: number;
};

export type SshConnectResult = {
  hostKeyFingerprint: string | null;
};

export type ExecResult = {
  stdout: string;
  stderr: string;
  code: number;
};

function appendStreamData(current: string, chunk: Buffer, label: "stdout" | "stderr"): string {
  if (current.length >= MAX_STREAM_BYTES) {
    return current;
  }

  const next = current + chunk.toString();
  if (next.length <= MAX_STREAM_BYTES) {
    return next;
  }

  log.warn({ label, maxBytes: MAX_STREAM_BYTES }, "SSH stream output truncated");
  return next.slice(0, MAX_STREAM_BYTES);
}

function sanitizeCommandForLog(command: string): string {
  if (command.includes("sudo -S bash -c")) {
    return "sudo -S bash -c '[redacted]'";
  }

  return command.replace(/echo '[^']*' \| sudo -S bash -c '/, "echo '[redacted]' | sudo -S bash -c '");
}

export class SshClient {
  private client: Client;

  constructor() {
    this.client = new Client();
  }

  async connect(config: SshConnectionConfig): Promise<SshConnectResult> {
    const hostKey = createHostKeyVerifier(config.expectedHostKeyFingerprint);

    const connectConfig: ConnectConfig = {
      host: config.host,
      port: config.port,
      username: config.username,
      readyTimeout: config.readyTimeout ?? 15000,
      hostHash: "sha256",
      hostVerifier: hostKey.verifier,
    };

    if (config.password) {
      connectConfig.password = config.password;
    }

    if (config.privateKey) {
      connectConfig.privateKey = config.privateKey;
      if (config.passphrase) {
        connectConfig.passphrase = config.passphrase;
      }
    }

    return new Promise((resolve, reject) => {
      this.client
        .on("ready", () => {
          log.debug({ host: config.host }, "SSH connection ready");
          resolve({ hostKeyFingerprint: hostKey.getCaptured() });
        })
        .on("error", (err) => {
          log.error({ err, host: config.host }, "SSH connection error");
          reject(err);
        })
        .connect(connectConfig);
    });
  }

  async exec(command: string, execTimeoutMs = DEFAULT_EXEC_TIMEOUT_MS): Promise<ExecResult> {
    log.debug({ command: sanitizeCommandForLog(command) }, "SSH exec");

    return new Promise((resolve, reject) => {
      let settled = false;
      const timeout = setTimeout(() => {
        if (settled) return;
        settled = true;
        this.client.end();
        reject(new Error(`SSH command timed out after ${execTimeoutMs}ms`));
      }, execTimeoutMs);

      this.client.exec(command, (err, stream) => {
        if (err) {
          clearTimeout(timeout);
          reject(err);
          return;
        }

        let stdout = "";
        let stderr = "";

        stream.on("error", (streamError: Error) => {
          if (settled) return;
          settled = true;
          clearTimeout(timeout);
          reject(streamError);
        });

        stream
          .on("close", (code: number) => {
            if (settled) return;
            settled = true;
            clearTimeout(timeout);
            resolve({ stdout, stderr, code: code ?? 0 });
          })
          .on("data", (data: Buffer) => {
            stdout = appendStreamData(stdout, data, "stdout");
          });

        stream.stderr.on("data", (data: Buffer) => {
          stderr = appendStreamData(stderr, data, "stderr");
        });
      });
    });
  }

  async execWithStdin(
    command: string,
    stdin: string,
    execTimeoutMs = DEFAULT_EXEC_TIMEOUT_MS,
  ): Promise<ExecResult> {
    log.debug({ command: sanitizeCommandForLog(command) }, "SSH exec with stdin");

    return new Promise((resolve, reject) => {
      let settled = false;
      const timeout = setTimeout(() => {
        if (settled) return;
        settled = true;
        this.client.end();
        reject(new Error(`SSH command timed out after ${execTimeoutMs}ms`));
      }, execTimeoutMs);

      this.client.exec(command, (err, stream) => {
        if (err) {
          clearTimeout(timeout);
          reject(err);
          return;
        }

        let stdout = "";
        let stderr = "";

        stream.on("error", (streamError: Error) => {
          if (settled) return;
          settled = true;
          clearTimeout(timeout);
          reject(streamError);
        });

        stream
          .on("close", (code: number) => {
            if (settled) return;
            settled = true;
            clearTimeout(timeout);
            resolve({ stdout, stderr, code: code ?? 0 });
          })
          .on("data", (data: Buffer) => {
            stdout = appendStreamData(stdout, data, "stdout");
          });

        stream.stderr.on("data", (data: Buffer) => {
          stderr = appendStreamData(stderr, data, "stderr");
        });

        stream.end(stdin);
      });
    });
  }

  end(): void {
    this.client.end();
  }
}

export async function withSshConnection<T>(
  config: SshConnectionConfig,
  fn: (client: SshClient) => Promise<T>,
): Promise<{ result: T; hostKeyFingerprint: string | null }> {
  const connectHost = await resolveSshConnectHost(config.host);
  const client = new SshClient();
  try {
    const connectResult = await client.connect({ ...config, host: connectHost });
    const result = await fn(client);
    return {
      result,
      hostKeyFingerprint: connectResult.hostKeyFingerprint,
    };
  } finally {
    client.end();
  }
}
