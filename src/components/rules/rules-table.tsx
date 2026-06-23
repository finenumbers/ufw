"use client";

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { useEffect, useMemo, useRef, useState } from "react";
import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Input } from "@/components/ui/input";
import { RulesColumnHeaderFilter } from "@/components/rules/rules-column-header-filter";
import { SortableRuleRow } from "@/components/rules/rules-sortable-row";
import { cn } from "@/lib/utils";
import {
  collectDistinctGroups,
  collectDistinctNames,
  filterRowsByColumnHeaders,
} from "@/lib/rules/column-filters";
import type { RuleCore, UnifiedRuleRow } from "@/types/rule";
import { syncIpv6FlagWithAddresses } from "@/lib/ufw/commands";
import { getInterfaceOptionsAction, getTagValuesAction } from "@/server/actions/rules";

const tableFontClass = "text-[10px] leading-tight";

const tableInputClassName = `${tableFontClass} h-6 min-h-6 px-1.5 py-0`;

const selectClassName =
  `flex h-6 min-h-6 w-full min-w-[4.5rem] rounded-md border border-input bg-transparent px-1.5 py-0 ${tableFontClass} ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring`;

function getRuleRowClassName(row: UnifiedRuleRow): string {
  if (row.isPendingSave) {
    return "";
  }

  switch (row.originState) {
    case "REMOTE_ONLY":
      return "bg-yellow-100 hover:bg-yellow-100/90";
    case "MATCHED":
      return "bg-green-100 hover:bg-green-100/90";
    case "LOCAL_ONLY":
    case "DRAFT_ONLY":
      return "bg-red-100 hover:bg-red-100/90";
    case "CONFLICT":
      return "bg-orange-100 hover:bg-orange-100/90";
    default:
      return "";
  }
}

type RulesTableProps = {
  serverId: string;
  rows: UnifiedRuleRow[];
  onChange: (rows: UnifiedRuleRow[]) => void;
  readOnly?: boolean;
  optionsRefreshKey?: number;
};

function updateRow(
  rows: UnifiedRuleRow[],
  clientRowId: string,
  updater: (row: UnifiedRuleRow) => UnifiedRuleRow,
): UnifiedRuleRow[] {
  return rows.map((item) => (item.clientRowId === clientRowId ? updater(item) : item));
}

function updateCore(
  rows: UnifiedRuleRow[],
  clientRowId: string,
  patch: Partial<RuleCore>,
): UnifiedRuleRow[] {
  return updateRow(rows, clientRowId, (item) => ({
    ...item,
    fingerprint: "",
    core: syncIpv6FlagWithAddresses({ ...item.core, ...patch }),
  }));
}

function updateUi(
  rows: UnifiedRuleRow[],
  clientRowId: string,
  patch: Partial<UnifiedRuleRow["ui"]>,
): UnifiedRuleRow[] {
  return updateRow(rows, clientRowId, (item) => ({
    ...item,
    ui: { ...item.ui, ...patch },
  }));
}

function emptyToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function reorderRows(
  rows: UnifiedRuleRow[],
  activeId: string,
  overId: string,
): UnifiedRuleRow[] {
  const oldIndex = rows.findIndex((row) => row.clientRowId === activeId);
  const newIndex = rows.findIndex((row) => row.clientRowId === overId);
  if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) {
    return rows;
  }

  return arrayMove(rows, oldIndex, newIndex).map((row, index) => ({
    ...row,
    sortOrder: index,
  }));
}

function deleteRow(rows: UnifiedRuleRow[], clientRowId: string): UnifiedRuleRow[] {
  return rows
    .filter((row) => row.clientRowId !== clientRowId)
    .map((row, index) => ({
      ...row,
      sortOrder: index,
    }));
}

