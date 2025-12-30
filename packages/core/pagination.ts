/**
 * Pagination functionality
 * 
 * Client-side pagination implementation.
 */

/**
 * Pagination state
 */
export interface PaginationState {
  /** Current page index (0-based) */
  pageIndex: number;
  
  /** Number of items per page */
  pageSize: number;
  
  // TODO: Add server-side pagination support
  // totalCount?: number; // For server-side mode
  // pageCount?: number; // For server-side mode
}

/**
 * Create initial pagination state
 */
export function createInitialPaginationState(
  pageSize: number = 10
): PaginationState {
  return {
    pageIndex: 0,
    pageSize,
  };
}

/**
 * Calculate total number of pages
 */
export function getPageCount(
  totalItems: number,
  pageSize: number
): number {
  if (pageSize <= 0) return 0;
  return Math.ceil(totalItems / pageSize);
}

/**
 * Get the start index of the current page
 */
export function getPageStartIndex(
  pageIndex: number,
  pageSize: number
): number {
  return pageIndex * pageSize;
}

/**
 * Get the end index of the current page (exclusive)
 */
export function getPageEndIndex(
  pageIndex: number,
  pageSize: number,
  totalItems: number
): number {
  return Math.min(getPageStartIndex(pageIndex, pageSize) + pageSize, totalItems);
}

/**
 * Check if page index is valid
 */
export function isValidPageIndex(
  pageIndex: number,
  totalPages: number
): boolean {
  return pageIndex >= 0 && pageIndex < totalPages;
}

/**
 * Clamp page index to valid range
 */
export function clampPageIndex(
  pageIndex: number,
  totalPages: number
): number {
  if (totalPages === 0) return 0;
  return Math.max(0, Math.min(pageIndex, totalPages - 1));
}

/**
 * Go to next page
 */
export function goToNextPage(
  state: PaginationState,
  totalPages: number
): PaginationState {
  const nextIndex = clampPageIndex(state.pageIndex + 1, totalPages);
  return {
    ...state,
    pageIndex: nextIndex,
  };
}

/**
 * Go to previous page
 */
export function goToPreviousPage(
  state: PaginationState,
  totalPages: number
): PaginationState {
  const prevIndex = clampPageIndex(state.pageIndex - 1, totalPages);
  return {
    ...state,
    pageIndex: prevIndex,
  };
}

/**
 * Go to specific page
 */
export function goToPage(
  state: PaginationState,
  pageIndex: number,
  totalPages: number
): PaginationState {
  return {
    ...state,
    pageIndex: clampPageIndex(pageIndex, totalPages),
  };
}

/**
 * Change page size
 */
export function setPageSize(
  state: PaginationState,
  pageSize: number,
  totalItems: number
): PaginationState {
  const totalPages = getPageCount(totalItems, pageSize);
  const clampedPageIndex = clampPageIndex(state.pageIndex, totalPages);
  
  return {
    pageIndex: clampedPageIndex,
    pageSize,
  };
}

/**
 * Get paginated slice of data
 * 
 * @param data - Full data array
 * @param pagination - Pagination state
 * @returns Paginated data slice
 */
export function getPaginatedData<T>(
  data: T[],
  pagination: PaginationState
): T[] {
  const start = getPageStartIndex(pagination.pageIndex, pagination.pageSize);
  const end = getPageEndIndex(
    pagination.pageIndex,
    pagination.pageSize,
    data.length
  );
  
  return data.slice(start, end);
}

/**
 * Check if there is a next page
 */
export function hasNextPage(
  pageIndex: number,
  totalPages: number
): boolean {
  return pageIndex < totalPages - 1;
}

/**
 * Check if there is a previous page
 */
export function hasPreviousPage(pageIndex: number): boolean {
  return pageIndex > 0;
}
