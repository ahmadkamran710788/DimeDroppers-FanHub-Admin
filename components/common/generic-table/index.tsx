"use client";

import { cn } from "@/utils/cn";
import { type ReactNode } from "react";

export interface Column<T> {
  header: string;
  /** Width / alignment utilities, applied to the header cell AND every body cell so they line up. */
  cls?: string;
  cell: (row: T) => ReactNode;
}

interface GenericTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  getKey: (row: T, index: number) => string;
  /** Message shown when there are no rows. */
  empty: string;
  /** When true, replaces the body with a centered spinner. */
  loading?: boolean;
  /** Extra utilities for every header cell (e.g. a different fill). */
  headerCellClassName?: string;
  /** Extra utilities for every body cell (e.g. a different fill or padding). */
  cellClassName?: string;
  /** Makes rows clickable (e.g. to open a details page). */
  onRowClick?: (row: T) => void;
  className?: string;
}

/**
 * Dark, flexbox-based data table. Column widths are declared once on each `Column`
 * and shared by the header and body cells, so the two can't drift apart.
 */
export default function GenericTable<T>({
  columns,
  rows,
  getKey,
  empty,
  loading = false,
  headerCellClassName,
  cellClassName,
  onRowClick,
  className,
}: GenericTableProps<T>) {
  return (
    <div className={cn("overflow-x-auto", className)}>
      {/* Header */}
      <div className="flex items-center border-b border-white/20">
        {columns.map((col) => (
          <div
            key={col.header}
            className={cn("h-10 px-2 bg-white/10 flex items-center gap-1", headerCellClassName, col.cls)}
          >
            <span className="text-white text-xs font-semibold uppercase leading-4">
              {col.header}
            </span>
          </div>
        ))}
      </div>

      {/* Body */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <span className="w-6 h-6 rounded-full border-2 border-white/20 border-t-white/60 animate-spin" />
        </div>
      ) : rows.length === 0 ? (
        <div className="flex justify-center items-center py-12 text-white/40 text-sm">
          {empty}
        </div>
      ) : (
        rows.map((row, index) => (
          <div
            key={getKey(row, index)}
            onClick={onRowClick ? () => onRowClick(row) : undefined}
            className={cn("flex items-stretch border-b border-white/20", onRowClick && "cursor-pointer hover:bg-white/[0.04]")}
          >
            {columns.map((col) => {
              const content = col.cell(row);
              return (
                <div
                  key={col.header}
                  className={cn(
                    "px-2 py-3 bg-white/5 flex items-center overflow-hidden text-white text-xs font-medium leading-4",
                    cellClassName,
                    col.cls
                  )}
                >
                  {typeof content === "string" || typeof content === "number" ? (
                    <span className="truncate">{content}</span>
                  ) : (
                    content
                  )}
                </div>
              );
            })}
          </div>
        ))
      )}
    </div>
  );
}
