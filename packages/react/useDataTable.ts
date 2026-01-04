/**
 * React hook for data table functionality
 *
 * Bridges core table logic to React components.
 * Supports both controlled and uncontrolled state patterns.
 */

import { useMemo, useCallback, useState, useEffect, useRef } from "react";
import type {
  TableState,
  TableStateHandler,
  UncontrolledTableState,
  ServerMode,
} from "../core/tableState";
import type { SortState } from "../core/sorting";
import type { PaginationState } from "../core/pagination";
import type { FilterState } from "../core/filtering";
import {
  createInitialTableState,
  createInitialSelectionState,
  updateSorting,
  updatePagination,
  updateFiltering,
  updateColumnVisibility,
  updateColumnOrder,
  updateSelection,
  selectRow,
  deselectRow,
  toggleRowSelection,
  selectRows,
  deselectRows,
  clearSelection,
  isRowSelected,
  getSelectedRowCount,
  isControlledState,
  isServerMode,
  type SelectionConfig,
  type SelectionMode,
  type SelectionState,
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
import {
  parseStateFromUrl,
  serializeStateToUrl,
  createDebouncedFunction,
  createBrowserRouterAdapter,
  type RouterAdapter,
  type UrlSyncConfig,
} from "../utils/urlSync";

/**
 * Per-state control configuration
 * Allows controlling individual state pieces independently
 */
export interface PerStateControl {
  /** Controlled pagination state */
  pagination?: PaginationState;

  /** Controlled sorting state */
  sorting?: SortState;

  /** Controlled filtering state */
  filtering?: FilterState;

  /** Controlled column visibility state */
  columnVisibility?: Record<string, boolean>;

  /** Controlled column order */
  columnOrder?: string[];

  /** Callback when any state changes */
  onStateChange?: (updates: Partial<TableState>) => void;

  /** Callback when pagination changes */
  onPaginationChange?: (pagination: PaginationState) => void;

  /** Callback when sorting changes */
  onSortingChange?: (sorting: SortState) => void;

  /** Callback when filtering changes */
  onFilteringChange?: (filtering: FilterState) => void;

  /** Callback when column visibility changes */
  onColumnVisibilityChange?: (
    columnVisibility: Record<string, boolean>
  ) => void;

  /** Callback when column order changes */
  onColumnOrderChange?: (columnOrder: string[]) => void;
}

/**
 * Type guard to check if state config is per-state control
 */
function isPerStateControlConfig(
  state:
    | TableStateHandler
    | UncontrolledTableState
    | PerStateControl
    | undefined
): state is PerStateControl {
  if (!state) return false;
  // Legacy API has 'state' property (TableStateHandler) or 'initialState' (UncontrolledTableState)
  // Per-state control has individual state properties
  return (
    !("state" in state) &&
    !("initialState" in state) &&
    ("pagination" in state ||
      "sorting" in state ||
      "filtering" in state ||
      "columnVisibility" in state ||
      "columnOrder" in state ||
      "onStateChange" in state ||
      "onPaginationChange" in state ||
      "onSortingChange" in state ||
      "onFilteringChange" in state ||
      "onColumnVisibilityChange" in state ||
      "onColumnOrderChange" in state)
  );
}

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

  /**
   * State configuration - supports three modes:
   * 1. Legacy API: `TableStateHandler | UncontrolledTableState` (fully controlled/uncontrolled)
   * 2. Per-state control: `PerStateControl` (individually controlled states)
   * 3. Uncontrolled: `undefined` (default, all states uncontrolled)
   *
   * @example
   * ```tsx
   * // Fully uncontrolled (default)
   * useDataTable({ data, columns })
   *
   * // Per-state control
   * useDataTable({
   *   data,
   *   columns,
   *   state: {
   *     pagination: { pageIndex: 0, pageSize: 10 },
   *     sorting: { columnId: 'name', direction: 'asc' },
   *     onStateChange: (updates) => setState(prev => ({ ...prev, ...updates })),
   *   },
   * })
   *
   * // Legacy fully controlled
   * useDataTable({
   *   data,
   *   columns,
   *   state: {
   *     state: tableState,
   *     setState: setTableState,
   *   },
   * })
   * ```
   */
  state?: TableStateHandler | UncontrolledTableState | PerStateControl;

  /** Server mode configuration */
  serverMode?: ServerMode;

  /** Selection configuration */
  selection?: SelectionConfig;

  /** Row key extractor for stable row IDs (required for selection) */
  getRowKey?: (row: TData, index: number) => string | number;

  /**
   * URL synchronization configuration
   * Syncs pagination, sorting, and filtering state with URL search params
   *
   * @example
   * ```tsx
   * // Simple: use browser history API
   * useDataTable({
   *   data,
   *   columns,
   *   urlSync: { enabled: true },
   * })
   *
   * // Next.js App Router
   * const searchParams = useSearchParams();
   * const router = useRouter();
   * const pathname = usePathname();
   * useDataTable({
   *   data,
   *   columns,
   *   urlSync: {
   *     enabled: true,
   *     routerAdapter: createNextAppRouterAdapter(searchParams, router, pathname),
   *   },
   * })
   * ```
   */
  urlSync?: UrlSyncConfig & {
    /** Router adapter (inject Next.js router or custom implementation) */
    routerAdapter?: RouterAdapter;
  };

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

  /** Selection handlers */
  selection: {
    /** Current selection state */
    state: SelectionState;
    /** Whether selection is enabled */
    enabled: boolean;
    /** Selection mode */
    mode: SelectionMode;
    /** Selected row IDs */
    selectedRowIds: Set<string | number>;
    /** Selected row count */
    selectedCount: number;
    /** Whether a row is selected */
    isSelected: (rowId: string | number) => boolean;
    /** Select a row */
    select: (rowId: string | number) => void;
    /** Deselect a row */
    deselect: (rowId: string | number) => void;
    /** Toggle row selection */
    toggle: (rowId: string | number) => void;
    /** Select multiple rows */
    selectMultiple: (rowIds: (string | number)[]) => void;
    /** Deselect multiple rows */
    deselectMultiple: (rowIds: (string | number)[]) => void;
    /** Select all rows on current page */
    selectAll: () => void;
    /** Deselect all rows on current page */
    deselectAll: () => void;
    /** Clear all selections */
    clear: () => void;
    /** Whether all rows on current page are selected */
    isAllSelected: boolean;
    /** Whether some (but not all) rows on current page are selected (indeterminate) */
    isIndeterminate: boolean;
  };
}

