"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { notifyOperationStarted } from "@/lib/operations/events";
import { syncRemoteRulesAction } from "@/server/actions/servers";

type ServerInitialSyncProps = {
  serverId: string;
  needsSync: boolean;
};

export function ServerInitialSync({ serverId, needsSync }: ServerInitialSyncProps) {
  const router = useRouter();
  const startedRef = useRef(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  useEffect(() => {
    if (!needsSync || startedRef.current) return;
    startedRef.current = true;

    notifyOperationStarted(serverId);

    void syncRemoteRulesAction(serverId).then((result) => {
      if (!result.success) {
        setSyncError("error" in result ? result.error : "Sync failed");
        return;
      }
      router.refresh();
    });
  }, [needsSync, serverId, router]);

  if (!syncError) {
    return null;
  }

  return <p className="text-sm text-destructive">{syncError}</p>;
}
