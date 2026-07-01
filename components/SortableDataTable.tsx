"use client";

import { useMemo, useState } from "react";
import {
  type ColumnDef,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

type Align = "left" | "right";

export type SortableColumn<T> = {
  key: string;
  header: string;
  align?: Align;
  render: (row: T) => React.ReactNode;
  sortValue?: (row: T) => string | number | null | undefined;
};

export function SortableDataTable<T>({
  columns,
  rows,
  defaultSortKey
}: {
  columns: Array<SortableColumn<T>>;
  rows: T[];
  defaultSortKey?: string;
}) {
  const [sorting, setSorting] = useState<SortingState>(defaultSortKey ? [{ id: defaultSortKey, desc: false }] : []);

  const tableColumns = useMemo<Array<ColumnDef<T>>>(
    () =>
      columns.map((column) => ({
        id: column.key,
        accessorFn: (row) => {
          if (column.sortValue) return column.sortValue(row);
          const raw = row as Record<string, unknown>;
          return raw[column.key] as string | number | null | undefined;
        },
        header: ({ column: tableColumn }) => (
          <button
            type="button"
            onClick={tableColumn.getToggleSortingHandler()}
            className={cn(
              "inline-flex items-center gap-1 whitespace-nowrap transition hover:text-terminal-text",
              column.align === "right" && "ml-auto"
            )}
          >
            {column.header}
            {tableColumn.getIsSorted() === "asc" ? (
              <ArrowUp className="h-3.5 w-3.5" />
            ) : tableColumn.getIsSorted() === "desc" ? (
              <ArrowDown className="h-3.5 w-3.5" />
            ) : (
              <ArrowUpDown className="h-3.5 w-3.5 opacity-60" />
            )}
          </button>
        ),
        cell: ({ row }) => column.render(row.original)
      })),
    [columns]
  );

  const table = useReactTable({
    data: rows,
    columns: tableColumns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel()
  });

  return (
    <div className="terminal-scrollbar w-full min-w-0 max-w-full overflow-x-auto rounded-lg border border-white/[0.08] bg-white/[0.015]">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className="border-b border-white/[0.08] bg-white/[0.03] text-xs text-terminal-muted">
              {headerGroup.headers.map((header, index) => {
                const column = columns[index];
                return (
                  <th
                    key={header.id}
                    className={cn("px-3 py-2.5 font-semibold", column?.align === "right" ? "text-right" : "text-left")}
                  >
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="border-b border-white/[0.06] last:border-0 hover:bg-white/[0.035]">
              {row.getVisibleCells().map((cell, index) => {
                const column = columns[index];
                return (
                  <td
                    key={cell.id}
                    className={cn("px-3 py-3 align-top", column?.align === "right" ? "text-right" : "text-left")}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}