/**
 * Table state management
 *
 * Core state shape and management utilities for data tables.
 * Supports both controlled and uncontrolled state patterns.
 */

import type { SortState } from "./sorting";
import type { PaginationState } from "./pagination";
import type { FilterState } from "./filtering";

/**
 * Server mode configuration
 * Controls which features are handled server-side vs client-side
 */
export interface ServerMode {
  /** Enable server-side pagination (default: false) */
  pagination?: boolean;

  /** Enable server-side sorting (default: false) */
  sorting?: boolean;

  /** Enable server-side filtering (default: false) */
  filtering?: boolean;
}

/**
 * Selection state
 * Tracks selected row IDs (using stable row keys)
 */
export interface SelectionState {
  /** Set of selected row IDs */
  selectedRowIds: Set<string | number>;

  // TODO: Add cross-page selection support
  // allPagesSelected?: boolean;
  // selectedPageIds?: Set<number>;
}

/**
 * Selection mode
 */
export type SelectionMode = "single" | "multi";

/**
 * Selection configuration
 */
export interface SelectionConfig {
  /** Enable row selection (default: false) */
  enabled?: boolean;

  /** Selection mode: single or multi (default: "multi") */
  mode?: SelectionMode;

  /** Initial selected row IDs */
  initialSelectedRowIds?: (string | number)[];
}

/**
 * Core table state interface
 *
 * Designed to be extensible for:
 * - Server-side mode (via serverMode configuration)
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

  /** Selection state - tracks selected row IDs */
  selection: SelectionState;

  /** Server mode configuration - controls which features are server-side */
  serverMode?: ServerMode;

  // TODO: Add URL sync support
  // syncToUrl?: boolean;
}

/**
 * Create initial selection state
 */
export function createInitialSelectionState(
  initialSelectedRowIds?: (string | number)[]
): SelectionState {
  return {
    selectedRowIds: new Set(initialSelectedRowIds || []),
  };
}

/**
 * Initial table state with defaults
 */
export function createInitialTableState(
  columnIds: string[],
  serverMode?: ServerMode,
  initialSelectedRowIds?: (string | number)[]
): TableState {
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
      globalFilter: "",
      columnFilters: {},
    },
    columnVisibility: columnIds.reduce((acc, id) => {
      acc[id] = true;
      return acc;
    }, {} as Record<string, boolean>),
    columnOrder: [...columnIds],
    selection: createInitialSelectionState(initialSelectedRowIds),
    serverMode,
  };
}

/**
 * Check if a feature is in server mode
 */
export function isServerMode(
  serverMode: ServerMode | undefined,
  feature: keyof ServerMode
): boolean {
  return serverMode?.[feature] === true;
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
 * Update selection state
 */
export function updateSelection(
  state: TableState,
  selection: SelectionState
): TableState {
  return updateTableState(state, { selection });
}

/**
 * Select a row by ID
 */
export function selectRow(
  state: TableState,
  rowId: string | number
): TableState {
  const newSelection = {
    ...state.selection,
    selectedRowIds: new Set(state.selection.selectedRowIds),
  };
  newSelection.selectedRowIds.add(rowId);
  return updateSelection(state, newSelection);
}

/**
 * Deselect a row by ID
 */
export function deselectRow(
  state: TableState,
  rowId: string | number
): TableState {
  const newSelection = {
    ...state.selection,
    selectedRowIds: new Set(state.selection.selectedRowIds),
  };
  newSelection.selectedRowIds.delete(rowId);
  return updateSelection(state, newSelection);
}

/**
 * Toggle row selection
 */
export function toggleRowSelection(
  state: TableState,
  rowId: string | number
): TableState {
  if (state.selection.selectedRowIds.has(rowId)) {
    return deselectRow(state, rowId);
  }
  return selectRow(state, rowId);
}

/**
 * Select multiple rows
 */
export function selectRows(
  state: TableState,
  rowIds: (string | number)[]
): TableState {
  const newSelection = {
    ...state.selection,
    selectedRowIds: new Set(state.selection.selectedRowIds),
  };
  rowIds.forEach((id) => newSelection.selectedRowIds.add(id));
  return updateSelection(state, newSelection);
}

/**
 * Deselect multiple rows
 */
export function deselectRows(
  state: TableState,
  rowIds: (string | number)[]
): TableState {
  const newSelection = {
    ...state.selection,
    selectedRowIds: new Set(state.selection.selectedRowIds),
  };
  rowIds.forEach((id) => newSelection.selectedRowIds.delete(id));
  return updateSelection(state, newSelection);
}

/**
 * Clear all selections
 */
export function clearSelection(state: TableState): TableState {
  return updateSelection(state, createInitialSelectionState());
}

/**
 * Check if a row is selected
 */
export function isRowSelected(
  state: TableState,
  rowId: string | number
): boolean {
  return state.selection.selectedRowIds.has(rowId);
}

/**
 * Get selected row count
 */
export function getSelectedRowCount(state: TableState): number {
  return state.selection.selectedRowIds.size;
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
  return "state" in handler && "setState" in handler;
}
