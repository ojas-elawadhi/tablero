/**
 * Table body component
 *
 * Renders table body with support for:
 * - Row rendering with proper keys
 * - Custom row renderers
 * - Empty state
 * - Loading state
 * - Error state
 */

import React from "react";
import type { Column } from "../core/columns";
import { TableCell } from "./TableCell";

export interface TableBodyProps<TData> {
  /** Data rows to render */
  data: TData[];
  
  /** Visible columns */
  columns: Column<TData>[];
  
  /** Row key extractor */
  getRowKey?: (row: TData, index: number) => string | number;
  
  /** Custom cell renderer */
  renderCell?: (value: unknown, row: TData, column: Column<TData>) => React.ReactNode;
  
  /** Custom row renderer */
  renderRow?: (
    row: TData,
    index: number,
    cells: React.ReactNode[]
  ) => React.ReactNode;
  
  /** Whether first column is sticky */
  stickyFirstColumn?: boolean;
  
  /** Loading state */
  isLoading?: boolean;
  
  /** Error state */
  error?: Error | string | null;
  
  /** Empty state component */
  emptyComponent?: React.ComponentType<{ columns: Column<TData>[] }>;
  
  /** Loading state component */
  loadingComponent?: React.ComponentType;
  
  /** Error state component */
  errorComponent?: React.ComponentType<{ error: Error | string }>;
  
  /** Whether borders are enabled */
  bordered?: boolean;
  
  /** Additional className */
  className?: string;
}

/**
 * TableBody component
 * 
 * Renders table body rows with support for loading, error, and empty states.
 */
export function TableBody<TData>({
  data,
  columns,
  getRowKey = (_, index) => index,
  renderCell,
  renderRow,
  stickyFirstColumn = false,
  isLoading = false,
  error = null,
  emptyComponent: EmptyComponent,
  loadingComponent: LoadingComponent,
  errorComponent: ErrorComponent,
  bordered = true,
  className = "",
}: TableBodyProps<TData>) {
  // Loading state
  if (isLoading && LoadingComponent) {
    return (
      <tbody className={`table-x-body table-x-body--loading ${className}`}>
        <tr>
          <td colSpan={columns.length} className="table-x-body-empty">
            <LoadingComponent />
          </td>
        </tr>
      </tbody>
    );
  }

  // Error state
  if (error && ErrorComponent) {
    return (
      <tbody className={`table-x-body table-x-body--error ${className}`}>
        <tr>
          <td colSpan={columns.length} className="table-x-body-empty">
            <ErrorComponent error={error} />
          </td>
        </tr>
      </tbody>
    );
  }

  // Empty state
  if (data.length === 0) {
    if (EmptyComponent) {
      return (
        <tbody className={`table-x-body table-x-body--empty ${className}`}>
          <tr>
            <td colSpan={columns.length} className="table-x-body-empty">
              <EmptyComponent columns={columns} />
            </td>
          </tr>
        </tbody>
      );
    }
    
    return (
      <tbody className={`table-x-body table-x-body--empty ${className}`}>
        <tr>
          <td colSpan={columns.length} className="table-x-body-empty">
            No data available
          </td>
        </tr>
      </tbody>
    );
  }

  // Render rows
  return (
    <tbody className={`table-x-body ${bordered ? "table-x-body--bordered" : "table-x-body--borderless"} ${className}`}>
      {data.map((row, rowIndex) => {
        const key = getRowKey(row, rowIndex);
        
        const cells = columns.map((column, columnIndex) => {
          const isFirstColumn = columnIndex === 0;
          const isSticky = stickyFirstColumn && isFirstColumn;
          
          return (
            <TableCell
              key={column.id}
              column={column}
              row={row}
              rowIndex={rowIndex}
              columnIndex={columnIndex}
              renderCell={renderCell}
              className={`${isSticky ? "table-x-cell--sticky" : ""} ${bordered ? "table-x-cell--bordered" : "table-x-cell--borderless"}`}
            />
          );
        });

        if (renderRow) {
          return (
            <React.Fragment key={key}>
              {renderRow(row, rowIndex, cells)}
            </React.Fragment>
          );
        }

        return (
          <tr
            key={key}
            role="row"
            className="table-x-row"
          >
            {cells}
          </tr>
        );
      })}
    </tbody>
  );
}
