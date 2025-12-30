/**
 * Table state management
 * 
 * Core state shape and management utilities for data tables.
 * Supports both controlled and uncontrolled state patterns.
 */

import type { SortState } from './sorting';
import type { PaginationState } from './pagination';
import type { FilterState } from './filtering';

/**
 * Core table state interface
 * 
 * Designed to be extensible for:
 * - Server-side mode (via mode: 'server' | 'client')
 * - Multi-sort (sorting can be extended to array)
 * - URL sync (state can be serialized/deserialized)
 */
export interface TableState {
  /** Sorting state - single column for now, extensible to array for multi-sort */
  sorting: SortState;
  
  /** Pagination state */
  pagination: PaginationState;
  
  /** Filtering state */
  filtering: FilterState;
  
  /** Column visibility state - maps column ID to visibility */
  columnVisibility: Record<string, boolean>;
  
  /** Column order - array of column IDs */
  columnOrder: string[];
  
  // TODO: Add server-side mode support
  // mode?: 'client' | 'server';
  
  // TODO: Add URL sync support
  // syncToUrl?: boolean;
}

/**
 * Initial table state with defaults
 */
export function createInitialTableState(columnIds: string[]): TableState {
  return {
    sorting: {
      columnId: null,
      direction: null,
    },
    pagination: {
      pageIndex: 0,
      pageSize: 10,
    },
    filtering: {
      globalFilter: '',
      columnFilters: {},
    },
    columnVisibility: columnIds.reduce((acc, id) => {
      acc[id] = true;
      return acc;
    }, {} as Record<string, boolean>),
    columnOrder: [...columnIds],
  };
}

/**
 * Update table state immutably
 * Returns a new state object with the update applied
 */
export function updateTableState<T extends TableState>(
  state: T,
  updates: Partial<TableState>
): T {
  return {
    ...state,
    ...updates,
  };
}

/**
 * Update sorting state
 */
export function updateSorting(
  state: TableState,
  sorting: SortState
): TableState {
  return updateTableState(state, { sorting });
}

/**
 * Update pagination state
 */
export function updatePagination(
  state: TableState,
  pagination: Partial<PaginationState>
): TableState {
  return updateTableState(state, {
    pagination: {
      ...state.pagination,
      ...pagination,
    },
  });
}

/**
 * Update filtering state
 */
export function updateFiltering(
  state: TableState,
  filtering: Partial<FilterState>
): TableState {
  return updateTableState(state, {
    filtering: {
      ...state.filtering,
      ...filtering,
    },
  });
}

/**
 * Update column visibility
 */
export function updateColumnVisibility(
  state: TableState,
  columnId: string,
  visible: boolean
): TableState {
  return updateTableState(state, {
    columnVisibility: {
      ...state.columnVisibility,
      [columnId]: visible,
    },
  });
}

/**
 * Update column order
 */
export function updateColumnOrder(
  state: TableState,
  columnOrder: string[]
): TableState {
  return updateTableState(state, { columnOrder });
}

/**
 * Controlled state handler type
 * Used when state is managed externally
 */
export type TableStateHandler = {
  state: TableState;
  setState: (state: TableState | ((prev: TableState) => TableState)) => void;
};

/**
 * Uncontrolled state handler type
 * Used when state is managed internally
 */
export type UncontrolledTableState = {
  initialState?: Partial<TableState>;
  onStateChange?: (state: TableState) => void;
};

/**
 * Check if state is controlled
 */
export function isControlledState(
  handler: TableStateHandler | UncontrolledTableState
): handler is TableStateHandler {
  return 'state' in handler && 'setState' in handler;
}
