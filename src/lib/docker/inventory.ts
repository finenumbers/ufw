import type { SshClient } from "@/lib/ssh/client";

import { execCommand } from "@/lib/ssh/exec";
import { execDocker } from "@/lib/docker/exec-docker";
import { mergePsAndStats } from "@/lib/docker/normalize";
import { parseDockerPsOutput } from "@/lib/docker/ps-parser";
import { parseDockerStatsOutput } from "@/lib/docker/stats-parser";
import type { NormalizedDockerContainer } from "@/types/docker-monitor";

export type DockerPreflightResult = {
  dockerInstalled: boolean;
  dockerReachable: boolean;
  dockerVersion: string | null;
  composeVersion: string | null;
  errorMessage: string | null;
};

export type DockerInventoryCollectResult = {
  preflight: DockerPreflightResult;
  containers: NormalizedDockerContainer[];
};

export async function runDockerPreflight(
  client: SshClient,
  options?: { sudoPassword?: string },
): Promise<DockerPreflightResult> {
  const which = await execCommand(client, "command -v docker");
  if (which.code !== 0 || !which.stdout.trim()) {
    return {
      dockerInstalled: false,
      dockerReachable: false,
      dockerVersion: null,
      composeVersion: null,
      errorMessage: "Docker CLI is not installed on this server.",
    };
  }

  const info = await execDocker(client, ["info", "--format", "{{json .}}"], options);
  if (info.code !== 0) {
    return {
      dockerInstalled: true,
      dockerReachable: false,
      dockerVersion: null,
      composeVersion: null,
      errorMessage: (info.stderr || info.stdout || "Docker daemon is not reachable.").trim(),
    };
  }

  let dockerVersion: string | null = null;
  try {
    const parsed = JSON.parse(info.stdout) as { ServerVersion?: string };
    dockerVersion = parsed.ServerVersion ?? null;
  } catch {
    dockerVersion = null;
  }

  let composeVersion: string | null = null;
  const compose = await execDocker(client, ["compose", "version", "--short"], options);
  if (compose.code === 0 && compose.stdout.trim()) {
    composeVersion = compose.stdout.trim();
  }

  return {
    dockerInstalled: true,
    dockerReachable: true,
    dockerVersion,
    composeVersion,
    errorMessage: null,
  };
}

export async function collectDockerInventory(
  client: SshClient,
  options?: { sudoPassword?: string },
): Promise<DockerInventoryCollectResult> {
  const preflight = await runDockerPreflight(client, options);
  if (!preflight.dockerReachable) {
    return { preflight, containers: [] };
  }

  const ps = await execDocker(
    client,
    ["ps", "-a", "--no-trunc", "--format", "{{json .}}"],
    options,
  );

  if (ps.code !== 0) {
    return {
      preflight: {
        ...preflight,
        dockerReachable: false,
        errorMessage: (ps.stderr || ps.stdout || "Failed to list containers.").trim(),
      },
      containers: [],
    };
  }

  const psRows = parseDockerPsOutput(ps.stdout);
  const running = psRows.filter((row) => row.state === "running");

  let statsRows = [] as ReturnType<typeof parseDockerStatsOutput>;
  if (running.length > 0) {
    const stats = await execDocker(
      client,
      ["stats", "--no-stream", "--format", "{{json .}}"],
      options,
    );
    if (stats.code === 0) {
      statsRows = parseDockerStatsOutput(stats.stdout);
    }
  }

  return {
    preflight,
    containers: mergePsAndStats(psRows, statsRows),
  };
}

export async function fetchDockerInspect(
  client: SshClient,
  containerRef: string,
  options?: { sudoPassword?: string },
): Promise<{ stdout: string; stderr: string; code: number }> {
  return execDocker(client, ["inspect", containerRef], options);
}
