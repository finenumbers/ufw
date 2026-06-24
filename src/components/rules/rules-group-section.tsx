"use client";

import type { UnifiedRuleRow } from "@/types/rule";
import { RulesTable } from "@/components/rules/rules-table";

type RulesGroupSectionProps = {
  serverId: string;
  rows: UnifiedRuleRow[];
  onChange: (rows: UnifiedRuleRow[]) => void;
  optionsRefreshKey?: number;
  total?: number;
  hasMore?: boolean;
  loadingMore?: boolean;
  onLoadMore?: () => void | Promise<void>;
};

export function RulesGroupSection({
  serverId,
  rows,
  onChange,
  optionsRefreshKey,
  total,
  hasMore,
  loadingMore,
  onLoadMore,
}: RulesGroupSectionProps) {
  return (
    <RulesTable
      serverId={serverId}
      rows={rows}
      onChange={onChange}
      optionsRefreshKey={optionsRefreshKey}
      total={total}
      hasMore={hasMore}
      loadingMore={loadingMore}
      onLoadMore={onLoadMore}
    />
  );
}
