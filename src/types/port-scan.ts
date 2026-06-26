import type {
  PortScanEnrichmentStatus,
  PortScanFindingSource,
  PortScanProfile,
  PortScanPerspective,
  OperationStatus,
  UfwCoverage,
} from "@prisma/client";

export type PortScanSummary = {
  openCount: number;
  enrichedCount: number;
  notInUfwCount: number;
  allowedCount: number;
};

export type PortScanFindingView = {
  id: string;
  port: number;
  protocol: string;
  state: string;
  serviceName: string | null;
  product: string | null;
  version: string | null;
  banner: string | null;
  cpe: string | null;
  source: PortScanFindingSource;
  enrichmentStatus: PortScanEnrichmentStatus;
  ufwCoverage: UfwCoverage | null;
  displayLabel: string | null;
};

export type PortScanView = {
  id: string;
  serverId: string;
  status: OperationStatus;
  perspective: PortScanPerspective;
  targetHost: string;
  targetIp: string | null;
  profile: PortScanProfile;
  summary: PortScanSummary | null;
  errorMessage: string | null;
  startedAt: string;
  completedAt: string | null;
  findings: PortScanFindingView[];
};

export type NaabuDiscoveryRow = {
  host: string;
  port: number;
  protocol: string;
  state: string;
  raw: unknown;
};

export type NmapEnrichmentRow = {
  port: number;
  protocol: string;
  state: string;
  serviceName: string | null;
  product: string | null;
  version: string | null;
  banner: string | null;
  cpe: string | null;
  raw: unknown;
};

export type NormalizedFinding = {
  port: number;
  protocol: string;
  state: string;
  serviceName: string | null;
  product: string | null;
  version: string | null;
  banner: string | null;
  cpe: string | null;
  source: PortScanFindingSource;
  enrichmentStatus: PortScanEnrichmentStatus;
  ufwCoverage: UfwCoverage | null;
  rawJson: unknown;
  displayLabel: string | null;
};
