"use client";

import { useTranslations } from "next-intl";

import { useServerBlockCheck } from "@/components/layout/block-check-provider";
import { Badge } from "@/components/ui/badge";
import { buildDetailUrl } from "@/lib/block-check/probe-stream";
import { cn } from "@/lib/utils";

export function ServerBlockBadge({
  serverId,
  host,
  className,
}: {
  serverId: string;
  host: string;
  className?: string;
}) {
  const t = useTranslations("servers.blockCheck");
  const status = useServerBlockCheck(serverId);

  if (status !== "unrestricted" && status !== "blocked") {
    return null;
  }

  const label = status === "unrestricted" ? t("unrestricted") : t("blocked");

  return (
    <a
      href={buildDetailUrl(host)}
      target="_blank"
      rel="noopener noreferrer"
      className={cn("shrink-0", className)}
      aria-label={label}
      onClick={(event) => event.stopPropagation()}
    >
      <Badge variant={status === "unrestricted" ? "reachable" : "unreachable"} className="cursor-pointer">
        {label}
      </Badge>
    </a>
  );
}
