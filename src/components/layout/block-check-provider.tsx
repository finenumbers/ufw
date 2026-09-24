"use client";

import { createContext, useContext, useEffect, useState } from "react";

import { BLOCK_CHECK_POLL_MS } from "@/lib/block-check/schedule";
import type { BlockCheckSnapshot, BlockCheckStatus } from "@/types/block-check";

const BlockCheckContext = createContext<ReadonlyMap<string, BlockCheckStatus>>(new Map());

export function useServerBlockCheck(serverId: string): BlockCheckStatus | null {
  return useContext(BlockCheckContext).get(serverId) ?? null;
}

export function BlockCheckProvider({ children }: { children: React.ReactNode }) {
  const [servers, setServers] = useState<ReadonlyMap<string, BlockCheckStatus>>(new Map());

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let running = false;

    const schedule = (delayMs: number) => {
      if (!active || document.visibilityState === "hidden") {
        return;
      }
      if (timer) {
        clearTimeout(timer);
      }
      timer = setTimeout(() => {
        void tick();
      }, delayMs);
    };

    const tick = async () => {
      if (!active || running || document.visibilityState === "hidden") {
        return;
      }

      running = true;
      try {
        const response = await fetch("/api/servers/block-check", { cache: "no-store" });
        if (!active || response.status === 401) {
          return;
        }
        if (!response.ok) {
          schedule(BLOCK_CHECK_POLL_MS);
          return;
        }

        const data = (await response.json()) as BlockCheckSnapshot;
        if (!active) {
          return;
        }

        setServers(new Map(data.servers.map((server) => [server.id, server.status])));
        schedule(data.refreshing ? 2_000 : BLOCK_CHECK_POLL_MS);
      } catch {
        schedule(BLOCK_CHECK_POLL_MS);
      } finally {
        running = false;
      }
    };

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        void tick();
      }
    };

    document.addEventListener("visibilitychange", onVisible);
    void tick();

    return () => {
      active = false;
      if (timer) {
        clearTimeout(timer);
      }
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return <BlockCheckContext.Provider value={servers}>{children}</BlockCheckContext.Provider>;
}
