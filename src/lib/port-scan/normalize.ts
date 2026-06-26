import type { PortScanFindingSource, PortScanEnrichmentStatus, UfwCoverage } from "@prisma/client";

import type { NaabuDiscoveryRow, NmapEnrichmentRow, NormalizedFinding } from "@/types/port-scan";

export function buildDisplayLabel(input: {
  serviceName: string | null;
  product: string | null;
  version: string | null;
}): string | null {
  const parts = [input.product ?? input.serviceName, input.version].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : input.serviceName;
}

export function mergeDiscoveryAndEnrichment(
  discovery: NaabuDiscoveryRow[],
  enrichment: NmapEnrichmentRow[],
  ufwCoverageByKey: Map<string, UfwCoverage>,
): NormalizedFinding[] {
  const enrichmentByKey = new Map(
    enrichment.map((row) => [`${row.port}/${row.protocol}`, row]),
  );

  return discovery.map((row) => {
    const key = `${row.port}/${row.protocol}`;
    const enriched = enrichmentByKey.get(key);
    const serviceName = enriched?.serviceName ?? null;
    const product = enriched?.product ?? null;
    const version = enriched?.version ?? null;

    return {
      port: row.port,
      protocol: row.protocol,
      state: enriched?.state ?? row.state,
      serviceName,
      product,
      version,
      banner: enriched?.banner ?? null,
      cpe: enriched?.cpe ?? null,
      source: enriched ? ("NMAP" as PortScanFindingSource) : ("NAABU" as PortScanFindingSource),
      enrichmentStatus: enriched
        ? ("ENRICHED" as PortScanEnrichmentStatus)
        : ("SKIPPED" as PortScanEnrichmentStatus),
      ufwCoverage: ufwCoverageByKey.get(key) ?? null,
      rawJson: enriched?.raw ?? row.raw,
      displayLabel: buildDisplayLabel({ serviceName, product, version }),
    };
  });
}

export function summarizeFindings(findings: NormalizedFinding[]) {
  return {
    openCount: findings.length,
    enrichedCount: findings.filter((row) => row.enrichmentStatus === "ENRICHED").length,
    notInUfwCount: findings.filter((row) => row.ufwCoverage === "NOT_IN_UFW").length,
    allowedCount: findings.filter((row) => row.ufwCoverage === "ALLOWED").length,
  };
}
