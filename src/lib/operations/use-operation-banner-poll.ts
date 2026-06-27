import { useCallback, useEffect, useRef } from "react";

import { isOperationDismissed, notifyOperationEnded, OPERATION_STARTED_EVENT } from "@/lib/operations/events";
import { activeOperationPollDelayMs } from "@/lib/operations/poll-interval";
import {
  parseOperationMetadata,
  type ActiveOperation,
} from "@/types/operation";

type UseOperationBannerPollOptions = {
  serverId?: string;
  onOperation: (operation: ActiveOperation | null) => void;
};

export function useOperationBannerPoll({ serverId, onOperation }: UseOperationBannerPollOptions) {
  const onOperationRef = useRef(onOperation);
  onOperationRef.current = onOperation;

  const load = useCallback(async () => {
    if (!serverId) {
      onOperationRef.current(null);
      return null;
    }

    const response = await fetch(`/api/operations/active?serverId=${serverId}`);
    if (!response.ok) {
      onOperationRef.current(null);
      return null;
    }

    const data = (await response.json()) as ActiveOperation | null;
    if (!data || isOperationDismissed(data.id)) {
      onOperationRef.current(null);
      return null;
    }

    const parsed: ActiveOperation = {
      ...data,
      metadata: parseOperationMetadata(data.metadata),
    };

    onOperationRef.current(parsed);
    if (
      parsed.status === "SUCCESS" ||
      parsed.status === "FAILED" ||
      parsed.status === "PARTIAL"
    ) {
      notifyOperationEnded(serverId, parsed.type);
    }
    return parsed;
  }, [serverId]);

  useEffect(() => {
    if (!serverId) {
      return;
    }

    let active = true;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const schedule = (delayMs: number) => {
      if (timer) {
        clearTimeout(timer);
      }
      timer = setTimeout(async () => {
        if (!active) {
          return;
        }
        const current = await load();
        const nextDelay =
          current?.status === "RUNNING" ? activeOperationPollDelayMs(0) : 5000;
        schedule(nextDelay);
      }, delayMs);
    };

    void load().then((current) => {
      if (!active) {
        return;
      }
      schedule(current?.status === "RUNNING" ? activeOperationPollDelayMs(0) : 5000);
    });

    const onStarted = (event: Event) => {
      const detail = (event as CustomEvent<{ serverId?: string }>).detail;
      if (detail?.serverId && detail.serverId !== serverId) {
        return;
      }
      if (timer) {
        clearTimeout(timer);
      }
      void load().then(() => schedule(activeOperationPollDelayMs(0)));
    };

    window.addEventListener(OPERATION_STARTED_EVENT, onStarted);

    return () => {
      active = false;
      if (timer) {
        clearTimeout(timer);
      }
      window.removeEventListener(OPERATION_STARTED_EVENT, onStarted);
    };
  }, [serverId, load]);
}
