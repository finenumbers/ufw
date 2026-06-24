"use client";

import { useEffect, useRef } from "react";

export function useInfiniteScroll(
  loadMore: () => void | Promise<void>,
  enabled: boolean,
  loading: boolean,
) {
  const sentinelRef = useRef<HTMLTableRowElement | null>(null);

  useEffect(() => {
    if (!enabled || loading) {
      return;
    }

    const element = sentinelRef.current;
    if (!element) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          void loadMore();
        }
      },
      { rootMargin: "240px" },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [enabled, loading, loadMore]);

  return sentinelRef;
}
