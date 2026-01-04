/**
 * Filtering functionality
 *
 * Basic text filtering implementation, extensible to advanced filtering.
 */

/**
 * Filter state
 *
 * TODO: Extend to support:
 * - Advanced filter types (number range, date range, etc.)
 * - Filter operators (equals, contains, greater than, etc.)
 * - Column-specific filter configurations
 */
export interface FilterState {
  /** Global text filter applied across all columns */
  globalFilter: string;

  /** Column-specific filters - maps column ID to filter value */
  columnFilters: Record<string, string>;

  // TODO: Add filter operators
  // filterOperators?: Record<string, FilterOperator>;

  // TODO: Add filter mode (AND/OR)
  // filterMode?: 'and' | 'or';
}

/**
 * Create initial filter state
 */
export function createInitialFilterState(): FilterState {
  return {
    globalFilter: "",
    columnFilters: {},
  };
}

/**
 * Set global filter
 */
export function setGlobalFilter(filter: string): FilterState {
  return {
    globalFilter: filter,
    columnFilters: {},
  };
}

/**
 * Set column filter
 */
export function setColumnFilter(
  state: FilterState,
  columnId: string,
  filter: string
): FilterState {
  return {
    ...state,
    columnFilters: {
      ...state.columnFilters,
      [columnId]: filter,
    },
  };
}

/**
 * Clear column filter
 */
export function clearColumnFilter(
  state: FilterState,
  columnId: string
): FilterState {
  const { [columnId]: _, ...restFilters } = state.columnFilters;
  return {
    ...state,
    columnFilters: restFilters,
  };
}

/**
 * Clear all filters
 */
export function clearAllFilters(): FilterState {
  return createInitialFilterState();
}

/**
 * Check if any filter is active
 */
export function isFilterActive(state: FilterState): boolean {
  return (
    state.globalFilter.trim() !== "" ||
    Object.values(state.columnFilters).some((filter) => filter.trim() !== "")
  );
}

/**
 * Value matcher function type
 */
export type MatchFn = (value: unknown, filter: string) => boolean;

/**
 * Default text matcher - case-insensitive substring match
 */
export function defaultMatch(value: unknown, filter: string): boolean {
  if (!filter.trim()) return true;

  const normalizedFilter = filter.toLowerCase().trim();
  const normalizedValue = String(value ?? "").toLowerCase();

  return normalizedValue.includes(normalizedFilter);
}

/**
 * Apply filters to data array
 *
 * @param data - Array of data items
 * @param filterState - Current filter state
 * @param getValue - Function to extract value from data item for a column
 * @param matchFn - Optional custom matcher function
 * @param serverMode - If true, returns data unchanged (server handles filtering)
 * @returns Filtered data array (immutable)
 */
export function applyFilters<T>(
  data: T[],
  filterState: FilterState,
  getValue: (item: T, columnId: string) => unknown,
  matchFn: MatchFn = defaultMatch,
  serverMode?: boolean
): T[] {
  // In server mode, don't apply filtering locally
  if (serverMode === true) {
    return [...data];
  }

  if (!isFilterActive(filterState)) {
    return [...data];
  }

  return data.filter((item) => {
    // Apply global filter - checks all columns
    if (filterState.globalFilter.trim()) {
      const matchesGlobal =
        Object.keys(filterState.columnFilters).length === 0
          ? // If no column filters, check all columns for global filter
            Object.values(item as Record<string, unknown>).some((value) =>
              matchFn(value, filterState.globalFilter)
            )
          : // If column filters exist, global filter is ignored (TODO: make configurable)
            true;

      if (!matchesGlobal) return false;
    }

    // Apply column-specific filters
    for (const [columnId, filterValue] of Object.entries(
      filterState.columnFilters
    )) {
      if (filterValue.trim()) {
        const value = getValue(item, columnId);
        if (!matchFn(value, filterValue)) {
          return false;
        }
      }
    }

    return true;
  });
}

/**
 * Get active filter count
 */
export function getActiveFilterCount(state: FilterState): number {
  let count = 0;

  if (state.globalFilter.trim()) {
    count++;
  }

  count += Object.values(state.columnFilters).filter(
    (f) => f.trim() !== ""
  ).length;

  return count;
}
