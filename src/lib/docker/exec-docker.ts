import type { SshClient } from "@/lib/ssh/client";
import { execCommand, execSudo } from "@/lib/ssh/exec";

import { shellQuote } from "@/lib/docker/container-ref";

const PERMISSION_DENIED = /permission denied|cannot connect to the docker daemon/i;

function buildDockerCommand(args: string[]): string {
  return `docker ${args.map((arg) => shellQuote(arg)).join(" ")}`;
}

export async function execDocker(
  client: SshClient,
  args: string[],
  options?: { sudoPassword?: string },
): Promise<{ stdout: string; stderr: string; code: number }> {
  const command = buildDockerCommand(args);
  const direct = await execCommand(client, command);

  if (direct.code === 0) {
    return direct;
  }

  if (!PERMISSION_DENIED.test(`${direct.stdout}\n${direct.stderr}`)) {
    return direct;
  }

  const sudoCommand = buildDockerCommand(args);
  const sudo = await execSudo(client, sudoCommand, options?.sudoPassword);

  if (sudo.code !== 0 && PERMISSION_DENIED.test(`${sudo.stdout}\n${sudo.stderr}`)) {
    return {
      ...sudo,
      stderr: `${sudo.stderr}\nDocker permission denied. Add the SSH user to the docker group or configure passwordless sudo for docker.`.trim(),
    };
  }

  return sudo;
}

export async function execDockerRaw(
  client: SshClient,
  shellCommand: string,
  options?: { sudoPassword?: string },
): Promise<{ stdout: string; stderr: string; code: number }> {
  const direct = await execCommand(client, shellCommand);

  if (direct.code === 0) {
    return direct;
  }

  if (!PERMISSION_DENIED.test(`${direct.stdout}\n${direct.stderr}`)) {
    return direct;
  }

  const sudo = await execSudo(client, shellCommand, options?.sudoPassword);
  if (sudo.code !== 0 && PERMISSION_DENIED.test(`${sudo.stdout}\n${sudo.stderr}`)) {
    return {
      ...sudo,
      stderr: `${sudo.stderr}\nDocker permission denied. Add the SSH user to the docker group or configure passwordless sudo for docker.`.trim(),
    };
  }

  return sudo;
}
