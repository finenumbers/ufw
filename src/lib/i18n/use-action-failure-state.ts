"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { resolveActionFailureMessage } from "@/lib/i18n/action-errors";
import type { ActionFailureResult } from "@/types/action-result";
import { isRateLimitedFailure } from "@/types/action-result";

type TranslateRateLimit = (key: "rateLimitRetry", values: { seconds: number }) => string;

export function useActionFailureState() {
  const [message, setMessageState] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const clearMessage = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = undefined;
    }
    setMessageState(null);
  }, []);

  const setMessage = useCallback((next: string | null) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = undefined;
    }
    setMessageState(next);
  }, []);

  const showFailure = useCallback(
    (result: ActionFailureResult, translate: TranslateRateLimit) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      setMessageState(resolveActionFailureMessage(result, translate));

      if (isRateLimitedFailure(result)) {
        timerRef.current = setTimeout(() => {
          setMessageState(null);
          timerRef.current = undefined;
        }, result.retryAfterSeconds * 1000);
      }
    },
    [],
  );

  useEffect(
    () => () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    },
    [],
  );

  return { message, showFailure, setMessage, clearMessage };
}
