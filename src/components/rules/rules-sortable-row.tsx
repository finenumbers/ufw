"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { flexRender, type Row } from "@tanstack/react-table";
import { GripVertical } from "lucide-react";

import { cn } from "@/lib/utils";
import { getRulesTableColumnClass } from "@/lib/rules/table-column-layout";
import type { UnifiedRuleRow } from "@/types/rule";

type SortableRuleRowProps = {
  row: Row<UnifiedRuleRow>;
  rowClassName: string;
  dragDisabled?: boolean;
  showHandle?: boolean;
};

export function SortableRuleRow({
  row,
  rowClassName,
  dragDisabled = false,
  showHandle = true,
}: SortableRuleRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: row.original.clientRowId,
    disabled: dragDisabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={cn(
        "border-t",
        rowClassName,
        isDragging && "relative z-10 opacity-60 shadow-sm",
      )}
    >
      {showHandle ? (
        <td className="w-6 bg-transparent px-1 py-0.5 align-middle">
          {!dragDisabled ? (
            <button
              ref={setActivatorNodeRef}
              type="button"
              className="flex h-6 w-6 cursor-grab items-center justify-center rounded text-muted-foreground hover:bg-black/5 active:cursor-grabbing"
              aria-label="Переместить правило"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </td>
      ) : null}
      {row.getVisibleCells().map((cell) => (
        <td
          key={cell.id}
          className={cn(
            "bg-transparent px-2 py-0.5 align-middle",
            getRulesTableColumnClass(cell.column.id),
          )}
        >
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </td>
      ))}
    </tr>
  );
}
