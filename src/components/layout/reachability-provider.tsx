"use client";

import { createContext, useContext, useEffect, useState } from "react";

import { REACHABILITY_STALE_MS } from "@/lib/reachability/schedule";
import type { ReachabilitySnapshot, ServerReachability } from "@/types/reachability";

type ReachabilityView = {
  probe: ReachabilitySnapshot["probe"];
  servers: ReadonlyMap<string, ServerReachability>;
};

const ReachabilityContext = createContext<ReachabilityView>({
  probe: "pending",
  servers: new Map(),
});

export function useServerReachability(serverId: string): ServerReachability | null {
  return useContext(ReachabilityContext).servers.get(serverId) ?? null;
}

export function useReachabilityProbe(): ReachabilityView["probe"] {
  return useContext(ReachabilityContext).probe;
}

export function ReachabilityProvider({ children }: { children: React.ReactNode }) {
  const [view, setView] = useState<ReachabilityView>({ probe: "pending", servers: new Map() });

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
        const response = await fetch("/api/servers/reachability", { cache: "no-store" });
        if (!active || response.status === 401) {
          return;
        }
        if (!response.ok) {
          schedule(10_000);
          return;
        }

        const data = (await response.json()) as ReachabilitySnapshot;
        if (!active) {
          return;
        }

        const checkedAt = data.checkedAt ? Date.parse(data.checkedAt) : Number.NaN;
        const stale = !Number.isFinite(checkedAt) || Date.now() - checkedAt > REACHABILITY_STALE_MS;
        if (data.probe === "unavailable") {
          setView({ probe: "unavailable", servers: new Map() });
        } else if (data.probe === "ready" && !stale) {
          setView({
            probe: "ready",
            servers: new Map(data.servers.map((server) => [server.id, server])),
          });
        } else if (data.probe === "pending") {
          setView({ probe: "pending", servers: new Map() });
        }

        schedule(data.probe === "pending" || data.refreshing ? 2_000 : 10_000);
      } catch {
        schedule(10_000);
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

  return <ReachabilityContext.Provider value={view}>{children}</ReachabilityContext.Provider>;
}
