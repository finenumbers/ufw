"use client";

import { useEffect, useState } from "react";

import type { UnifiedRuleRow } from "@/types/rule";
import { RulesGroupSection } from "@/components/rules/rules-group-section";
import { RulesToolbar } from "@/components/rules/rules-toolbar";
import { getRulesViewAction } from "@/server/actions/rules";

type ServerRulesPanelProps = {
  serverId: string;
  initialRows: UnifiedRuleRow[];
};

function sortRows(rows: UnifiedRuleRow[]): UnifiedRuleRow[] {
  return [...rows].sort((a, b) => a.sortOrder - b.sortOrder);
}

export function ServerRulesPanel({ serverId, initialRows }: ServerRulesPanelProps) {
  const [rows, setRows] = useState(initialRows);
  const [optionsRefreshKey, setOptionsRefreshKey] = useState(0);

  useEffect(() => {
    setRows(sortRows(initialRows));
  }, [initialRows]);

  async function refresh() {
    const next = await getRulesViewAction(serverId);
    setRows(sortRows(next));
    setOptionsRefreshKey((value) => value + 1);
  }

  return (
    <div className="space-y-4">
      <RulesToolbar
        serverId={serverId}
        rows={rows}
        onRowsChange={setRows}
        onRefresh={refresh}
      />
      <RulesGroupSection
        serverId={serverId}
        rows={rows}
        onChange={setRows}
        optionsRefreshKey={optionsRefreshKey}
      />
    </div>
  );
}
