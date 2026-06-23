"use client";

import type { UnifiedRuleRow } from "@/types/rule";
import { RulesTable } from "@/components/rules/rules-table";

type RulesGroupSectionProps = {
  serverId: string;
  rows: UnifiedRuleRow[];
  onChange: (rows: UnifiedRuleRow[]) => void;
  optionsRefreshKey?: number;
};

export function RulesGroupSection({
  serverId,
  rows,
  onChange,
  optionsRefreshKey,
}: RulesGroupSectionProps) {
  return (
    <RulesTable
      serverId={serverId}
      rows={rows}
      onChange={onChange}
      optionsRefreshKey={optionsRefreshKey}
    />
  );
}
