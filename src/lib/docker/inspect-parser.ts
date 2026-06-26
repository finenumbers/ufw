import { parsePublishedPorts } from "@/lib/docker/ps-parser";
import { maskEnvValue } from "@/lib/docker/mask-env";
import type { DockerInspectView } from "@/types/docker-monitor";

type InspectPayload = {
  Id?: string;
  Name?: string;
  Config?: {
    Image?: string;
    Env?: string[];
    Labels?: Record<string, string>;
    Cmd?: string[];
    WorkingDir?: string;
  };
  State?: {
    Status?: string;
    Health?: { Status?: string };
    StartedAt?: string;
    FinishedAt?: string;
    ExitCode?: number;
    RestartCount?: number;
  };
  NetworkSettings?: {
    Ports?: Record<string, Array<{ HostIp?: string; HostPort?: string }> | null>;
    Networks?: Record<string, unknown>;
  };
  Mounts?: Array<{
    Type?: string;
    Source?: string;
    Destination?: string;
    Mode?: string;
  }>;
};

function portsFromInspect(payload: InspectPayload): DockerInspectView["publishedPorts"] {
  const ports = payload.NetworkSettings?.Ports;
  if (!ports) return [];

  const segments: string[] = [];
  for (const [key, bindings] of Object.entries(ports)) {
    if (!bindings?.length) continue;
    const [containerPort, proto] = key.split("/");
    for (const binding of bindings) {
      const host = binding.HostIp && binding.HostIp !== "0.0.0.0" ? binding.HostIp : binding.HostIp ?? "";
      const hostPort = binding.HostPort ?? "";
      segments.push(`${host ? `[${host}]:` : ""}${hostPort}->${containerPort}/${proto ?? "tcp"}`);
    }
  }

  return parsePublishedPorts(segments.join(", "));
}

export function parseDockerInspectOutput(output: string): DockerInspectView | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(output);
  } catch {
    return null;
  }

  const payload = (Array.isArray(parsed) ? parsed[0] : parsed) as InspectPayload | undefined;
  if (!payload?.Id) {
    return null;
  }

  const containerId = payload.Id.slice(0, 12);
  const name = (payload.Name ?? "").replace(/^\//, "");
  const env = (payload.Config?.Env ?? []).map((entry) => {
    const eq = entry.indexOf("=");
    const key = eq >= 0 ? entry.slice(0, eq) : entry;
    const value = eq >= 0 ? entry.slice(eq + 1) : "";
    const masked = maskEnvValue(key, value);
    return { key, value: masked.value, masked: masked.masked };
  });

  return {
    containerId,
    name: name || containerId,
    image: payload.Config?.Image ?? "",
    status: payload.State?.Status ?? "",
    health: payload.State?.Health?.Status ?? null,
    startedAt: payload.State?.StartedAt ?? null,
    finishedAt: payload.State?.FinishedAt ?? null,
    exitCode: payload.State?.ExitCode ?? null,
    restartCount: payload.State?.RestartCount ?? null,
    publishedPorts: portsFromInspect(payload),
    mounts: (payload.Mounts ?? []).map((mount) => ({
      type: mount.Type ?? "",
      source: mount.Source ?? "",
      destination: mount.Destination ?? "",
      mode: mount.Mode ?? "",
    })),
    networks: Object.keys(payload.NetworkSettings?.Networks ?? {}),
    labels: payload.Config?.Labels ?? {},
    env,
    command: payload.Config?.Cmd?.join(" ") ?? null,
    workingDir: payload.Config?.WorkingDir ?? null,
  };
}
