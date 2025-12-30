/**
 * Table cell component
 *
 * Renders individual table cells with support for:
 * - Custom cell renderers
 * - Cell alignment
 * - Cell styling via CSS variables
 */

import React from "react";
import type { Column } from "../core/columns";

export interface TableCellProps<TData> {
  /** Column definition */
  column: Column<TData>;
  
  /** Data row */
  row: TData;
  
  /** Row index */
  rowIndex: number;
  
  /** Column index */
  columnIndex: number;
  
  /** Custom cell renderer */
  renderCell?: (value: unknown, row: TData, column: Column<TData>) => React.ReactNode;
  
  /** Additional className */
  className?: string;
}

/**
 * TableCell component
 * 
 * Renders a single table cell with proper alignment and styling.
 */
export function TableCell<TData>({
  column,
  row,
  rowIndex,
  columnIndex,
  renderCell,
  className = "",
}: TableCellProps<TData>) {
  const value = column.accessor(row);
  
  // Use custom renderer if provided, otherwise use default rendering
  const content = renderCell
    ? renderCell(value, row, column)
    : String(value ?? "");
  
  const align = column.align || "left";
  
  const isSticky = className.includes("table-x-cell--sticky");
  
  return (
    <td
      className={`table-x-cell table-x-cell--${align} ${className}`}
      style={{
        textAlign: align,
        width: column.width ? `${column.width}px` : undefined,
        minWidth: column.def.minWidth ? `${column.def.minWidth}px` : undefined,
        maxWidth: column.def.maxWidth ? `${column.def.maxWidth}px` : undefined,
        position: isSticky ? "sticky" : undefined,
        left: isSticky ? 0 : undefined,
        zIndex: isSticky ? 1 : undefined,
        backgroundColor: isSticky ? "var(--table-x-sticky-bg, inherit)" : undefined,
      }}
      role="gridcell"
      aria-colindex={columnIndex + 1}
    >
      {content}
    </td>
  );
}
