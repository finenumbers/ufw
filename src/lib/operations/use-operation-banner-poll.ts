import { useCallback, useEffect, useRef } from "react";

import { isOperationDismissed, notifyOperationEnded, OPERATION_STARTED_EVENT } from "@/lib/operations/events";
import {
  isTerminalBannerStatus,
  OPERATION_START_GRACE_POLL_MS,
  shouldContinueBannerPoll,
  shouldContinueGracePoll,
  shouldNotifyGracePeriodExpired,
  shouldNotifyOperationEnded,
} from "@/lib/operations/operation-banner-poll";
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
  const previousStatusRef = useRef<string | undefined>(undefined);

  const load = useCallback(async () => {
    if (!serverId) {
      previousStatusRef.current = undefined;
      onOperationRef.current(null);
      return null;
    }

    const response = await fetch(`/api/operations/active?serverId=${serverId}`);
    if (!response.ok) {
      const previousStatus = previousStatusRef.current;
      previousStatusRef.current = undefined;
      onOperationRef.current(null);
      if (shouldNotifyOperationEnded(previousStatus, null)) {
        notifyOperationEnded(serverId);
      }
      return null;
    }

    const data = (await response.json()) as ActiveOperation | null;
    if (!data || isOperationDismissed(data.id)) {
      const previousStatus = previousStatusRef.current;
      previousStatusRef.current = undefined;
      onOperationRef.current(null);
      if (shouldNotifyOperationEnded(previousStatus, null)) {
        notifyOperationEnded(serverId);
      }
      return null;
    }

    const parsed: ActiveOperation = {
      ...data,
      metadata: parseOperationMetadata(data.metadata),
    };

    const previousStatus = previousStatusRef.current;
    previousStatusRef.current = parsed.status;
    onOperationRef.current(parsed);

    if (shouldNotifyOperationEnded(previousStatus, parsed)) {
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
    let pollAttempt = 0;
    let graceStartedAt: number | null = null;
    let sawActiveDuringGrace = false;

    const clearTimer = () => {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    };

    const scheduleActivePoll = (delayMs: number) => {
      clearTimer();
      timer = setTimeout(async () => {
        if (!active) {
          return;
        }
        const current = await load();
        if (!active) {
          return;
        }
        if (!shouldContinueBannerPoll(current)) {
          clearTimer();
          return;
        }
        pollAttempt += 1;
        scheduleActivePoll(activeOperationPollDelayMs(pollAttempt));
      }, delayMs);
    };

    const runGracePoll = async () => {
      if (!active || graceStartedAt === null) {
        return;
      }

      const current = await load();
      if (!active) {
        return;
      }

      if (shouldContinueBannerPoll(current)) {
        sawActiveDuringGrace = true;
        graceStartedAt = null;
        pollAttempt = 0;
        scheduleActivePoll(activeOperationPollDelayMs(0));
        return;
      }

      if (current && isTerminalBannerStatus(current.status)) {
        graceStartedAt = null;
        return;
      }

      if (shouldContinueGracePoll(graceStartedAt, current)) {
        clearTimer();
        timer = setTimeout(() => {
          void runGracePoll();
        }, OPERATION_START_GRACE_POLL_MS);
        return;
      }

      const graceStart = graceStartedAt;
      graceStartedAt = null;
      if (shouldNotifyGracePeriodExpired(graceStart, current, sawActiveDuringGrace)) {
        notifyOperationEnded(serverId);
      }
    };

    const startGracePolling = () => {
      graceStartedAt = Date.now();
      sawActiveDuringGrace = false;
      pollAttempt = 0;
      clearTimer();
      void runGracePoll();
    };

    void load().then((current) => {
      if (!active) {
        return;
      }
      if (!shouldContinueBannerPoll(current)) {
        return;
      }
      scheduleActivePoll(activeOperationPollDelayMs(0));
    });

    const onStarted = (event: Event) => {
      const detail = (event as CustomEvent<{ serverId?: string }>).detail;
      if (detail?.serverId && detail.serverId !== serverId) {
        return;
      }
      startGracePolling();
    };

    window.addEventListener(OPERATION_STARTED_EVENT, onStarted);

    return () => {
      active = false;
      clearTimer();
      window.removeEventListener(OPERATION_STARTED_EVENT, onStarted);
    };
  }, [serverId, load]);
}
