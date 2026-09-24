export type ServerReachabilityStatus = "reachable" | "unreachable" | "unknown";

export type ServerReachability = {
  id: string;
  status: ServerReachabilityStatus;
  rttMs: number | null;
};

export type ReachabilitySnapshot = {
  probe: "pending" | "ready";
  refreshing: boolean;
  checkedAt: string | null;
  servers: ServerReachability[];
};
