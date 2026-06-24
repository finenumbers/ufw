import type { SshClient } from "@/lib/ssh/client";

function shellQuote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

export async function execCommand(
  client: SshClient,
  command: string,
): Promise<{ stdout: string; stderr: string; code: number }> {
  return client.exec(command);
}

export function combineExecOutput(result: {
  stdout: string;
  stderr: string;
}): string {
  return [result.stdout, result.stderr].filter(Boolean).join("\n").trim();
}

export async function execSudo(
  client: SshClient,
  command: string,
  password?: string,
): Promise<{ stdout: string; stderr: string; code: number }> {
  const ufwCommand = command.replace(/^ufw\b/, "/usr/sbin/ufw");

  if (password) {
    return client.execWithStdin(
      `sudo -S bash -c ${shellQuote(ufwCommand)}`,
      `${password}\n`,
    );
  }

  return client.exec(`sudo bash -c ${shellQuote(ufwCommand)}`);
}
