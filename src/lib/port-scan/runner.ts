import { spawn } from "node:child_process";

export type CommandResult = {
  stdout: string;
  stderr: string;
  exitCode: number;
  timedOut: boolean;
};

export async function runCommand(
  command: string,
  args: string[],
  timeoutMs: number,
): Promise<CommandResult> {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGKILL");
    }, timeoutMs);

    child.stdout?.on("data", (chunk: Buffer) => {
      stdout += chunk.toString();
      if (stdout.length > 5_000_000) {
        stdout = stdout.slice(0, 5_000_000);
      }
    });

    child.stderr?.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
      if (stderr.length > 1_000_000) {
        stderr = stderr.slice(0, 1_000_000);
      }
    });

    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({
        stdout,
        stderr,
        exitCode: code ?? 1,
        timedOut,
      });
    });

    child.on("error", (error) => {
      clearTimeout(timer);
      resolve({
        stdout,
        stderr: `${stderr}\n${error.message}`.trim(),
        exitCode: 1,
        timedOut,
      });
    });
  });
}
