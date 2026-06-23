"use client";

import { useEffect, useRef } from "react";
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

  useEffect(() => {
    if (!needsSync || startedRef.current) return;
    startedRef.current = true;

    notifyOperationStarted(serverId);

    void syncRemoteRulesAction(serverId).then(() => {
      router.refresh();
    });
  }, [needsSync, serverId, router]);

  return null;
}
