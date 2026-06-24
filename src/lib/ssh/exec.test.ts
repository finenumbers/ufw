import assert from "node:assert/strict";
import test from "node:test";

import { UFW_COMMANDS } from "@/lib/ufw/commands";

function shellQuote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

function buildPasswordlessSudoCommand(command: string): string {
  const ufwCommand = command.replace(/^ufw\b/, "/usr/sbin/ufw");
  return `sudo bash -c ${shellQuote(ufwCommand)}`;
}

test("passwordless sudo wraps chained apt commands in bash -c", () => {
  const wrapped = buildPasswordlessSudoCommand(UFW_COMMANDS.installDebian);
  assert.equal(
    wrapped,
    "sudo bash -c 'DEBIAN_FRONTEND=noninteractive apt-get update && DEBIAN_FRONTEND=noninteractive apt-get install -y ufw'",
  );
});
