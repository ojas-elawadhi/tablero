/**
 * React hook for data table functionality
 *
 * Bridges core table logic to React components.
 * Supports both controlled and uncontrolled state patterns.
 */

import { useMemo, useCallback, useState } from "react";
import type { TableState, TableStateHandler, UncontrolledTableState } from "../core/tableState";
import {
  createInitialTableState,
  updateSorting,
  updatePagination,
  updateFiltering,
  updateColumnVisibility,
  updateColumnOrder,
  isControlledState,
} from "../core/tableState";
import type { ColumnDef, Column } from "../core/columns";
import {
  createColumns,
  getVisibleColumns,
  getOrderedColumns,
  getColumnIds,
} from "../core/columns";
import { applySort, toggleSort, setSort, clearSort } from "../core/sorting";
import {
  applyFilters,
  setGlobalFilter,
  setColumnFilter,
  clearColumnFilter,
  clearAllFilters,
} from "../core/filtering";
import {
  getPaginatedData,
  getPageCount,
  hasNextPage,
  hasPreviousPage,
  goToNextPage,
  goToPreviousPage,
  goToPage as goToPageUtil,
  setPageSize as setPageSizeUtil,
} from "../core/pagination";

/**
 * Hook configuration options
 */
export interface UseDataTableOptions<TData> {
  /** Data array to display */
  data: TData[];

  /** Column definitions */
  columns: readonly ColumnDef<TData>[];

  /** Initial page size (default: 10) */
  pageSize?: number;

  /** Controlled or uncontrolled state configuration */
  state?: TableStateHandler | UncontrolledTableState;

  // TODO: Add server-side mode support
  // mode?: 'client' | 'server';
  // serverState?: ServerState;

  // TODO: Add custom comparator for sorting
  // compareFn?: CompareFn<unknown>;

  // TODO: Add custom matcher for filtering
  // matchFn?: MatchFn;
}

/**
 * Table instance API returned by useDataTable
 */
export interface TableInstance<TData> {
  /** Current table state */
  state: TableState;

  /** Runtime columns (with normalized accessors) */
  columns: Column<TData>[];

  /** Visible columns in current order */
  visibleColumns: Column<TData>[];

  /** Original data array */
  data: TData[];

  /** Filtered data (after applying filters) */
  filteredData: TData[];

  /** Sorted data (after applying sorting) */
  sortedData: TData[];

  /** Paginated data (final data to display) */
  paginatedData: TData[];

  /** Total number of items after filtering */
  filteredRowCount: number;

  /** Total number of pages */
  pageCount: number;

  /** Current page index */
  pageIndex: number;

  /** Current page size */
  pageSize: number;

  /** Whether there is a next page */
  hasNextPage: boolean;

  /** Whether there is a previous page */
  hasPreviousPage: boolean;

  /** Sorting handlers */
  sorting: {
    /** Current sort state */
    state: TableState["sorting"];
    /** Toggle sort for a column */
    toggle: (columnId: string) => void;
    /** Set sort explicitly */
    set: (columnId: string | null, direction: "asc" | "desc" | null) => void;
    /** Clear sort */
    clear: () => void;
  };

  /** Pagination handlers */
  pagination: {
    /** Current pagination state */
    state: TableState["pagination"];
    /** Go to next page */
    nextPage: () => void;
    /** Go to previous page */
    previousPage: () => void;
    /** Go to specific page */
    goToPage: (pageIndex: number) => void;
    /** Set page size */
    setPageSize: (pageSize: number) => void;
  };

  /** Filtering handlers */
  filtering: {
    /** Current filter state */
    state: TableState["filtering"];
    /** Set global filter */
    setGlobalFilter: (filter: string) => void;
    /** Set column filter */
    setColumnFilter: (columnId: string, filter: string) => void;
    /** Clear column filter */
    clearColumnFilter: (columnId: string) => void;
    /** Clear all filters */
    clearAllFilters: () => void;
  };

  /** Column management handlers */
  columnManagement: {
    /** Toggle column visibility */
    toggleVisibility: (columnId: string) => void;
    /** Set column visibility */
    setVisibility: (columnId: string, visible: boolean) => void;
    /** Reorder columns */
    reorder: (columnOrder: string[]) => void;
  };
}

/**
 * useDataTable hook
 *
 * Provides a complete table instance with state management,
 * data transformations, and event handlers.
 *
 * @example
 * ```tsx
 * const table = useDataTable({
 *   data: users,
 *   columns: userColumns,
 *   pageSize: 10,
 * });
 * ```
 */
