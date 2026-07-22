import { useEffect, useRef } from "react";

import { OPERATION_ENDED_EVENT } from "@/lib/operations/events";
import {
  activeOperationPollDelayMs,
  isTerminalOperationStatus,
} from "@/lib/operations/poll-interval";

type UseActiveOperationPollOptions<T extends { status: string }> = {
  serverId: string;
  targetId: string | null | undefined;
  active: boolean;
  operationTypes: string[];
  poll: (targetId: string) => Promise<T | null>;
};

export function useActiveOperationPoll<T extends { status: string }>({
  serverId,
  targetId,
  active,
  operationTypes,
  poll,
}: UseActiveOperationPollOptions<T>): void {
  const pollAttemptRef = useRef(0);
  const pollRef = useRef(poll);
  pollRef.current = poll;

  useEffect(() => {
    if (!active || !targetId) {
      return;
    }

    pollAttemptRef.current = 0;
    let cancelled = false;
    let timer: number | undefined;

    const runPoll = () => {
      void pollRef
        .current(targetId)
        .then((result) => {
          if (cancelled) {
            return;
          }
          if (result && isTerminalOperationStatus(result.status)) {
            return;
          }
          pollAttemptRef.current += 1;
          timer = window.setTimeout(runPoll, activeOperationPollDelayMs(pollAttemptRef.current));
        })
        .catch(() => {
          if (cancelled) {
            return;
          }
          pollAttemptRef.current += 1;
          timer = window.setTimeout(runPoll, activeOperationPollDelayMs(pollAttemptRef.current));
        });
    };

    runPoll();

    return () => {
      cancelled = true;
      if (timer !== undefined) {
        window.clearTimeout(timer);
      }
    };
  }, [active, targetId]);

  useEffect(() => {
    function onOperationEnded(event: Event) {
      const detail = (event as CustomEvent<{ serverId?: string; operationType?: string }>).detail;
      if (detail?.serverId && detail.serverId !== serverId) {
        return;
      }
      if (detail?.operationType && !operationTypes.includes(detail.operationType)) {
        return;
      }
      if (!active || !targetId) {
        return;
      }

      pollAttemptRef.current = 0;
      void pollRef.current(targetId).catch(() => undefined);
    }

    window.addEventListener(OPERATION_ENDED_EVENT, onOperationEnded);
    return () => window.removeEventListener(OPERATION_ENDED_EVENT, onOperationEnded);
  }, [active, operationTypes, serverId, targetId]);
}
