import type { OperationStatus } from "@prisma/client";

export type DockerContainerAction = "START" | "STOP" | "RESTART";

export type PublishedPort = {
  host: string | null;
  container: number;
  protocol: string;
};

export type DockerContainerView = {
  id: string;
  containerId: string;
  name: string;
  image: string;
  status: string;
  health: string | null;
  stateExitCode: number | null;
  restartCount: number | null;
  publishedPorts: PublishedPort[];
  composeProject: string | null;
  composeService: string | null;
  cpuPercent: number | null;
  memUsageBytes: string | null;
  memLimitBytes: string | null;
  memUsageLabel: string | null;
  startedAt: string | null;
  createdAtRemote: string | null;
};

export type DockerInventorySummary = {
  containerCount: number;
  runningCount: number;
  stoppedCount: number;
};

export type DockerInventoryView = {
  id: string;
  serverId: string;
  status: OperationStatus;
  dockerInstalled: boolean;
  dockerReachable: boolean;
  dockerVersion: string | null;
  composeVersion: string | null;
  summary: DockerInventorySummary | null;
  errorMessage: string | null;
  capturedAt: string;
  containers: DockerContainerView[];
};

export type DockerInspectView = {
  containerId: string;
  name: string;
  image: string;
  status: string;
  health: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  exitCode: number | null;
  restartCount: number | null;
  publishedPorts: PublishedPort[];
  mounts: Array<{ type: string; source: string; destination: string; mode: string }>;
  networks: string[];
  labels: Record<string, string>;
  env: Array<{ key: string; value: string; masked: boolean }>;
  command: string | null;
  workingDir: string | null;
};

export type NormalizedDockerContainer = {
  containerId: string;
  name: string;
  image: string;
  status: string;
  health: string | null;
  stateExitCode: number | null;
  restartCount: number | null;
  publishedPorts: PublishedPort[];
  composeProject: string | null;
  composeService: string | null;
  cpuPercent: number | null;
  memUsageBytes: bigint | null;
  memLimitBytes: bigint | null;
  memUsageLabel: string | null;
  startedAt: Date | null;
  createdAtRemote: Date | null;
};
