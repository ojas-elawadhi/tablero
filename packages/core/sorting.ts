/**
 * Sorting functionality
 *
 * Single-column sorting implementation, extensible to multi-column sorting.
 */

/**
 * Sort direction type
 */
export type SortDirection = "asc" | "desc" | null;

/**
 * Sort state for single-column sorting
 *
 * TODO: Extend to multi-column sorting:
 * - Change to: sorting: Array<{ columnId: string; direction: 'asc' | 'desc' }>
 * - Add priority/order for multi-sort
 */
export interface SortState {
  /** Column ID to sort by, null if no sorting */
  columnId: string | null;

  /** Sort direction, null if no sorting */
  direction: SortDirection;
}

/**
 * Create initial sort state
 */
export function createInitialSortState(): SortState {
  return {
    columnId: null,
    direction: null,
  };
}

/**
 * Toggle sort state for a column
 * Cycles through: none -> asc -> desc -> none
 */
export function toggleSort(
  currentState: SortState,
  columnId: string
): SortState {
  if (currentState.columnId === columnId) {
    // Same column - cycle direction
    if (currentState.direction === "asc") {
      return { columnId, direction: "desc" };
    }
    if (currentState.direction === "desc") {
      return { columnId: null, direction: null };
    }
  }

  // New column or no current sort - start with ascending
  return { columnId, direction: "asc" };
}

/**
 * Set sort state explicitly
 */
export function setSort(
  columnId: string | null,
  direction: SortDirection
): SortState {
  return {
    columnId,
    direction,
  };
}

/**
 * Clear sort state
 */
export function clearSort(): SortState {
  return createInitialSortState();
}

/**
 * Type guard to check if sorting is active
 */
export function isSortActive(state: SortState): boolean {
  return state.columnId !== null && state.direction !== null;
}

/**
 * Value comparator function type
 */
export type CompareFn<T = unknown> = (a: T, b: T) => number;

/**
 * Default comparator for primitive values
 */
export function defaultCompare(a: unknown, b: unknown): number {
  if (a === b) return 0;
  if (a === null || a === undefined) return 1;
  if (b === null || b === undefined) return -1;

  if (typeof a === "number" && typeof b === "number") {
    return a - b;
  }

  if (typeof a === "string" && typeof b === "string") {
    return a.localeCompare(b);
  }

  if (a instanceof Date && b instanceof Date) {
    return a.getTime() - b.getTime();
  }

  // Fallback to string comparison
  return String(a).localeCompare(String(b));
}

/**
 * Create a sorted comparator function
 */
export function createComparator<T>(
  direction: "asc" | "desc",
  compareFn: CompareFn<T> = defaultCompare as CompareFn<T>
): CompareFn<T> {
  return (a: T, b: T) => {
    const result = compareFn(a, b);
    return direction === "asc" ? result : -result;
  };
}

/**
 * Sort data array based on sort state
 *
 * @param data - Array of data items
 * @param sortState - Current sort state
 * @param getValue - Function to extract value from data item for the sorted column
 * @param compareFn - Optional custom comparator function
 * @param serverMode - If true, returns data unchanged (server handles sorting)
 * @returns New sorted array (immutable)
 */
export function applySort<T>(
  data: T[],
  sortState: SortState,
  getValue: (item: T, columnId: string) => unknown,
  compareFn?: CompareFn<unknown>,
  serverMode?: boolean
): T[] {
  // In server mode, don't apply sorting locally
  if (serverMode === true) {
    return [...data];
  }

  if (!isSortActive(sortState) || !sortState.columnId) {
    return [...data];
  }

  const comparator = createComparator(
    sortState.direction!,
    compareFn || defaultCompare
  );

  return [...data].sort((a, b) => {
    const valueA = getValue(a, sortState.columnId!);
    const valueB = getValue(b, sortState.columnId!);
    return comparator(valueA, valueB);
  });
}
