import { combineExecOutput, execCommand } from "@/lib/ssh/exec";
import type { SshClient } from "@/lib/ssh/client";

function parseInterfaceList(raw: string): string[] {
  return [
    ...new Set(
      raw
        .split(/\n/)
        .map((line) => line.trim())
        .filter(Boolean),
    ),
  ].sort((a, b) => a.localeCompare(b));
}

export async function loadNetworkInterfaces(client: SshClient): Promise<string[]> {
  const ipResult = await execCommand(
    client,
    "ip -o link show 2>/dev/null | awk -F': ' '{gsub(/^ /,\"\",$2); print $2}' | awk '{print $1}'",
  );
  const fromIp = parseInterfaceList(combineExecOutput(ipResult));
  if (fromIp.length > 0) {
    return fromIp;
  }

  const lsResult = await execCommand(client, "ls /sys/class/net/ 2>/dev/null");
  return parseInterfaceList(combineExecOutput(lsResult));
}

export function collectInterfaceOptions(
  networkInterfaces: string[],
  rules: Array<{ core: { interface?: string | null } }>,
): string[] {
  const set = new Set(networkInterfaces);
  for (const rule of rules) {
    const value = rule.core.interface?.trim();
    if (value) {
      set.add(value);
    }
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}
