/**
 * Main DataTable component
 *
 * Renders a complete data table with:
 * - Header and body
 * - Sticky header and first column
 * - Column resizing
 * - Custom renderers
 * - Loading/empty/error states via slots
 */

import React, { useCallback, useState } from "react";
import type { TableInstance } from "../react/useDataTable";
import { TableHeader } from "./TableHeader";
import { TableBody } from "./TableBody";

export interface DataTableSlots<TData> {
  /** Loading state component */
  loader?: React.ComponentType;
  
  /** Empty state component */
  empty?: React.ComponentType<{ columns: import("../core/columns").Column<TData>[] }>;
  
  /** Error state component */
  error?: React.ComponentType<{ error: Error | string }>;
}

export interface DataTableProps<TData> {
  /** Table instance from useDataTable hook */
  table: TableInstance<TData>;
  
  /** Custom slots for loading/empty/error states */
  slots?: DataTableSlots<TData>;
  
  /** Custom cell renderer */
  renderCell?: (value: unknown, row: TData, column: import("../core/columns").Column<TData>) => React.ReactNode;
  
  /** Custom header renderer */
  renderHeader?: (
    column: import("../core/columns").Column<TData>,
    sortState: import("../core/sorting").SortState
  ) => React.ReactNode;
  
  /** Custom row renderer */
  renderRow?: (
    row: TData,
    index: number,
    cells: React.ReactNode[]
  ) => React.ReactNode;
  
  /** Row key extractor */
  getRowKey?: (row: TData, index: number) => string | number;
  
  /** Whether header is sticky */
  stickyHeader?: boolean;
  
  /** Whether first column is sticky */
  stickyFirstColumn?: boolean;
  
  /** Enable column resizing */
  enableResizing?: boolean;
  
  /** Maximum height for vertical scrolling (in pixels) */
  maxHeight?: number | string;
  
  /** Whether to show borders (default: true) */
  bordered?: boolean;
  
  /** Additional className */
  className?: string;
  
  /** Loading state */
  isLoading?: boolean;
  
  /** Error state */
  error?: Error | string | null;
}

/**
 * DataTable component
 * 
 * Main table component that renders a complete data table with all features.
 * 
 * @example
 * ```tsx
 * const table = useDataTable({ data, columns });
 * 
 * <DataTable
 *   table={table}
 *   stickyHeader
 *   stickyFirstColumn
 *   enableResizing
 *   maxHeight={400}
 *   bordered
 *   slots={{
 *     loader: () => <div>Loading...</div>,
 *     empty: () => <div>No data</div>,
 *   }}
 * />
 * ```
 */
export function DataTable<TData>({
  table,
  slots = {},
  renderCell,
  renderHeader,
  renderRow,
  getRowKey,
  stickyHeader = false,
  stickyFirstColumn = false,
  enableResizing = false,
  maxHeight,
  bordered = true,
  className = "",
  isLoading = false,
  error = null,
}: DataTableProps<TData>) {
  // Track column widths for resizing
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});

  const handleResize = useCallback(
    (columnId: string, width: number) => {
      setColumnWidths((prev) => ({
        ...prev,
        [columnId]: width,
      }));
      
      // TODO: Persist column widths to state/URL/localStorage
      // TODO: Update column definitions with new widths
    },
    []
  );

  // Apply custom widths to columns
  const columnsWithWidths = table.visibleColumns.map((column) => {
    const customWidth = columnWidths[column.id];
    if (customWidth) {
      return {
        ...column,
        width: customWidth,
      };
    }
    return column;
  });

  // Normalize maxHeight to CSS value
  const maxHeightValue = maxHeight
    ? typeof maxHeight === "number"
      ? `${maxHeight}px`
      : maxHeight
    : undefined;

  // Determine if we need a scroll container
  const hasVerticalScroll = maxHeight !== undefined;

  return (
    <div
      className={`table-x-container ${bordered ? "table-x-container--bordered" : "table-x-container--borderless"} ${className}`}
      style={{
        // CSS variables for theming
        "--table-x-sticky-bg": "var(--table-x-bg, #fff)",
        "--table-x-border-color": "var(--table-x-border-color, #e5e7eb)",
        "--table-x-border-width": "var(--table-x-border-width, 1px)",
        "--table-x-header-bg": "var(--table-x-header-bg, #f9fafb)",
        "--table-x-hover-bg": "var(--table-x-hover-bg, #f3f4f6)",
      } as React.CSSProperties}
    >
      <div
        className={`table-x-wrapper ${hasVerticalScroll ? "table-x-wrapper--scrollable" : ""}`}
        style={{
          overflowX: "auto",
          overflowY: hasVerticalScroll ? "auto" : "visible",
          maxHeight: maxHeightValue,
          position: "relative",
        }}
      >
        <table
          className={`table-x-table ${bordered ? "table-x-table--bordered" : "table-x-table--borderless"}`}
          role="table"
          aria-label="Data table"
          style={{
            width: "100%",
            borderCollapse: "separate",
            borderSpacing: 0,
            tableLayout: "auto",
          }}
        >
          <TableHeader
            columns={columnsWithWidths}
            sortState={table.sorting.state}
            onSort={table.sorting.toggle}
            onResize={enableResizing ? handleResize : undefined}
            renderHeader={renderHeader}
            sticky={stickyHeader}
            stickyFirstColumn={stickyFirstColumn}
            bordered={bordered}
          />
          <TableBody
            data={table.paginatedData}
            columns={columnsWithWidths}
            getRowKey={getRowKey}
            renderCell={renderCell}
            renderRow={renderRow}
            stickyFirstColumn={stickyFirstColumn}
            isLoading={isLoading}
            error={error}
            emptyComponent={slots.empty}
            loadingComponent={slots.loader}
            errorComponent={slots.error}
            bordered={bordered}
          />
        </table>
      </div>
      
      {/* TODO: Add footer with pagination controls */}
      {/* TODO: Add column visibility toggle UI */}
      {/* TODO: Add export functionality */}
    </div>
  );
}
