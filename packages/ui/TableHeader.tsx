/**
 * Table header component
 *
 * Renders table headers with support for:
 * - Sortable columns with sort indicators
 * - Column resizing (pointer-based)
 * - Custom header renderers
 * - Sticky header support
 */

import React, { useState, useCallback, useRef } from "react";
import type { Column } from "../core/columns";
import type { SortState } from "../core/sorting";

export interface TableHeaderProps<TData> {
  /** Visible columns */
  columns: Column<TData>[];
  
  /** Current sort state */
  sortState: SortState;
  
  /** Sort toggle handler */
  onSort: (columnId: string) => void;
  
  /** Column resize handler */
  onResize?: (columnId: string, width: number) => void;
  
  /** Custom header renderer */
  renderHeader?: (column: Column<TData>, sortState: SortState) => React.ReactNode;
  
  /** Whether header is sticky */
  sticky?: boolean;
  
  /** Whether first column is sticky */
  stickyFirstColumn?: boolean;
  
  /** Whether borders are enabled */
  bordered?: boolean;
  
  /** Selection enabled */
  selectionEnabled?: boolean;
  
  /** Selection mode */
  selectionMode?: "single" | "multi";
  
  /** Whether all rows on current page are selected */
  isAllSelected?: boolean;
  
  /** Whether some rows are selected (indeterminate) */
  isIndeterminate?: boolean;
  
  /** Select all handler */
  onSelectAll?: () => void;
  
  /** Deselect all handler */
  onDeselectAll?: () => void;
  
  /** Additional className */
  className?: string;
}

/**
 * TableHeader component
 * 
 * Renders table header row with sortable columns and resizing support.
 */
export function TableHeader<TData>({
  columns,
  sortState,
  onSort,
  onResize,
  renderHeader,
  sticky = false,
  stickyFirstColumn = false,
  bordered = true,
  selectionEnabled = false,
  selectionMode = "multi",
  isAllSelected = false,
  isIndeterminate = false,
  onSelectAll,
  onDeselectAll,
  className = "",
}: TableHeaderProps<TData>) {
  const [resizingColumn, setResizingColumn] = useState<string | null>(null);
  const resizeStartX = useRef<number>(0);
  const resizeStartWidth = useRef<number>(0);
  const resizeColumnId = useRef<string | null>(null);

  const handleResizeStart = useCallback(
    (e: React.MouseEvent, columnId: string, currentWidth?: number) => {
      e.preventDefault();
      e.stopPropagation();
      
      setResizingColumn(columnId);
      resizeStartX.current = e.clientX;
      resizeStartWidth.current = currentWidth || 150;
      resizeColumnId.current = columnId;
      
      const handleMouseMove = (e: MouseEvent) => {
        if (!resizeColumnId.current || !onResize) return;
        
        const diff = e.clientX - resizeStartX.current;
        const newWidth = Math.max(50, resizeStartWidth.current + diff);
        onResize(resizeColumnId.current, newWidth);
      };
      
      const handleMouseUp = () => {
        setResizingColumn(null);
        resizeColumnId.current = null;
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
      
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [onResize]
  );

  return (
    <thead
      className={`table-x-header ${sticky ? "table-x-header--sticky" : ""} ${bordered ? "table-x-header--bordered" : "table-x-header--borderless"} ${className}`}
      style={
        sticky
          ? {
              position: "sticky",
              top: 0,
              zIndex: 10,
              backgroundColor: "var(--table-x-header-bg, #f9fafb)",
            }
          : undefined
      }
    >
      <tr role="row">
        {selectionEnabled && (
          <th
            className={`table-x-header-cell table-x-selection-cell ${
              stickyFirstColumn ? "table-x-header-cell--sticky" : ""
            } ${bordered ? "table-x-header-cell--bordered" : "table-x-header-cell--borderless"}`}
            style={{
              width: "48px",
              minWidth: "48px",
              maxWidth: "48px",
              textAlign: "center",
              position: stickyFirstColumn ? "sticky" : sticky ? "relative" : undefined,
              left: stickyFirstColumn ? 0 : undefined,
              zIndex: stickyFirstColumn ? 12 : sticky ? 10 : undefined,
              backgroundColor: sticky
                ? "var(--table-x-header-bg, #f9fafb)"
                : stickyFirstColumn
                ? "var(--table-x-sticky-bg, #fff)"
                : undefined,
            }}
            role="columnheader"
            aria-label="Select all rows"
          >
            {selectionMode === "multi" && (
              <input
                type="checkbox"
                checked={isAllSelected}
                ref={(input) => {
                  if (input) input.indeterminate = isIndeterminate;
                }}
                onChange={(e) => {
                  if (e.target.checked) {
                    onSelectAll?.();
                  } else {
                    onDeselectAll?.();
                  }
                }}
                aria-label="Select all rows"
                className="table-x-checkbox"
              />
            )}
          </th>
        )}
        {columns.map((column, index) => {
          // If selection is enabled, first data column is index 1 (after checkbox)
          const isFirstColumn = selectionEnabled ? index === 0 : index === 0;
          const isSticky = stickyFirstColumn && isFirstColumn;
          const isSorted = sortState.columnId === column.id;
          const sortDirection = isSorted ? sortState.direction : null;
          
          return (
            <th
              key={column.id}
              className={`table-x-header-cell ${
                column.sortable ? "table-x-header-cell--sortable" : ""
              } ${isSorted ? "table-x-header-cell--sorted" : ""} ${
                isSticky ? "table-x-header-cell--sticky" : ""
              } ${resizingColumn === column.id ? "table-x-header-cell--resizing" : ""} ${
                bordered ? "table-x-header-cell--bordered" : "table-x-header-cell--borderless"
              }`}
              style={{
                textAlign: column.align || "left",
                width: column.width ? `${column.width}px` : undefined,
                minWidth: column.def.minWidth ? `${column.def.minWidth}px` : undefined,
                maxWidth: column.def.maxWidth ? `${column.def.maxWidth}px` : undefined,
                position: isSticky ? "sticky" : sticky ? "relative" : undefined,
                left: isSticky ? 0 : undefined,
                zIndex: isSticky ? 12 : sticky ? 10 : undefined,
                backgroundColor: sticky
                  ? "var(--table-x-header-bg, #f9fafb)"
                  : isSticky
                  ? "var(--table-x-sticky-bg, #fff)"
                  : undefined,
              }}
              role="columnheader"
              aria-sort={
                isSorted
                  ? sortDirection === "asc"
                    ? "ascending"
                    : "descending"
                  : column.sortable
                  ? "none"
                  : undefined
              }
              onClick={() => {
                if (column.sortable) {
                  onSort(column.id);
                }
              }}
            >
              <div className="table-x-header-cell-content">
                {renderHeader ? (
                  renderHeader(column, sortState)
                ) : (
                  <>
                    <span>{column.header}</span>
                    {column.sortable && (
                      <span className="table-x-sort-indicator" aria-hidden="true">
                        {sortDirection === "asc" ? "↑" : sortDirection === "desc" ? "↓" : "⇅"}
                      </span>
                    )}
                  </>
                )}
              </div>
              {onResize && (
                <div
                  className="table-x-resize-handle"
                  onMouseDown={(e) => handleResizeStart(e, column.id, column.width)}
                  role="separator"
                  aria-orientation="vertical"
                  aria-label={`Resize column ${column.header}`}
                />
              )}
            </th>
          );
        })}
      </tr>
    </thead>
  );
}
