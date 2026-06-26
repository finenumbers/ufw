import {
  getPortScanMaxNmapPorts,
  getPortScanNaabuTimeoutMs,
  getPortScanNmapTimeoutMs,
  resolveNaabuPortArg,
} from "@/lib/port-scan/config";
import { parseNaabuJsonOutput } from "@/lib/port-scan/naabu-parser";
import { parseNmapXmlOutput } from "@/lib/port-scan/nmap-parser";
import { runCommand } from "@/lib/port-scan/runner";
import type { NaabuDiscoveryRow, NmapEnrichmentRow } from "@/types/port-scan";

export async function runNaabuDiscovery(
  target: string,
): Promise<{ rows: NaabuDiscoveryRow[]; stderr: string }> {
  const args = [
    "-host",
    target,
    ...resolveNaabuPortArg(),
    "-json",
    "-silent",
    "-scan-type",
    "c",
  ];

  const result = await runCommand("naabu", args, getPortScanNaabuTimeoutMs());

  if (result.timedOut) {
    throw new Error("Port discovery timed out");
  }

  const rows = parseNaabuJsonOutput(result.stdout);
  if (rows.length === 0 && result.exitCode !== 0) {
    throw new Error(result.stderr.trim() || "Port discovery failed");
  }

  return { rows, stderr: result.stderr };
}

export async function runNmapEnrichment(
  target: string,
  discovery: NaabuDiscoveryRow[],
): Promise<{ rows: NmapEnrichmentRow[]; stderr: string }> {
  const capped = discovery.slice(0, getPortScanMaxNmapPorts());
  if (capped.length === 0) {
    return { rows: [], stderr: "" };
  }

  const tcpPorts = [...new Set(capped.filter((row) => row.protocol === "tcp").map((row) => row.port))];
  if (tcpPorts.length === 0) {
    return { rows: [], stderr: "" };
  }

  const args = [
    "-Pn",
    "-sT",
    "-sV",
    "--version-light",
    "-p",
    tcpPorts.join(","),
    "-oX",
    "-",
    target,
  ];

  const result = await runCommand("nmap", args, getPortScanNmapTimeoutMs());

  if (result.timedOut) {
    throw new Error("Service enrichment timed out");
  }

  const rows = parseNmapXmlOutput(result.stdout);
  if (rows.length === 0 && result.exitCode !== 0) {
    throw new Error(result.stderr.trim() || "Service enrichment failed");
  }

  return { rows, stderr: result.stderr };
}