/**
 * useDataTable hook
 *
 * Provides a complete table instance with state management,
 * data transformations, and event handlers.
 *
 * Supports three state control modes:
 * 1. Uncontrolled (default): All state managed internally
 * 2. Fully controlled (legacy): All state controlled via `state.state` and `state.setState`
 * 3. Per-state controlled: Individual states controlled independently
 *
 * @example
 * ```tsx
 * // Uncontrolled
 * const table = useDataTable({
 *   data: users,
 *   columns: userColumns,
 *   pageSize: 10,
 * });
 *
 * // Per-state control
 * const table = useDataTable({
 *   data: users,
 *   columns: userColumns,
 *   state: {
 *     pagination: { pageIndex: 0, pageSize: 10 },
 *     sorting: { columnId: 'name', direction: 'asc' },
 *     onStateChange: (updates) => {
 *       setState(prev => ({ ...prev, ...updates }));
 *     },
 *   },
 * });
 * ```
 */
export function useDataTable<TData>(
  options: UseDataTableOptions<TData>
): TableInstance<TData> {
  const {
    data,
    columns: columnDefs,
    pageSize: initialPageSize = 10,
    state: stateConfig,
    serverMode,
    selection: selectionConfig,
    getRowKey,
    urlSync: urlSyncConfig,
  } = options;

  // Selection configuration
  const selectionEnabled = selectionConfig?.enabled ?? false;
  const selectionMode: SelectionMode = selectionConfig?.mode ?? "multi";

  // URL sync configuration
  const urlSyncEnabled = urlSyncConfig?.enabled ?? false;
  const routerAdapter: RouterAdapter =
    urlSyncConfig?.routerAdapter ?? createBrowserRouterAdapter();
  const urlSyncConfigRef = useMemo<UrlSyncConfig>(
    () => ({
      enabled: urlSyncEnabled,
      paramNames: urlSyncConfig?.paramNames,
      debounceMs: urlSyncConfig?.debounceMs ?? 300,
      features: urlSyncConfig?.features,
    }),
    [
      urlSyncEnabled,
      urlSyncConfig?.paramNames,
      urlSyncConfig?.debounceMs,
      urlSyncConfig?.features,
    ]
  );

  // Determine state control mode
  const isLegacyControlled = stateConfig && isControlledState(stateConfig);
  const isPerStateControl = isPerStateControlConfig(stateConfig);
  const isLegacyUncontrolled =
    stateConfig && !isLegacyControlled && !isPerStateControl;

  // Initialize internal state for uncontrolled pieces
  const columnIds = useMemo(() => getColumnIds(columnDefs), [columnDefs]);

  // Parse initial state from URL if URL sync is enabled (SSR-safe)
  // This must be computed before useState calls so it can be used in initializers
  const urlInitialState = useMemo<Partial<TableState> | undefined>(() => {
    if (!urlSyncEnabled || !routerAdapter.isClient()) {
      return undefined;
    }
    try {
      const searchParams = routerAdapter.getSearchParams();
      return parseStateFromUrl(searchParams, urlSyncConfigRef);
    } catch (error) {
      // Silently fail if URL parsing fails (SSR safety)
      console.warn("Failed to parse URL state:", error);
      return undefined;
    }
  }, [urlSyncEnabled, routerAdapter, urlSyncConfigRef]);

  const baseState = useMemo(
    () =>
      createInitialTableState(
        columnIds,
        serverMode,
        selectionConfig?.initialSelectedRowIds
      ),
    [columnIds, serverMode, selectionConfig?.initialSelectedRowIds]
  );

  // Internal state for uncontrolled pieces
  const [internalPagination, setInternalPagination] = useState<PaginationState>(
    () => {
      if (isPerStateControl && stateConfig.pagination) {
        return stateConfig.pagination;
      }
      if (isLegacyControlled) {
        return stateConfig.state.pagination;
      }
      const legacyUncontrolled = stateConfig as
        | UncontrolledTableState
        | undefined;
      return {
        ...baseState.pagination,
        pageSize: initialPageSize,
        ...urlInitialState?.pagination,
        ...legacyUncontrolled?.initialState?.pagination,
      };
    }
  );

  const [internalSorting, setInternalSorting] = useState<SortState>(() => {
    if (isPerStateControl && stateConfig.sorting) {
      return stateConfig.sorting;
    }
    if (isLegacyControlled) {
      return stateConfig.state.sorting;
    }
    const legacyUncontrolled = stateConfig as
      | UncontrolledTableState
      | undefined;
    return (
      legacyUncontrolled?.initialState?.sorting ??
      urlInitialState?.sorting ??
      baseState.sorting
    );
  });

  const [internalFiltering, setInternalFiltering] = useState<FilterState>(
    () => {
      if (isPerStateControl && stateConfig.filtering) {
        return stateConfig.filtering;
      }
      if (isLegacyControlled) {
        return stateConfig.state.filtering;
      }
      const legacyUncontrolled = stateConfig as
        | UncontrolledTableState
        | undefined;
      return (
        legacyUncontrolled?.initialState?.filtering ??
        urlInitialState?.filtering ??
        baseState.filtering
      );
    }
  );

  const [internalColumnVisibility, setInternalColumnVisibility] = useState<
    Record<string, boolean>
  >(() => {
    if (isPerStateControl && stateConfig.columnVisibility) {
      return stateConfig.columnVisibility;
    }
    if (isLegacyControlled) {
      return stateConfig.state.columnVisibility;
    }
    const legacyUncontrolled = stateConfig as
      | UncontrolledTableState
      | undefined;
    return (
      legacyUncontrolled?.initialState?.columnVisibility ??
      baseState.columnVisibility
    );
  });

  const [internalColumnOrder, setInternalColumnOrder] = useState<string[]>(
    () => {
      if (isPerStateControl && stateConfig.columnOrder) {
        return stateConfig.columnOrder;
      }
      if (isLegacyControlled) {
        return stateConfig.state.columnOrder;
      }
      const legacyUncontrolled = stateConfig as
        | UncontrolledTableState
        | undefined;
      return (
        legacyUncontrolled?.initialState?.columnOrder ?? baseState.columnOrder
      );
    }
  );

  // Selection state (always internal, not part of per-state control yet)
  const [internalSelection, setInternalSelection] = useState<SelectionState>(
    () => {
      if (isLegacyControlled && stateConfig) {
        return (stateConfig as TableStateHandler).state.selection;
      }
      const legacyUncontrolled = stateConfig as
        | UncontrolledTableState
        | undefined;
      return (
        legacyUncontrolled?.initialState?.selection ??
        createInitialSelectionState(selectionConfig?.initialSelectedRowIds)
      );
    }
  );

  // Sync controlled state from props (for per-state control)
  // Extract values for dependency array to avoid type errors
  const perStatePagination = useMemo(() => {
    return isPerStateControl && stateConfig
      ? (stateConfig as PerStateControl).pagination
      : undefined;
  }, [isPerStateControl, stateConfig]);

  const perStateSorting = useMemo(() => {
    return isPerStateControl && stateConfig
      ? (stateConfig as PerStateControl).sorting
      : undefined;
  }, [isPerStateControl, stateConfig]);

  const perStateFiltering = useMemo(() => {
    return isPerStateControl && stateConfig
      ? (stateConfig as PerStateControl).filtering
      : undefined;
  }, [isPerStateControl, stateConfig]);

  const perStateColumnVisibility = useMemo(() => {
    return isPerStateControl && stateConfig
      ? (stateConfig as PerStateControl).columnVisibility
      : undefined;
  }, [isPerStateControl, stateConfig]);

  const perStateColumnOrder = useMemo(() => {
    return isPerStateControl && stateConfig
      ? (stateConfig as PerStateControl).columnOrder
      : undefined;
  }, [isPerStateControl, stateConfig]);

  useEffect(() => {
    if (isPerStateControl && stateConfig) {
      const perStateConfig = stateConfig as PerStateControl;
      if (perStateConfig.pagination !== undefined) {
        setInternalPagination(perStateConfig.pagination);
      }
      if (perStateConfig.sorting !== undefined) {
        setInternalSorting(perStateConfig.sorting);
      }
      if (perStateConfig.filtering !== undefined) {
        setInternalFiltering(perStateConfig.filtering);
      }
      if (perStateConfig.columnVisibility !== undefined) {
        setInternalColumnVisibility(perStateConfig.columnVisibility);
      }
      if (perStateConfig.columnOrder !== undefined) {
        setInternalColumnOrder(perStateConfig.columnOrder);
      }
    }
  }, [
    isPerStateControl,
    stateConfig,
    perStatePagination,
    perStateSorting,
    perStateFiltering,
    perStateColumnVisibility,
    perStateColumnOrder,
  ]);

  // Determine current state values
  const currentPagination = useMemo(() => {
    if (isLegacyControlled && stateConfig) {
      return (stateConfig as TableStateHandler).state.pagination;
    }
    if (isPerStateControl && perStatePagination !== undefined) {
      return perStatePagination;
    }
    return internalPagination;
  }, [
    isLegacyControlled,
    isPerStateControl,
    stateConfig,
    perStatePagination,
    internalPagination,
  ]);

  const currentSorting = useMemo(() => {
    if (isLegacyControlled && stateConfig) {
      return (stateConfig as TableStateHandler).state.sorting;
    }
    if (isPerStateControl && perStateSorting !== undefined) {
      return perStateSorting;
    }
    return internalSorting;
  }, [
    isLegacyControlled,
    isPerStateControl,
    stateConfig,
    perStateSorting,
    internalSorting,
  ]);

  const currentFiltering = useMemo(() => {
    if (isLegacyControlled && stateConfig) {
      return (stateConfig as TableStateHandler).state.filtering;
    }
    if (isPerStateControl && perStateFiltering !== undefined) {
      return perStateFiltering;
    }
    return internalFiltering;
  }, [
    isLegacyControlled,
    isPerStateControl,
    stateConfig,
    perStateFiltering,
    internalFiltering,
  ]);

  const currentColumnVisibility = useMemo(() => {
    if (isLegacyControlled && stateConfig) {
      return (stateConfig as TableStateHandler).state.columnVisibility;
    }
    if (isPerStateControl && perStateColumnVisibility !== undefined) {
      return perStateColumnVisibility;
    }
    return internalColumnVisibility;
  }, [
    isLegacyControlled,
    isPerStateControl,
    stateConfig,
    perStateColumnVisibility,
    internalColumnVisibility,
  ]);

  const currentColumnOrder = useMemo(() => {
    if (isLegacyControlled && stateConfig) {
      return (stateConfig as TableStateHandler).state.columnOrder;
    }
    if (isPerStateControl && perStateColumnOrder !== undefined) {
      return perStateColumnOrder;
    }
    return internalColumnOrder;
  }, [
    isLegacyControlled,
    isPerStateControl,
    stateConfig,
    perStateColumnOrder,
    internalColumnOrder,
  ]);

  // Current selection state (always uses internal for now)
  const currentSelection = useMemo(() => {
    if (isLegacyControlled && stateConfig) {
      return (stateConfig as TableStateHandler).state.selection;
    }
    return internalSelection;
  }, [isLegacyControlled, stateConfig, internalSelection]);

  // Build current state object
  const currentState = useMemo<TableState>(
    () => ({
      pagination: currentPagination,
      sorting: currentSorting,
      filtering: currentFiltering,
      columnVisibility: currentColumnVisibility,
      columnOrder: currentColumnOrder,
      selection: currentSelection,
      serverMode,
    }),
    [
      currentPagination,
      currentSorting,
      currentFiltering,
      currentColumnVisibility,
      currentColumnOrder,
      currentSelection,
      serverMode,
    ]
  );

  // State update handlers with proper control flow
  const updatePaginationState = useCallback(
    (
      updater: PaginationState | ((prev: PaginationState) => PaginationState)
    ) => {
      const newPagination =
        typeof updater === "function" ? updater(currentPagination) : updater;

      if (isLegacyControlled && stateConfig) {
        (stateConfig as TableStateHandler).setState((prev) =>
          updatePagination(prev, newPagination)
        );
      } else if (
        isPerStateControl &&
        stateConfig &&
        perStatePagination !== undefined
      ) {
        // Controlled via per-state control
        const perStateConfig = stateConfig as PerStateControl;
        perStateConfig.onPaginationChange?.(newPagination);
        perStateConfig.onStateChange?.({ pagination: newPagination });
      } else {
        // Uncontrolled
        setInternalPagination(newPagination);
        if (isLegacyUncontrolled && stateConfig) {
          const legacyUncontrolled = stateConfig as UncontrolledTableState;
          legacyUncontrolled.onStateChange?.({
            ...currentState,
            pagination: newPagination,
          });
        }
      }
    },
    [
      currentPagination,
      currentState,
      isLegacyControlled,
      isPerStateControl,
      isLegacyUncontrolled,
      stateConfig,
      perStatePagination,
    ]
  );

  const updateSortingState = useCallback(
    (updater: SortState | ((prev: SortState) => SortState)) => {
      const newSorting =
        typeof updater === "function" ? updater(currentSorting) : updater;

      if (isLegacyControlled && stateConfig) {
        (stateConfig as TableStateHandler).setState((prev) =>
          updateSorting(prev, newSorting)
        );
      } else if (
        isPerStateControl &&
        stateConfig &&
        perStateSorting !== undefined
      ) {
        // Controlled via per-state control
        const perStateConfig = stateConfig as PerStateControl;
        perStateConfig.onSortingChange?.(newSorting);
        perStateConfig.onStateChange?.({ sorting: newSorting });
      } else {
        // Uncontrolled
        setInternalSorting(newSorting);
        if (isLegacyUncontrolled && stateConfig) {
          const legacyUncontrolled = stateConfig as UncontrolledTableState;
          legacyUncontrolled.onStateChange?.({
            ...currentState,
            sorting: newSorting,
          });
        }
      }
    },
    [
      currentSorting,
      currentState,
      isLegacyControlled,
      isPerStateControl,
      isLegacyUncontrolled,
      stateConfig,
      perStateSorting,
    ]
  );

  const updateFilteringState = useCallback(
    (updater: FilterState | ((prev: FilterState) => FilterState)) => {
      const newFiltering =
        typeof updater === "function" ? updater(currentFiltering) : updater;

      if (isLegacyControlled && stateConfig) {
        (stateConfig as TableStateHandler).setState((prev) =>
          updateFiltering(prev, newFiltering)
        );
      } else if (
        isPerStateControl &&
        stateConfig &&
        perStateFiltering !== undefined
      ) {
        // Controlled via per-state control
        const perStateConfig = stateConfig as PerStateControl;
        perStateConfig.onFilteringChange?.(newFiltering);
        perStateConfig.onStateChange?.({ filtering: newFiltering });
      } else {
        // Uncontrolled
        setInternalFiltering(newFiltering);
        if (isLegacyUncontrolled && stateConfig) {
          const legacyUncontrolled = stateConfig as UncontrolledTableState;
          legacyUncontrolled.onStateChange?.({
            ...currentState,
            filtering: newFiltering,
          });
        }
      }
    },
    [
      currentFiltering,
      currentState,
      isLegacyControlled,
      isPerStateControl,
      isLegacyUncontrolled,
      stateConfig,
      perStateFiltering,
    ]
  );

  const updateColumnVisibilityState = useCallback(
    (
      updater:
        | Record<string, boolean>
        | ((prev: Record<string, boolean>) => Record<string, boolean>)
    ) => {
      const newVisibility =
        typeof updater === "function"
          ? updater(currentColumnVisibility)
          : updater;

      if (isLegacyControlled && stateConfig) {
        (stateConfig as TableStateHandler).setState((prev) => ({
          ...prev,
          columnVisibility: newVisibility,
        }));
      } else if (
        isPerStateControl &&
        stateConfig &&
        perStateColumnVisibility !== undefined
      ) {
        // Controlled via per-state control
        const perStateConfig = stateConfig as PerStateControl;
        perStateConfig.onColumnVisibilityChange?.(newVisibility);
        perStateConfig.onStateChange?.({ columnVisibility: newVisibility });
      } else {
        // Uncontrolled
        setInternalColumnVisibility(newVisibility);
        if (isLegacyUncontrolled && stateConfig) {
          const legacyUncontrolled = stateConfig as UncontrolledTableState;
          legacyUncontrolled.onStateChange?.({
            ...currentState,
            columnVisibility: newVisibility,
          });
        }
      }
    },
    [
      currentColumnVisibility,
      currentState,
      isLegacyControlled,
      isPerStateControl,
      isLegacyUncontrolled,
      stateConfig,
      perStateColumnVisibility,
    ]
  );

  const updateColumnOrderState = useCallback(
    (updater: string[] | ((prev: string[]) => string[])) => {
      const newOrder =
        typeof updater === "function" ? updater(currentColumnOrder) : updater;

      if (isLegacyControlled && stateConfig) {
        (stateConfig as TableStateHandler).setState((prev) =>
          updateColumnOrder(prev, newOrder)
        );
      } else if (
        isPerStateControl &&
        stateConfig &&
        perStateColumnOrder !== undefined
      ) {
        // Controlled via per-state control
        const perStateConfig = stateConfig as PerStateControl;
        perStateConfig.onColumnOrderChange?.(newOrder);
        perStateConfig.onStateChange?.({ columnOrder: newOrder });
      } else {
        // Uncontrolled
        setInternalColumnOrder(newOrder);
        if (isLegacyUncontrolled && stateConfig) {
          const legacyUncontrolled = stateConfig as UncontrolledTableState;
          legacyUncontrolled.onStateChange?.({
            ...currentState,
            columnOrder: newOrder,
          });
        }
      }
    },
    [
      currentColumnOrder,
      currentState,
      isLegacyControlled,
      isPerStateControl,
      isLegacyUncontrolled,
      stateConfig,
      perStateColumnOrder,
    ]
  );

  // Create runtime columns (memoized)
  const columns = useMemo(() => {
    return createColumns(columnDefs);
  }, [columnDefs]);

  // Get visible columns in order (memoized)
  const visibleColumns = useMemo(() => {
    const visible = getVisibleColumns(columns, currentColumnVisibility);
    return getOrderedColumns(visible, currentColumnOrder);
  }, [columns, currentColumnVisibility, currentColumnOrder]);

  // Create value accessor function (memoized)
  const getValue = useCallback(
    (item: TData, columnId: string): unknown => {
      const column = columns.find((col) => col.id === columnId);
      if (!column) return undefined;
      return column.accessor(item);
    },
    [columns]
  );

  // Check server mode for each feature
  const isServerPagination = isServerMode(serverMode, "pagination");
  const isServerSorting = isServerMode(serverMode, "sorting");
  const isServerFiltering = isServerMode(serverMode, "filtering");

  // Apply filters (memoized, skip if server mode)
  const filteredData = useMemo(() => {
    return applyFilters(
      data,
      currentFiltering,
      getValue,
      undefined,
      isServerFiltering
    );
  }, [data, currentFiltering, getValue, isServerFiltering]);

  // Apply sorting (memoized, skip if server mode)
  const sortedData = useMemo(() => {
    if (!currentSorting.columnId) {
      return filteredData;
    }
    return applySort(
      filteredData,
      currentSorting,
      getValue,
      undefined,
      isServerSorting
    );
  }, [filteredData, currentSorting, getValue, isServerSorting]);

  // Apply pagination (memoized, skip if server mode)
  const paginatedData = useMemo(() => {
    return getPaginatedData(sortedData, currentPagination, isServerPagination);
  }, [sortedData, currentPagination, isServerPagination]);

  // Computed values (memoized)
  const filteredRowCount = filteredData.length;
  const pageCount = useMemo(() => {
    // Use server-provided pageCount if available
    if (currentPagination.pageCount !== undefined) {
      return currentPagination.pageCount;
    }
    // Use server-provided totalCount if available
    if (currentPagination.totalCount !== undefined) {
      return getPageCount(
        currentPagination.totalCount,
        currentPagination.pageSize
      );
    }
    // Calculate from filtered data (client-side)
    return getPageCount(filteredRowCount, currentPagination.pageSize);
  }, [
    currentPagination.pageCount,
    currentPagination.totalCount,
    currentPagination.pageSize,
    filteredRowCount,
  ]);

  const hasNext = useMemo(() => {
    return hasNextPage(currentPagination.pageIndex, pageCount);
  }, [currentPagination.pageIndex, pageCount]);

  const hasPrev = useMemo(() => {
    return hasPreviousPage(currentPagination.pageIndex);
  }, [currentPagination.pageIndex]);

  // Sorting handlers (stable references)
  const handleToggleSort = useCallback(
    (columnId: string) => {
      const newSorting = toggleSort(currentSorting, columnId);
      updateSortingState(newSorting);
    },
    [currentSorting, updateSortingState]
  );

  const handleSetSort = useCallback(
    (columnId: string | null, direction: "asc" | "desc" | null) => {
      const newSorting = setSort(columnId, direction);
      updateSortingState(newSorting);
    },
    [updateSortingState]
  );

  const handleClearSort = useCallback(() => {
    const newSorting = clearSort();
    updateSortingState(newSorting);
  }, [updateSortingState]);

  // Pagination handlers (stable references)
  const handleNextPage = useCallback(() => {
    const newPagination = goToNextPage(currentPagination, pageCount);
    updatePaginationState(newPagination);
  }, [currentPagination, pageCount, updatePaginationState]);

  const handlePreviousPage = useCallback(() => {
    const newPagination = goToPreviousPage(currentPagination, pageCount);
    updatePaginationState(newPagination);
  }, [currentPagination, pageCount, updatePaginationState]);

  const handleGoToPage = useCallback(
    (pageIndex: number) => {
      const newPagination = goToPageUtil(
        currentPagination,
        pageIndex,
        pageCount
      );
      updatePaginationState(newPagination);
    },
    [currentPagination, pageCount, updatePaginationState]
  );

  const handleSetPageSize = useCallback(
    (pageSize: number) => {
      const newPagination = setPageSizeUtil(
        currentPagination,
        pageSize,
        filteredRowCount
      );
      updatePaginationState(newPagination);
    },
    [currentPagination, filteredRowCount, updatePaginationState]
  );

  // Filtering handlers (stable references)
  const handleSetGlobalFilter = useCallback(
    (filter: string) => {
      const newFiltering = setGlobalFilter(filter);
      updateFilteringState(newFiltering);
    },
    [updateFilteringState]
  );

  const handleSetColumnFilter = useCallback(
    (columnId: string, filter: string) => {
      const newFiltering = setColumnFilter(currentFiltering, columnId, filter);
      updateFilteringState(newFiltering);
    },
    [currentFiltering, updateFilteringState]
  );

  const handleClearColumnFilter = useCallback(
    (columnId: string) => {
      const newFiltering = clearColumnFilter(currentFiltering, columnId);
      updateFilteringState(newFiltering);
    },
    [currentFiltering, updateFilteringState]
  );

  const handleClearAllFilters = useCallback(() => {
    const newFiltering = clearAllFilters();
    updateFilteringState(newFiltering);
  }, [updateFilteringState]);

  // Column management handlers (stable references)
  const toggleColumnVisibility = useCallback(
    (columnId: string) => {
      const currentVisibility = currentColumnVisibility[columnId] ?? true;
      updateColumnVisibilityState({
        ...currentColumnVisibility,
        [columnId]: !currentVisibility,
      });
    },
    [currentColumnVisibility, updateColumnVisibilityState]
  );

  const setColumnVisibility = useCallback(
    (columnId: string, visible: boolean) => {
      updateColumnVisibilityState({
        ...currentColumnVisibility,
        [columnId]: visible,
      });
    },
    [currentColumnVisibility, updateColumnVisibilityState]
  );

  const reorderColumns = useCallback(
    (columnOrder: string[]) => {
      updateColumnOrderState(columnOrder);
    },
    [updateColumnOrderState]
  );

  // Selection handlers (stable references)
  const updateSelectionState = useCallback(
    (updater: SelectionState | ((prev: SelectionState) => SelectionState)) => {
      const newSelection =
        typeof updater === "function" ? updater(currentSelection) : updater;

      if (isLegacyControlled && stateConfig) {
        (stateConfig as TableStateHandler).setState((prev) =>
          updateSelection(prev, newSelection)
        );
      } else {
        // Selection is always uncontrolled for now
        setInternalSelection(newSelection);
        if (isLegacyUncontrolled && stateConfig) {
          const legacyUncontrolled = stateConfig as UncontrolledTableState;
          legacyUncontrolled.onStateChange?.({
            ...currentState,
            selection: newSelection,
          });
        }
      }
    },
    [
      currentSelection,
      currentState,
      isLegacyControlled,
      isLegacyUncontrolled,
      stateConfig,
    ]
  );

  // Get row keys for current page
  const getRowKeysForPage = useCallback(() => {
    if (!getRowKey) return [];
    return paginatedData.map((row, index) => {
      const globalIndex =
        currentPagination.pageIndex * currentPagination.pageSize + index;
      return getRowKey(row, globalIndex);
    });
  }, [paginatedData, getRowKey, currentPagination]);

  // Selection state helpers
  const selectedRowIds = currentSelection.selectedRowIds;
  const selectedCount = selectedRowIds.size;

  const isRowSelectedHandler = useCallback(
    (rowId: string | number) => {
      return isRowSelected(currentState, rowId);
    },
    [currentState]
  );

  const handleSelectRow = useCallback(
    (rowId: string | number) => {
      if (!selectionEnabled) return;
      if (selectionMode === "single") {
        // Clear all and select only this row
        const newSelection = createInitialSelectionState([rowId]);
        updateSelectionState(newSelection);
      } else {
        const newState = selectRow(currentState, rowId);
        updateSelectionState(newState.selection);
      }
    },
    [selectionEnabled, selectionMode, currentState, updateSelectionState]
  );

  const handleDeselectRow = useCallback(
    (rowId: string | number) => {
      if (!selectionEnabled) return;
      const newState = deselectRow(currentState, rowId);
      updateSelectionState(newState.selection);
    },
    [selectionEnabled, currentState, updateSelectionState]
  );

  const handleToggleRow = useCallback(
    (rowId: string | number) => {
      if (!selectionEnabled) return;
      if (selectionMode === "single") {
        // In single mode, toggle means select this and deselect others
        if (isRowSelectedHandler(rowId)) {
          const newSelection = createInitialSelectionState();
          updateSelectionState(newSelection);
        } else {
          handleSelectRow(rowId);
        }
      } else {
        const newState = toggleRowSelection(currentState, rowId);
        updateSelectionState(newState.selection);
      }
    },
    [
      selectionEnabled,
      selectionMode,
      currentState,
      isRowSelectedHandler,
      updateSelectionState,
      handleSelectRow,
    ]
  );

  const handleSelectMultiple = useCallback(
    (rowIds: (string | number)[]) => {
      if (!selectionEnabled || selectionMode === "single") return;
      const newState = selectRows(currentState, rowIds);
      updateSelectionState(newState.selection);
    },
    [selectionEnabled, selectionMode, currentState, updateSelectionState]
  );

  const handleDeselectMultiple = useCallback(
    (rowIds: (string | number)[]) => {
      if (!selectionEnabled) return;
      const newState = deselectRows(currentState, rowIds);
      updateSelectionState(newState.selection);
    },
    [selectionEnabled, currentState, updateSelectionState]
  );

  const handleSelectAll = useCallback(() => {
    if (!selectionEnabled || selectionMode === "single") return;
    const pageRowIds = getRowKeysForPage();
    handleSelectMultiple(pageRowIds);
  }, [
    selectionEnabled,
    selectionMode,
    getRowKeysForPage,
    handleSelectMultiple,
  ]);

  const handleDeselectAll = useCallback(() => {
    if (!selectionEnabled) return;
    const pageRowIds = getRowKeysForPage();
    handleDeselectMultiple(pageRowIds);
  }, [selectionEnabled, getRowKeysForPage, handleDeselectMultiple]);

  const handleClearSelection = useCallback(() => {
    if (!selectionEnabled) return;
    const newState = clearSelection(currentState);
    updateSelectionState(newState.selection);
  }, [selectionEnabled, currentState, updateSelectionState]);

  // Compute selection state for current page
  const pageRowIds = useMemo(() => getRowKeysForPage(), [getRowKeysForPage]);
  const selectedPageRowIds = useMemo(
    () => pageRowIds.filter((id) => selectedRowIds.has(id)),
    [pageRowIds, selectedRowIds]
  );
  const isAllSelected = useMemo(
    () =>
      selectionEnabled &&
      pageRowIds.length > 0 &&
      pageRowIds.every((id) => selectedRowIds.has(id)),
    [selectionEnabled, pageRowIds, selectedRowIds]
  );
  const isIndeterminate = useMemo(
    () =>
      selectionEnabled &&
      selectedPageRowIds.length > 0 &&
      selectedPageRowIds.length < pageRowIds.length,
    [selectionEnabled, selectedPageRowIds.length, pageRowIds.length]
  );

  // URL sync: Update URL when state changes (debounced, SSR-safe)
  const debouncedUrlUpdateRef = useRef<ReturnType<
    typeof createDebouncedFunction
  > | null>(null);

  useEffect(() => {
    if (!urlSyncEnabled || !routerAdapter.isClient()) {
      return;
    }

    // Create debounced update function on mount
    if (!debouncedUrlUpdateRef.current) {
      debouncedUrlUpdateRef.current = createDebouncedFunction(
        (state: TableState) => {
          try {
            const currentParams = routerAdapter.getSearchParams();
            const newParams = serializeStateToUrl(
              state,
              currentParams,
              urlSyncConfigRef
            );
            routerAdapter.setSearchParams(newParams, { replace: true });
          } catch (error) {
            // Silently fail if URL update fails (SSR safety)
            console.warn("Failed to update URL:", error);
          }
        },
        urlSyncConfigRef.debounceMs ?? 300
      );
    }

    // Update URL when state changes
    debouncedUrlUpdateRef.current(currentState);

    // Cleanup on unmount
    return () => {
      debouncedUrlUpdateRef.current?.cancel();
    };
  }, [urlSyncEnabled, routerAdapter, currentState, urlSyncConfigRef]);

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
      pageIndex: currentPagination.pageIndex,
      pageSize: currentPagination.pageSize,
      hasNextPage: hasNext,
      hasPreviousPage: hasPrev,
      sorting: {
        state: currentSorting,
        toggle: handleToggleSort,
        set: handleSetSort,
        clear: handleClearSort,
      },
      pagination: {
        state: currentPagination,
        nextPage: handleNextPage,
        previousPage: handlePreviousPage,
        goToPage: handleGoToPage,
        setPageSize: handleSetPageSize,
      },
      filtering: {
        state: currentFiltering,
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
      selection: {
        state: currentSelection,
        enabled: selectionEnabled,
        mode: selectionMode,
        selectedRowIds,
        selectedCount,
        isSelected: isRowSelectedHandler,
        select: handleSelectRow,
        deselect: handleDeselectRow,
        toggle: handleToggleRow,
        selectMultiple: handleSelectMultiple,
        deselectMultiple: handleDeselectMultiple,
        selectAll: handleSelectAll,
        deselectAll: handleDeselectAll,
        clear: handleClearSelection,
        isAllSelected,
        isIndeterminate,
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
      currentPagination,
      hasNext,
      hasPrev,
      currentSorting,
      handleToggleSort,
      handleSetSort,
      handleClearSort,
      handleNextPage,
      handlePreviousPage,
      handleGoToPage,
      handleSetPageSize,
      currentFiltering,
      handleSetGlobalFilter,
      handleSetColumnFilter,
      handleClearColumnFilter,
      handleClearAllFilters,
      toggleColumnVisibility,
      setColumnVisibility,
      reorderColumns,
      currentSelection,
      selectionEnabled,
      selectionMode,
      selectedRowIds,
      selectedCount,
      isRowSelectedHandler,
      handleSelectRow,
      handleDeselectRow,
      handleToggleRow,
      handleSelectMultiple,
      handleDeselectMultiple,
      handleSelectAll,
      handleDeselectAll,
      handleClearSelection,
      isAllSelected,
      isIndeterminate,
    ]
  );
}