export function RulesTable({
  serverId,
  rows,
  onChange,
  readOnly = false,
  optionsRefreshKey = 0,
}: RulesTableProps) {
  const t = useTranslations("rules.table");
  const [globalFilter, setGlobalFilter] = useState("");
  const [groupHeaderFilter, setGroupHeaderFilter] = useState("");
  const [nameHeaderFilter, setNameHeaderFilter] = useState("");
  const [groups, setGroups] = useState<string[]>([]);
  const [names, setNames] = useState<string[]>([]);
  const [interfaces, setInterfaces] = useState<string[]>([]);

  const rowsRef = useRef(rows);
  rowsRef.current = rows;

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const dragDisabled =
    readOnly ||
    globalFilter.length > 0 ||
    groupHeaderFilter.trim().length > 0 ||
    nameHeaderFilter.trim().length > 0;
  const showDragHandle = !readOnly;

  const groupFilterOptions = useMemo(
    () => collectDistinctGroups(rows, nameHeaderFilter),
    [nameHeaderFilter, rows],
  );

  const nameFilterOptions = useMemo(
    () => collectDistinctNames(rows, groupHeaderFilter),
    [groupHeaderFilter, rows],
  );

  const columnFilteredRows = useMemo(
    () => filterRowsByColumnHeaders(rows, groupHeaderFilter, nameHeaderFilter),
    [groupHeaderFilter, nameHeaderFilter, rows],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    onChange(reorderRows(rows, String(active.id), String(over.id)));
  }

  useEffect(() => {
    async function loadOptions() {
      const [groupTags, nameTags, interfaceOptions] = await Promise.all([
        getTagValuesAction(serverId, "GROUP"),
        getTagValuesAction(serverId, "NAME"),
        getInterfaceOptionsAction(serverId),
      ]);
      setGroups(groupTags.map((tag) => tag.value));
      setNames(nameTags.map((tag) => tag.value));
      setInterfaces(interfaceOptions);
    }
    void loadOptions();
  }, [serverId, optionsRefreshKey]);

  const interfaceOptions = useMemo(() => {
    const options = new Set(interfaces);
    for (const row of rows) {
      if (row.core.interface) {
        options.add(row.core.interface);
      }
    }
    return [...options].sort((a, b) => a.localeCompare(b));
  }, [interfaces, rows]);

  const interfaceOptionsRef = useRef(interfaceOptions);
  interfaceOptionsRef.current = interfaceOptions;

  const columns = useMemo<ColumnDef<UnifiedRuleRow>[]>(
    () => [
      {
        id: "group",
        accessorFn: (row) => row.ui.group || "Ungrouped",
        header: () => null,
        cell: ({ row }) =>
          readOnly ? (
            row.original.ui.group || "—"
          ) : (
            <>
              <Input
                className={tableInputClassName}
                list={`groups-${serverId}`}
                value={row.original.ui.group ?? ""}
                onChange={(e) =>
                  onChangeRef.current(
                    updateUi(rowsRef.current, row.original.clientRowId, { group: e.target.value }),
                  )
                }
              />
            </>
          ),
      },
      {
        id: "name",
        accessorFn: (row) => row.ui.name ?? "",
        header: () => null,
        cell: ({ row }) =>
          readOnly ? (
            row.original.ui.name || "—"
          ) : (
            <>
              <Input
                className={tableInputClassName}
                list={`names-${serverId}`}
                value={row.original.ui.name ?? ""}
                onChange={(e) =>
                  onChangeRef.current(
                    updateUi(rowsRef.current, row.original.clientRowId, { name: e.target.value }),
                  )
                }
              />
            </>
          ),
      },
      {
        id: "action",
        header: "Action",
        cell: ({ row }) =>
          readOnly ? (
            row.original.core.action
          ) : (
            <select
              className={selectClassName}
              value={row.original.core.action}
              onChange={(e) =>
                onChangeRef.current(
                  updateCore(rowsRef.current, row.original.clientRowId, {
                    action: e.target.value as RuleCore["action"],
                  }),
                )
              }
            >
              <option value="ALLOW">ALLOW</option>
              <option value="DENY">DENY</option>
              <option value="REJECT">REJECT</option>
              <option value="LIMIT">LIMIT</option>
            </select>
          ),
      },
      {
        id: "direction",
        header: "Direction",
        cell: ({ row }) =>
          readOnly ? (
            row.original.core.direction ?? "IN"
          ) : (
            <select
              className={selectClassName}
              value={row.original.core.direction ?? "IN"}
              onChange={(e) =>
                onChangeRef.current(
                  updateCore(rowsRef.current, row.original.clientRowId, {
                    direction: e.target.value as RuleCore["direction"],
                  }),
                )
              }
            >
              <option value="IN">IN</option>
              <option value="OUT">OUT</option>
              <option value="ROUTE">ROUTE</option>
            </select>
          ),
      },
      {
        id: "interface",
        header: "Interface",
        cell: ({ row }) =>
          readOnly ? (
            row.original.core.interface || "—"
          ) : (
            <select
              className={selectClassName}
              value={row.original.core.interface ?? ""}
              onChange={(e) =>
                onChangeRef.current(
                  updateCore(rowsRef.current, row.original.clientRowId, {
                    interface: emptyToNull(e.target.value),
                  }),
                )
              }
            >
              <option value="">—</option>
              {interfaceOptionsRef.current.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          ),
      },
      {
        id: "fromAddress",
        header: "From",
        cell: ({ row }) =>
          readOnly ? (
            row.original.core.fromAddress ?? "any"
          ) : (
            <Input
              className={tableInputClassName}
              value={row.original.core.fromAddress ?? ""}
              placeholder="any"
              onChange={(e) =>
                onChangeRef.current(
                  updateCore(rowsRef.current, row.original.clientRowId, {
                    fromAddress: emptyToNull(e.target.value) ?? "any",
                  }),
                )
              }
            />
          ),
      },
      {
        id: "fromPort",
        header: "From Port",
        cell: ({ row }) =>
          readOnly ? (
            row.original.core.fromPort || "—"
          ) : (
            <Input
              className={tableInputClassName}
              value={row.original.core.fromPort ?? ""}
              onChange={(e) =>
                onChangeRef.current(
                  updateCore(rowsRef.current, row.original.clientRowId, {
                    fromPort: emptyToNull(e.target.value),
                  }),
                )
              }
            />
          ),
      },
      {
        id: "toAddress",
        header: "To",
        cell: ({ row }) =>
          readOnly ? (
            row.original.core.toAddress ?? "any"
          ) : (
            <Input
              className={tableInputClassName}
              value={row.original.core.toAddress ?? ""}
              placeholder="any"
              onChange={(e) =>
                onChangeRef.current(
                  updateCore(rowsRef.current, row.original.clientRowId, {
                    toAddress: emptyToNull(e.target.value) ?? "any",
                  }),
                )
              }
            />
          ),
      },
      {
        id: "toPort",
        header: "To Port",
        cell: ({ row }) =>
          readOnly ? (
            row.original.core.toPort || "—"
          ) : (
            <Input
              className={tableInputClassName}
              value={row.original.core.toPort ?? ""}
              onChange={(e) =>
                onChangeRef.current(
                  updateCore(rowsRef.current, row.original.clientRowId, {
                    toPort: emptyToNull(e.target.value),
                  }),
                )
              }
            />
          ),
      },
      {
        id: "protocol",
        header: "Protocol",
        cell: ({ row }) =>
          readOnly ? (
            row.original.core.protocol ?? "—"
          ) : (
            <select
              className={selectClassName}
              value={row.original.core.protocol ?? ""}
              onChange={(e) =>
                onChangeRef.current(
                  updateCore(rowsRef.current, row.original.clientRowId, {
                    protocol: emptyToNull(e.target.value) as RuleCore["protocol"],
                  }),
                )
              }
            >
              <option value="">—</option>
              <option value="TCP">TCP</option>
              <option value="UDP">UDP</option>
              <option value="ICMP">ICMP</option>
              <option value="ANY">ANY</option>
            </select>
          ),
      },
      {
        id: "logMode",
        header: "Log",
        cell: ({ row }) =>
          readOnly ? (
            row.original.core.logMode
          ) : (
            <select
              className={selectClassName}
              value={row.original.core.logMode}
              onChange={(e) =>
                onChangeRef.current(
                  updateCore(rowsRef.current, row.original.clientRowId, {
                    logMode: e.target.value as RuleCore["logMode"],
                  }),
                )
              }
            >
              <option value="NONE">NONE</option>
              <option value="LOG">LOG</option>
              <option value="LOG_ALL">LOG_ALL</option>
            </select>
          ),
      },
      {
        id: "ipv6",
        header: "IPv6",
        cell: ({ row }) =>
          readOnly ? (
            row.original.core.ipv6 ? "yes" : "no"
          ) : (
            <select
              className={cn(selectClassName, "min-w-[4.5rem]")}
              value={row.original.core.ipv6 ? "true" : "false"}
              onChange={(e) =>
                onChangeRef.current(
                  updateCore(rowsRef.current, row.original.clientRowId, {
                    ipv6: e.target.value === "true",
                  }),
                )
              }
            >
              <option value="false">no</option>
              <option value="true">yes</option>
            </select>
          ),
      },
      {
        id: "delete",
        header: "",
        cell: ({ row }) =>
          readOnly ? null : (
            <button
              type="button"
              className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              aria-label={t("deleteRule")}
              onClick={() =>
                onChangeRef.current(deleteRow(rowsRef.current, row.original.clientRowId))
              }
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          ),
      },
    ],
    [readOnly, serverId, t],
  );

  const table = useReactTable({
    data: columnFilteredRows,
    columns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: (row, _columnId, filterValue) => {
      const search = String(filterValue).toLowerCase();
      const item = row.original;
      return [
        item.ui.group,
        item.ui.name,
        item.core.action,
        item.core.direction,
        item.core.interface,
        item.core.fromAddress,
        item.core.fromPort,
        item.core.toAddress,
        item.core.toPort,
        item.core.protocol,
        item.core.logMode,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(search));
    },
  });

  return (
    <div className="space-y-4">
      {!readOnly ? (
        <>
          <datalist id={`groups-${serverId}`}>
            {groups.map((value) => (
              <option key={value} value={value} />
            ))}
          </datalist>
          <datalist id={`names-${serverId}`}>
            {names.map((value) => (
              <option key={value} value={value} />
            ))}
          </datalist>
        </>
      ) : null}
      <Input
        placeholder={t("searchPlaceholder")}
        value={globalFilter}
        onChange={(e) => setGlobalFilter(e.target.value)}
        className="max-w-sm"
      />
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-2">
          <span className="h-3 w-8 rounded border bg-yellow-100" />
          {t("legendRemoteOnly")}
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-3 w-8 rounded border bg-green-100" />
          {t("legendMatched")}
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-3 w-8 rounded border bg-red-100" />
          {t("legendLocalOnly")}
        </span>
        <span className="text-muted-foreground/80">
          {t("legendPendingNoHighlight")}
        </span>
        {showDragHandle && dragDisabled ? (
          <span className="text-muted-foreground/80">
            {t("clearFiltersToReorder")}
          </span>
        ) : null}
      </div>
      <div className="overflow-x-auto rounded-md border">
        <table className={cn("w-full min-w-[1200px]", tableFontClass)}>
          <thead className="bg-muted/50">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {showDragHandle ? (
                  <th
                    className="w-6 px-1 py-1 text-left font-medium"
                    aria-label={t("orderColumn")}
                  />
                ) : null}
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="whitespace-nowrap px-2 py-1 text-left font-medium align-top">
                    {header.column.id === "group" ? (
                      <RulesColumnHeaderFilter
                        label="Group"
                        value={groupHeaderFilter}
                        options={groupFilterOptions}
                        onChange={setGroupHeaderFilter}
                        allLabel={t("filterAll")}
                        noMatchesLabel={t("filterNoMatches")}
                        filterAria={t("filterColumn", { label: "Group" })}
                        clearFilterAria={t("filterClear", { label: "Group" })}
                        showOptionsAria={t("filterShowOptions", { label: "Group" })}
                        optionsAria={t("filterOptions", { label: "Group" })}
                      />
                    ) : header.column.id === "name" ? (
                      <RulesColumnHeaderFilter
                        label="Name"
                        value={nameHeaderFilter}
                        options={nameFilterOptions}
                        onChange={setNameHeaderFilter}
                        allLabel={t("filterAll")}
                        noMatchesLabel={t("filterNoMatches")}
                        filterAria={t("filterColumn", { label: "Name" })}
                        clearFilterAria={t("filterClear", { label: "Name" })}
                        showOptionsAria={t("filterShowOptions", { label: "Name" })}
                        optionsAria={t("filterOptions", { label: "Name" })}
                      />
                    ) : header.isPlaceholder ? null : (
                      flexRender(header.column.columnDef.header, header.getContext())
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (showDragHandle ? 1 : 0)}
                  className="px-3 py-6 text-center text-muted-foreground"
                >
                  {t("noRulesFound")}
                </td>
              </tr>
            ) : readOnly ? (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className={cn("border-t", getRuleRowClassName(row.original))}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="bg-transparent px-2 py-0.5 align-middle">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={table.getRowModel().rows.map((row) => row.original.clientRowId)}
                  strategy={verticalListSortingStrategy}
                >
                  {table.getRowModel().rows.map((row) => (
                    <SortableRuleRow
                      key={row.original.clientRowId}
                      row={row}
                      rowClassName={getRuleRowClassName(row.original)}
                      dragDisabled={dragDisabled}
                      showHandle={showDragHandle}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
