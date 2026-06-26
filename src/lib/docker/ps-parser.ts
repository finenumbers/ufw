import type { PublishedPort } from "@/types/docker-monitor";

export type DockerPsRow = {
  containerId: string;
  name: string;
  image: string;
  status: string;
  state: string;
  publishedPorts: PublishedPort[];
  composeProject: string | null;
  composeService: string | null;
  labels: Record<string, string>;
  createdAtRemote: Date | null;
};

function parseLabels(raw: unknown): Record<string, string> {
  if (typeof raw !== "string" || !raw.trim()) {
    return {};
  }

  const labels: Record<string, string> = {};
  for (const part of raw.split(",")) {
    const eq = part.indexOf("=");
    if (eq <= 0) continue;
    labels[part.slice(0, eq).trim()] = part.slice(eq + 1).trim();
  }
  return labels;
}

export function parsePublishedPorts(raw: unknown): PublishedPort[] {
  if (typeof raw !== "string" || !raw.trim()) {
    return [];
  }

  const ports: PublishedPort[] = [];
  for (const segment of raw.split(",")) {
    const trimmed = segment.trim();
    if (!trimmed) continue;

    const match = trimmed.match(/^(?:(\[?[0-9a-f:.]+\]?):)?(\d+)->(\d+)\/(tcp|udp)$/i);
    if (!match) continue;

    ports.push({
      host: match[1]?.replace(/^\[|\]$/g, "") ?? null,
      container: Number.parseInt(match[3], 10),
      protocol: match[4].toLowerCase(),
    });
  }

  return ports;
}

function normalizeContainerName(names: unknown): string {
  if (typeof names !== "string" || !names.trim()) {
    return "";
  }

  return names.split(",")[0]?.replace(/^\//, "").trim() ?? "";
}

function parseCreatedAt(raw: unknown): Date | null {
  if (typeof raw !== "string" || !raw.trim()) {
    return null;
  }

  const parsed = Date.parse(raw);
  return Number.isNaN(parsed) ? null : new Date(parsed);
}

export function parseDockerPsOutput(output: string): DockerPsRow[] {
  const rows: DockerPsRow[] = [];

  for (const line of output.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(trimmed) as Record<string, unknown>;
    } catch {
      continue;
    }

    const containerId = typeof parsed.ID === "string" ? parsed.ID.slice(0, 12) : "";
    if (!containerId) continue;

    const labels = parseLabels(parsed.Labels);
    rows.push({
      containerId,
      name: normalizeContainerName(parsed.Names),
      image: typeof parsed.Image === "string" ? parsed.Image : "",
      status: typeof parsed.Status === "string" ? parsed.Status : "",
      state: typeof parsed.State === "string" ? parsed.State.toLowerCase() : "",
      publishedPorts: parsePublishedPorts(parsed.Ports),
      composeProject: labels["com.docker.compose.project"] ?? null,
      composeService: labels["com.docker.compose.service"] ?? null,
      labels,
      createdAtRemote: parseCreatedAt(parsed.CreatedAt),
    });
  }

  return rows;
}
