/**
 * Core package entry point
 * 
 * Exports all core functionality for data table state management.
 */

// Table state
export type {
  TableState,
  TableStateHandler,
  UncontrolledTableState,
} from './tableState';
export {
  createInitialTableState,
  updateTableState,
  updateSorting,
  updatePagination,
  updateFiltering,
  updateColumnVisibility,
  updateColumnOrder,
  isControlledState,
} from './tableState';

// Sorting
export type {
  SortState,
  SortDirection,
  CompareFn,
} from './sorting';
export {
  createInitialSortState,
  toggleSort,
  setSort,
  clearSort,
  isSortActive,
  defaultCompare,
  createComparator,
  applySort,
} from './sorting';

// Pagination
export type {
  PaginationState,
} from './pagination';
export {
  createInitialPaginationState,
  getPageCount,
  getPageStartIndex,
  getPageEndIndex,
  isValidPageIndex,
  clampPageIndex,
  goToNextPage,
  goToPreviousPage,
  goToPage,
  setPageSize,
  getPaginatedData,
  hasNextPage,
  hasPreviousPage,
} from './pagination';

// Filtering
export type {
  FilterState,
  MatchFn,
} from './filtering';
export {
  createInitialFilterState,
  setGlobalFilter,
  setColumnFilter,
  clearColumnFilter,
  clearAllFilters,
  isFilterActive,
  defaultMatch,
  applyFilters,
  getActiveFilterCount,
} from './filtering';

// Columns
export type {
  ColumnDef,
  Column,
  ColumnOptions,
  ColumnAccessor,
  AccessorFn,
  FilterType,
} from './columns';
export {
  col,
  colWithAccessor,
  defineColumns,
  normalizeAccessor,
  createColumn,
  createColumns,
  getColumnById,
  getVisibleColumns,
  getOrderedColumns,
  getColumnIds,
  validateColumns,
} from './columns';
