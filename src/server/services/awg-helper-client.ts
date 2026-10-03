import net from "node:net";

const SOCKET_PATH = process.env.AWG_HELPER_SOCKET ?? "/run/awg/helper.sock";

export class AwgHelperError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AwgHelperError";
  }
}

export type AwgHelperStatus = {
  up: boolean;
  latestHandshake: number | null;
  rx: number;
  tx: number;
  error: string | null;
};

export type AwgHelperApply = {
  address: string;
  mtu: number;
  endpointHost: string;
  endpointPort: number;
  setconf: string;
};

export function awgHelperRequest<T>(
  payload: Record<string, unknown>,
  timeoutMs = 20_000,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection(SOCKET_PATH);
    let buffer = "";
    const timer = setTimeout(() => {
      socket.destroy();
      reject(new AwgHelperError("AmneziaWG helper timed out"));
    }, timeoutMs);

    const fail = (error: Error) => {
      clearTimeout(timer);
      socket.destroy();
      reject(error);
    };

    socket.on("error", (error: NodeJS.ErrnoException) => {
      if (error.code === "ENOENT" || error.code === "ECONNREFUSED") {
        fail(new AwgHelperError("AmneziaWG is available in the app container"));
        return;
      }
      fail(error);
    });

    socket.on("data", (chunk: Buffer) => {
      buffer += chunk.toString("utf8");
      const newline = buffer.indexOf("\n");
      if (newline === -1) {
        return;
      }
      clearTimeout(timer);
      socket.end();
      try {
        const message = JSON.parse(buffer.slice(0, newline)) as {
          ok: boolean;
          result?: T;
          error?: string;
        };
        if (!message.ok) {
          reject(new AwgHelperError(message.error || "AmneziaWG helper failed"));
          return;
        }
        resolve(message.result as T);
      } catch (error) {
        reject(error instanceof Error ? error : new Error("AmneziaWG helper failed"));
      }
    });

    socket.write(`${JSON.stringify(payload)}\n`);
  });
}
