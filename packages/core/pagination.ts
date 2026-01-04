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

  /** Total count of items (for server-side mode) */
  totalCount?: number;

  /** Total number of pages (for server-side mode, calculated from totalCount if provided) */
  pageCount?: number;

  // TODO: Add cursor-based pagination support
  // cursor?: string;
  // nextCursor?: string;
  // previousCursor?: string;
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
 *
 * @param totalItems - Total number of items (client-side) or totalCount (server-side)
 * @param pageSize - Number of items per page
 * @param serverPageCount - Pre-calculated page count from server (optional)
 * @returns Total number of pages
 */
export function getPageCount(
  totalItems: number,
  pageSize: number,
  serverPageCount?: number
): number {
  // Use server-provided page count if available
  if (serverPageCount !== undefined) {
    return serverPageCount;
  }

  // Calculate from total items
  if (pageSize <= 0) return 0;
  return Math.ceil(totalItems / pageSize);
}

/**
 * Get the start index of the current page
 */
export function getPageStartIndex(pageIndex: number, pageSize: number): number {
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
  return Math.min(
    getPageStartIndex(pageIndex, pageSize) + pageSize,
    totalItems
  );
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
export function clampPageIndex(pageIndex: number, totalPages: number): number {
  if (totalPages === 0) return 0;
  return Math.max(0, Math.min(pageIndex, totalPages - 1));
}

/**
 * Get total pages from pagination state
 * Uses server-provided pageCount if available, otherwise calculates from totalCount or data length
 */
export function getTotalPages(
  pagination: PaginationState,
  dataLength?: number
): number {
  // Use server-provided pageCount if available
  if (pagination.pageCount !== undefined) {
    return pagination.pageCount;
  }

  // Use server-provided totalCount if available
  if (pagination.totalCount !== undefined) {
    return getPageCount(pagination.totalCount, pagination.pageSize);
  }

  // Fall back to data length (client-side)
  if (dataLength !== undefined) {
    return getPageCount(dataLength, pagination.pageSize);
  }

  return 0;
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
 *
 * @param state - Current pagination state
 * @param pageSize - New page size
 * @param totalItems - Total items (for client-side) or use state.totalCount/pageCount (for server-side)
 * @returns Updated pagination state
 */
export function setPageSize(
  state: PaginationState,
  pageSize: number,
  totalItems?: number
): PaginationState {
  // Calculate total pages
  const totalPages =
    state.pageCount !== undefined
      ? state.pageCount // Use server-provided pageCount
      : state.totalCount !== undefined
      ? getPageCount(state.totalCount, pageSize) // Calculate from server totalCount
      : totalItems !== undefined
      ? getPageCount(totalItems, pageSize) // Calculate from client data length
      : 0;

  const clampedPageIndex = clampPageIndex(state.pageIndex, totalPages);

  return {
    ...state,
    pageIndex: clampedPageIndex,
    pageSize,
  };
}

/**
 * Get paginated slice of data
 *
 * @param data - Full data array (or current page data in server mode)
 * @param pagination - Pagination state
 * @param serverMode - If true, returns data unchanged (server handles pagination)
 * @returns Paginated data slice (or original data in server mode)
 */
export function getPaginatedData<T>(
  data: T[],
  pagination: PaginationState,
  serverMode?: boolean
): T[] {
  // In server mode, data is already paginated by the server
  if (serverMode === true) {
    return [...data];
  }

  // Client-side pagination
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
export function hasNextPage(pageIndex: number, totalPages: number): boolean {
  return pageIndex < totalPages - 1;
}

/**
 * Check if there is a previous page
 */
export function hasPreviousPage(pageIndex: number): boolean {
  return pageIndex > 0;
}
