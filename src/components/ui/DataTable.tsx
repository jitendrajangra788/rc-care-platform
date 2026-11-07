"use client";

import { useMemo, useState } from "react";
import { flexRender, type RowData } from "@tanstack/react-table";
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useLegacyTable,
  type LegacyColumnDef,
} from "@tanstack/react-table/legacy";
import type {
  RowSelectionState,
  SortingState,
} from "@tanstack/table-core";
import { ArrowDown, ArrowUp, ArrowUpDown, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./Button";
import { EmptyState } from "./EmptyState";
import { SearchInput } from "./SearchInput";

function exportCsv<T extends RowData>(
  rows: T[],
  columns: LegacyColumnDef<T, unknown>[],
  filename: string,
) {
  const headers = columns
    .map((c) => {
      const id = c.id || ("accessorKey" in c ? String(c.accessorKey) : "");
      const header = typeof c.header === "string" ? c.header : id;
      return header;
    })
    .filter(Boolean);

  const lines = [
    headers.join(","),
    ...rows.map((row) =>
      columns
        .map((c) => {
          const key = ("accessorKey" in c ? c.accessorKey : c.id) as
            | keyof T
            | undefined;
          if (!key) return "";
          const val = row[key as keyof T];
          const s = val == null ? "" : String(val);
          return `"${s.replace(/"/g, '""')}"`;
        })
        .join(","),
    ),
  ];

  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export type DataTableColumn<T extends RowData> = LegacyColumnDef<T, unknown>;

function cellStickyClass(columnId: string, isHeader: boolean) {
  if (columnId === "select") {
    return cn(
      "sticky left-0 z-20 w-10 min-w-10 max-w-10",
      isHeader ? "bg-[var(--surface-muted)]" : "bg-surface",
    );
  }
  if (columnId === "actions") {
    return cn(
      "sticky right-0 z-20 shadow-[-6px_0_8px_-6px_rgba(15,23,42,0.12)]",
      isHeader ? "bg-[var(--surface-muted)]" : "bg-surface",
    );
  }
  return undefined;
}

export function DataTable<T extends RowData>({
  data,
  columns,
  searchPlaceholder = "Filter rows…",
  emptyTitle = "No records",
  emptyDescription = "Nothing to show yet.",
  exportFilename = "export.csv",
  pageSize = 10,
  getRowId,
  className,
  toolbar,
  enableSelection = true,
  renderMobileCard,
}: {
  data: T[];
  columns: DataTableColumn<T>[];
  searchPlaceholder?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  exportFilename?: string;
  pageSize?: number;
  getRowId?: (row: T) => string;
  className?: string;
  toolbar?: React.ReactNode;
  enableSelection?: boolean;
  /** Custom mobile card. If omitted, a readable stacked card is generated. */
  renderMobileCard?: (row: T) => React.ReactNode;
}) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const selectColumn = useMemo<DataTableColumn<T>>(
    () => ({
      id: "select",
      header: ({ table }) => (
        <input
          type="checkbox"
          aria-label="Select all rows"
          checked={table.getIsAllPageRowsSelected()}
          onChange={table.getToggleAllPageRowsSelectedHandler()}
          className="h-4 w-4 rounded border-[var(--line)] accent-[var(--primary)] focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          aria-label="Select row"
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
          className="h-4 w-4 rounded border-[var(--line)] accent-[var(--primary)] focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
        />
      ),
      enableSorting: false,
      size: 40,
    }),
    [],
  );

  const tableColumns = useMemo(
    () => (enableSelection ? [selectColumn, ...columns] : columns),
    [selectColumn, columns, enableSelection],
  );

  const table = useLegacyTable({
    data,
    columns: tableColumns,
    state: { sorting, globalFilter, rowSelection },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getRowId: getRowId ? (row: T) => getRowId(row) : undefined,
    initialState: { pagination: { pageIndex: 0, pageSize } },
    enableRowSelection: enableSelection,
  });

  const selectedCount = Object.keys(rowSelection).length;
  const rows = table.getFilteredRowModel().rows.map((r) => r.original);

  const pageRows = table.getRowModel().rows;

  return (
    <div className={cn("min-w-0 space-y-1.5", className)}>
      <div className="flex flex-col gap-2">
        <SearchInput
          value={globalFilter}
          onChange={setGlobalFilter}
          placeholder={searchPlaceholder}
          className="w-full max-w-none md:max-w-sm"
        />
        <div className="flex flex-wrap items-center gap-1.5">
          {toolbar}
          {selectedCount > 0 ? (
            <span className="text-xs font-semibold text-muted">
              {selectedCount} selected
            </span>
          ) : null}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="ml-auto"
            onClick={() => exportCsv(rows, columns, exportFilename)}
            aria-label="Export CSV"
          >
            <Download className="h-3.5 w-3.5" />
            Export
          </Button>
        </div>
      </div>

      {/* Mobile card list — avoids crushed sticky table columns */}
      <div className="space-y-2 md:hidden">
        {pageRows.length === 0 ? (
          <EmptyState title={emptyTitle} description={emptyDescription} />
        ) : (
          pageRows.map((row) => (
            <article
              key={row.id}
              className="soft-panel space-y-2.5 rounded-[var(--radius-xl)] p-3"
              data-state={row.getIsSelected() ? "selected" : undefined}
            >
              {enableSelection ? (
                <label className="flex items-center gap-2 text-xs font-semibold text-muted">
                  <input
                    type="checkbox"
                    aria-label="Select row"
                    checked={row.getIsSelected()}
                    onChange={row.getToggleSelectedHandler()}
                    className="h-4 w-4 rounded border-[var(--line)] accent-[var(--primary)]"
                  />
                  Select
                </label>
              ) : null}
              {renderMobileCard ? (
                renderMobileCard(row.original)
              ) : (
                <div className="space-y-2">
                  {row
                    .getVisibleCells()
                    .filter((cell) => cell.column.id !== "select")
                    .map((cell) => {
                      const header = cell.column.columnDef.header;
                      const label =
                        typeof header === "string"
                          ? header
                          : cell.column.id === "actions"
                            ? "Actions"
                            : cell.column.id;
                      return (
                        <div
                          key={cell.id}
                          className={cn(
                            "min-w-0",
                            cell.column.id === "actions"
                              ? "border-t border-[var(--line)] pt-2"
                              : "grid grid-cols-[5.5rem_1fr] items-start gap-2",
                          )}
                        >
                          {cell.column.id !== "actions" ? (
                            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                              {label}
                            </span>
                          ) : null}
                          <div
                            className={cn(
                              "min-w-0 break-words text-sm text-heading",
                              cell.column.id === "actions" &&
                                "flex flex-wrap gap-1.5",
                            )}
                          >
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext(),
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </article>
          ))
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden w-full min-w-0 overflow-x-auto overscroll-x-contain rounded-[var(--radius-md)] border border-[var(--line)] bg-surface md:block">
        <table className="data-table w-full min-w-[36rem] border-separate border-spacing-0 text-left text-sm">
          <thead className="bg-[var(--surface-muted)] text-xs uppercase tracking-wide text-muted">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const sorted = header.column.getIsSorted();
                  const sticky = cellStickyClass(header.column.id, true);
                  return (
                    <th
                      key={header.id}
                      className={cn("font-semibold", sticky)}
                    >
                      {header.isPlaceholder ? null : canSort ? (
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                          {sorted === "asc" ? (
                            <ArrowUp className="h-3 w-3" />
                          ) : sorted === "desc" ? (
                            <ArrowDown className="h-3 w-3" />
                          ) : (
                            <ArrowUpDown className="h-3 w-3 opacity-40" />
                          )}
                        </button>
                      ) : (
                        flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr>
                <td colSpan={tableColumns.length} className="p-4">
                  <EmptyState title={emptyTitle} description={emptyDescription} />
                </td>
              </tr>
            ) : (
              pageRows.map((row) => (
                <tr
                  key={row.id}
                  className="group border-t border-[var(--line)] hover:bg-[var(--surface-muted)]/60"
                  data-state={row.getIsSelected() ? "selected" : undefined}
                >
                  {row.getVisibleCells().map((cell) => {
                    const sticky = cellStickyClass(cell.column.id, false);
                    return (
                      <td
                        key={cell.id}
                        className={cn(
                          "text-heading group-hover:bg-[var(--surface-muted)]",
                          sticky,
                        )}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted">
        <span>
          Page {table.getState().pagination.pageIndex + 1} of{" "}
          {table.getPageCount() || 1}
        </span>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={!table.getCanPreviousPage()}
            onClick={() => table.previousPage()}
          >
            Previous
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={!table.getCanNextPage()}
            onClick={() => table.nextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
