import { execSudo, combineExecOutput } from "@/lib/ssh/exec";
import type { SshClient } from "@/lib/ssh/client";
import { UFW_COMMANDS, buildAllowSshCommand } from "@/lib/ufw/commands";
import { parseUfwStatusAndRules, parseVerboseStatus } from "@/lib/ufw/parser";
import type { ApplyPlan } from "@/types/apply";
import { createChildLogger } from "@/lib/logger";

const log = createChildLogger("ufw-apply");

export type ApplyExecutionResult = {
  success: boolean;
  partial?: boolean;
  executedCommands: string[];
  errors: string[];
  refreshedStatus?: string;
};

export type ApplyProgressEvent = {
  index: number;
  total: number;
  item: ApplyPlan["items"][number];
  status: "RUNNING" | "SUCCESS" | "FAILED";
  error?: string;
};

export async function executeApplyPlan(
  client: SshClient,
  plan: ApplyPlan,
  sudoPassword?: string,
  options?: {
    onProgress?: (event: ApplyProgressEvent) => void | Promise<void>;
    exec?: typeof execSudo;
  },
): Promise<ApplyExecutionResult> {
  const runExec = options?.exec ?? execSudo;
  const executedCommands: string[] = [];
  const errors: string[] = [];
  const total = plan.items.length;
  let stoppedEarly = false;
  let successCount = 0;

  for (let index = 0; index < plan.items.length; index += 1) {
    const item = plan.items[index];
    if (!item.remoteCommand) {
      const error = `Missing UFW command for ${item.action} (${item.fingerprint})`;
      errors.push(error);
      await options?.onProgress?.({ index, total, item, status: "FAILED", error });
      stoppedEarly = true;
      break;
    }

    await options?.onProgress?.({ index, total, item, status: "RUNNING" });

    log.info({ command: item.remoteCommand, action: item.action }, "Executing UFW command");
    const result = await runExec(client, item.remoteCommand, sudoPassword);
    executedCommands.push(item.remoteCommand);

    if (result.code !== 0) {
      const error = result.stderr || result.stdout || `Command failed: ${item.remoteCommand}`;
      errors.push(error);
      await options?.onProgress?.({ index, total, item, status: "FAILED", error });
      stoppedEarly = true;
      break;
    }

    await options?.onProgress?.({ index, total, item, status: "SUCCESS" });
    successCount += 1;
  }

  if (plan.items.length > 0 && executedCommands.length === 0) {
    return {
      success: false,
      partial: false,
      executedCommands,
      errors: errors.length > 0 ? errors : ["No UFW commands were executed"],
    };
  }

  if (stoppedEarly) {
    return {
      success: false,
      partial: successCount > 0,
      executedCommands,
      errors,
    };
  }

  const statusResult = await runExec(
    client,
    UFW_COMMANDS.statusNumbered,
    sudoPassword,
  );

  return {
    success: errors.length === 0,
    partial: false,
    executedCommands,
    errors,
    refreshedStatus: statusResult.stdout,
  };
}

export async function installUfw(
  client: SshClient,
  sudoPassword?: string,
): Promise<{ success: boolean; message: string }> {
  const result = await execSudo(client, UFW_COMMANDS.installDebian, sudoPassword);
  if (result.code !== 0) {
    return { success: false, message: result.stderr || result.stdout };
  }
  return { success: true, message: "UFW installed successfully" };
}

export async function enableUfw(
  client: SshClient,
  sudoPassword?: string,
  sshPort = 22,
): Promise<{ success: boolean; message: string }> {
  const allowResult = await execSudo(
    client,
    buildAllowSshCommand(sshPort),
    sudoPassword,
  );
  if (allowResult.code !== 0) {
    return { success: false, message: allowResult.stderr || allowResult.stdout };
  }

  const result = await execSudo(client, UFW_COMMANDS.enable, sudoPassword);
  if (result.code !== 0) {
    return { success: false, message: result.stderr || result.stdout };
  }
  return { success: true, message: "UFW enabled successfully" };
}

async function detectUfwInstalled(
  client: SshClient,
  sudoPassword?: string,
): Promise<boolean> {
  const versionResult = await execSudo(client, UFW_COMMANDS.version, sudoPassword);
  const versionOutput = combineExecOutput(versionResult);
  if (/ufw\s+\d+/i.test(versionOutput)) {
    return true;
  }

  const pathResult = await client.exec(UFW_COMMANDS.checkInstalled);
  return pathResult.stdout.trim() === "installed";
}

type UfwProbeResult = {
  installed: boolean;
  active: boolean;
  rawStatus: string;
};

async function probeUfwStatus(
  client: SshClient,
  sudoPassword?: string,
): Promise<UfwProbeResult> {
  const numberedResult = await execSudo(
    client,
    UFW_COMMANDS.statusNumbered,
    sudoPassword,
  );
  const numberedOutput = combineExecOutput(numberedResult);

  if (numberedOutput.includes("Status:")) {
    const parsed = parseUfwStatusAndRules(numberedOutput);
    return {
      installed: true,
      active: parsed.active,
      rawStatus: numberedOutput,
    };
  }

  const verboseResult = await execSudo(
    client,
    UFW_COMMANDS.statusVerbose,
    sudoPassword,
  );
  const verboseOutput = combineExecOutput(verboseResult);

  if (verboseOutput.includes("Status:")) {
    const parsed = parseVerboseStatus(verboseOutput);
    return {
      installed: true,
      active: parsed.active,
      rawStatus: verboseOutput,
    };
  }

  const installed = await detectUfwInstalled(client, sudoPassword);
  if (!installed) {
    return {
      installed: false,
      active: false,
      rawStatus: verboseOutput || numberedOutput || "UFW not installed",
    };
  }

  return {
    installed: true,
    active: false,
    rawStatus:
      verboseOutput ||
      numberedOutput ||
      "UFW is installed but status could not be read (check sudo permissions).",
  };
}

export async function loadUfwStatusAndRules(
  client: SshClient,
  sudoPassword?: string,
): Promise<{ rawStatus: string; active: boolean; rules: ReturnType<typeof parseUfwStatusAndRules>["rules"] }> {
  const numberedRaw = await loadUfwRules(client, sudoPassword);
  if (numberedRaw.includes("Status:")) {
    const parsed = parseUfwStatusAndRules(numberedRaw);
    return {
      rawStatus: numberedRaw,
      active: parsed.active,
      rules: parsed.rules,
    };
  }

  const probe = await probeUfwStatus(client, sudoPassword);
  if (!probe.installed) {
    return { rawStatus: probe.rawStatus, active: false, rules: [] };
  }

  const rules = parseUfwStatusAndRules(probe.rawStatus).rules;
  if (rules.length > 0) {
    return { rawStatus: probe.rawStatus, active: probe.active, rules };
  }

  const verboseResult = await execSudo(
    client,
    UFW_COMMANDS.statusVerbose,
    sudoPassword,
  );
  const verboseOutput = combineExecOutput(verboseResult);
  const parsed = parseUfwStatusAndRules(verboseOutput);

  return {
    rawStatus: verboseOutput || probe.rawStatus,
    active: parsed.active || probe.active,
    rules: parsed.rules,
  };
}

export async function loadUfwRules(
  client: SshClient,
  sudoPassword?: string,
): Promise<string> {
  const result = await execSudo(client, UFW_COMMANDS.statusNumbered, sudoPassword);
  return combineExecOutput(result);
}
