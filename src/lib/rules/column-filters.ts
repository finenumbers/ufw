import type { UnifiedRuleRow } from "@/types/rule";

function normalizeField(value: string | null | undefined): string {
  return value?.trim() ?? "";
}

function rowMatchesNameFilter(row: UnifiedRuleRow, nameFilter: string): boolean {
  const query = nameFilter.trim().toLowerCase();
  if (!query) return true;
  return normalizeField(row.ui.name).toLowerCase().includes(query);
}

function rowMatchesGroupFilter(row: UnifiedRuleRow, groupFilter: string): boolean {
  const query = groupFilter.trim().toLowerCase();
  if (!query) return true;
  return normalizeField(row.ui.group).toLowerCase().includes(query);
}

/** Distinct non-empty groups from rows that match the active Name filter. */
export function collectDistinctGroups(rows: UnifiedRuleRow[], nameFilter: string): string[] {
  const values = new Set<string>();

  for (const row of rows) {
    if (!rowMatchesNameFilter(row, nameFilter)) continue;
    const group = normalizeField(row.ui.group);
    if (group) values.add(group);
  }

  return [...values].sort((a, b) => a.localeCompare(b));
}

/** Distinct non-empty names from rows that match the active Group filter. */
export function collectDistinctNames(rows: UnifiedRuleRow[], groupFilter: string): string[] {
  const values = new Set<string>();

  for (const row of rows) {
    if (!rowMatchesGroupFilter(row, groupFilter)) continue;
    const name = normalizeField(row.ui.name);
    if (name) values.add(name);
  }

  return [...values].sort((a, b) => a.localeCompare(b));
}

export function filterRowsByColumnHeaders(
  rows: UnifiedRuleRow[],
  groupFilter: string,
  nameFilter: string,
): UnifiedRuleRow[] {
  const hasGroup = groupFilter.trim().length > 0;
  const hasName = nameFilter.trim().length > 0;

  if (!hasGroup && !hasName) {
    return rows;
  }

  return rows.filter(
    (row) =>
      rowMatchesGroupFilter(row, groupFilter) && rowMatchesNameFilter(row, nameFilter),
  );
}
