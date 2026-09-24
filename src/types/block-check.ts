export type BlockCheckStatus = "unrestricted" | "blocked" | "unknown";

export type BlockCheckServerStatus = {
  id: string;
  status: BlockCheckStatus;
};

export type BlockCheckSnapshot = {
  refreshing: boolean;
  servers: BlockCheckServerStatus[];
};