export function useDataTable<TData>(
  options: UseDataTableOptions<TData>
): TableInstance<TData> {
  const { data, columns: columnDefs, pageSize: initialPageSize = 10, state } = options;

  // Determine if state is controlled
  const isControlled = state && isControlledState(state);

  // Initialize state (controlled or uncontrolled)
  const [internalState, setInternalState] = useState<TableState>(() => {
    const columnIds = getColumnIds(columnDefs);
    const baseState = createInitialTableState(columnIds);

    if (isControlled) {
      return state.state;
    }

    const uncontrolledState = state as UncontrolledTableState | undefined;
    const initialState = uncontrolledState?.initialState;

    return {
      ...baseState,
      pagination: {
        ...baseState.pagination,
        pageSize: initialPageSize,
        ...initialState?.pagination,
      },
      ...initialState,
    };
  });

  // Use controlled state if provided, otherwise use internal state
  const currentState = isControlled ? state.state : internalState;

  // State update handler
  const updateState = useCallback(
    (updater: TableState | ((prev: TableState) => TableState)) => {
      const newState = typeof updater === "function" ? updater(currentState) : updater;

      if (isControlled) {
        state.setState(newState);
      } else {
        setInternalState(newState);
        // Call onStateChange callback if provided
        const uncontrolledState = state as UncontrolledTableState | undefined;
        uncontrolledState?.onStateChange?.(newState);
      }
    },
    [currentState, isControlled, state]
  );

  // Create runtime columns (memoized)
  const columns = useMemo(() => {
    return createColumns(columnDefs);
  }, [columnDefs]);

  // Get visible columns in order (memoized)
  const visibleColumns = useMemo(() => {
    const visible = getVisibleColumns(columns, currentState.columnVisibility);
    return getOrderedColumns(visible, currentState.columnOrder);
  }, [columns, currentState.columnVisibility, currentState.columnOrder]);

  // Create value accessor function (memoized)
  const getValue = useCallback(
    (item: TData, columnId: string): unknown => {
      const column = columns.find((col) => col.id === columnId);
      if (!column) return undefined;
      return column.accessor(item);
    },
    [columns]
  );

  // Apply filters (memoized)
  const filteredData = useMemo(() => {
    return applyFilters(data, currentState.filtering, getValue);
  }, [data, currentState.filtering, getValue]);

  // Apply sorting (memoized)
  const sortedData = useMemo(() => {
    if (!currentState.sorting.columnId) {
      return filteredData;
    }
    return applySort(filteredData, currentState.sorting, getValue);
  }, [filteredData, currentState.sorting, getValue]);

  // Apply pagination (memoized)
  const paginatedData = useMemo(() => {
    return getPaginatedData(sortedData, currentState.pagination);
  }, [sortedData, currentState.pagination]);

  // Computed values (memoized)
  const filteredRowCount = filteredData.length;
  const pageCount = useMemo(() => {
    return getPageCount(filteredRowCount, currentState.pagination.pageSize);
  }, [filteredRowCount, currentState.pagination.pageSize]);

  const hasNext = useMemo(() => {
    return hasNextPage(currentState.pagination.pageIndex, pageCount);
  }, [currentState.pagination.pageIndex, pageCount]);

  const hasPrev = useMemo(() => {
    return hasPreviousPage(currentState.pagination.pageIndex);
  }, [currentState.pagination.pageIndex]);

  // Sorting handlers (stable references)
  const handleToggleSort = useCallback(
    (columnId: string) => {
      const newSorting = toggleSort(currentState.sorting, columnId);
      updateState((prev) => updateSorting(prev, newSorting));
    },
    [currentState.sorting, updateState]
  );

  const handleSetSort = useCallback(
    (columnId: string | null, direction: "asc" | "desc" | null) => {
      const newSorting = setSort(columnId, direction);
      updateState((prev) => updateSorting(prev, newSorting));
    },
    [updateState]
  );

  const handleClearSort = useCallback(() => {
    const newSorting = clearSort();
    updateState((prev) => updateSorting(prev, newSorting));
  }, [updateState]);

  // Pagination handlers (stable references)
  const handleNextPage = useCallback(() => {
    const newPagination = goToNextPage(currentState.pagination, pageCount);
    updateState((prev) => updatePagination(prev, newPagination));
  }, [currentState.pagination, pageCount, updateState]);

  const handlePreviousPage = useCallback(() => {
    const newPagination = goToPreviousPage(currentState.pagination, pageCount);
    updateState((prev) => updatePagination(prev, newPagination));
  }, [currentState.pagination, pageCount, updateState]);

  const handleGoToPage = useCallback(
    (pageIndex: number) => {
      const newPagination = goToPageUtil(currentState.pagination, pageIndex, pageCount);
      updateState((prev) => updatePagination(prev, newPagination));
    },
    [currentState.pagination, pageCount, updateState]
  );

  const handleSetPageSize = useCallback(
    (pageSize: number) => {
      const newPagination = setPageSizeUtil(
        currentState.pagination,
        pageSize,
        filteredRowCount
      );
      updateState((prev) => updatePagination(prev, newPagination));
    },
    [currentState.pagination, filteredRowCount, updateState]
  );

  // Filtering handlers (stable references)
  const handleSetGlobalFilter = useCallback(
    (filter: string) => {
      const newFiltering = setGlobalFilter(filter);
      updateState((prev) => updateFiltering(prev, newFiltering));
    },
    [updateState]
  );

  const handleSetColumnFilter = useCallback(
    (columnId: string, filter: string) => {
      const newFiltering = setColumnFilter(currentState.filtering, columnId, filter);
      updateState((prev) => updateFiltering(prev, newFiltering));
    },
    [currentState.filtering, updateState]
  );

  const handleClearColumnFilter = useCallback(
    (columnId: string) => {
      const newFiltering = clearColumnFilter(currentState.filtering, columnId);
      updateState((prev) => updateFiltering(prev, newFiltering));
    },
    [currentState.filtering, updateState]
  );

  const handleClearAllFilters = useCallback(() => {
    const newFiltering = clearAllFilters();
    updateState((prev) => updateFiltering(prev, newFiltering));
  }, [updateState]);

  // Column management handlers (stable references)
  const toggleColumnVisibility = useCallback(
    (columnId: string) => {
      const currentVisibility = currentState.columnVisibility[columnId] ?? true;
      updateState((prev) => updateColumnVisibility(prev, columnId, !currentVisibility));
    },
    [currentState.columnVisibility, updateState]
  );

  const setColumnVisibility = useCallback(
    (columnId: string, visible: boolean) => {
      updateState((prev) => updateColumnVisibility(prev, columnId, visible));
    },
    [updateState]
  );

  const reorderColumns = useCallback(
    (columnOrder: string[]) => {
      updateState((prev) => updateColumnOrder(prev, columnOrder));
    },
    [updateState]
  );

  // Return stable table instance API
  return useMemo(
    () => ({
      state: currentState,
      columns,
      visibleColumns,
      data,
      filteredData,
      sortedData,
      paginatedData,
      filteredRowCount,
      pageCount,
      pageIndex: currentState.pagination.pageIndex,
      pageSize: currentState.pagination.pageSize,
      hasNextPage: hasNext,
      hasPreviousPage: hasPrev,
      sorting: {
        state: currentState.sorting,
        toggle: handleToggleSort,
        set: handleSetSort,
        clear: handleClearSort,
      },
      pagination: {
        state: currentState.pagination,
        nextPage: handleNextPage,
        previousPage: handlePreviousPage,
        goToPage: handleGoToPage,
        setPageSize: handleSetPageSize,
      },
      filtering: {
        state: currentState.filtering,
        setGlobalFilter: handleSetGlobalFilter,
        setColumnFilter: handleSetColumnFilter,
        clearColumnFilter: handleClearColumnFilter,
        clearAllFilters: handleClearAllFilters,
      },
      columnManagement: {
        toggleVisibility: toggleColumnVisibility,
        setVisibility: setColumnVisibility,
        reorder: reorderColumns,
      },
    }),
    [
      currentState,
      columns,
      visibleColumns,
      data,
      filteredData,
      sortedData,
      paginatedData,
      filteredRowCount,
      pageCount,
      hasNext,
      hasPrev,
      handleToggleSort,
      handleSetSort,
      handleClearSort,
      handleNextPage,
      handlePreviousPage,
      handleGoToPage,
      handleSetPageSize,
      handleSetGlobalFilter,
      handleSetColumnFilter,
      handleClearColumnFilter,
      handleClearAllFilters,
      toggleColumnVisibility,
      setColumnVisibility,
      reorderColumns,
    ]
  );
}
