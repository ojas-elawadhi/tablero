/**
 * URL state synchronization utilities
 *
 * Provides SSR-safe URL synchronization for table state (pagination, sorting, filtering).
 * Uses adapter pattern to support different routing libraries (Next.js App Router, Pages Router, etc.)
 */

import type { TableState } from "../core/tableState";
import type { SortState } from "../core/sorting";
import type { PaginationState } from "../core/pagination";
import type { FilterState } from "../core/filtering";

/**
 * URL parameter names configuration
 */
export interface UrlParamNames {
  /** Page index parameter name (default: "page") */
  page?: string;
  /** Page size parameter name (default: "pageSize") */
  pageSize?: string;
  /** Sort column parameter name (default: "sort") */
  sortColumn?: string;
  /** Sort direction parameter name (default: "sortDir") */
  sortDir?: string;
  /** Global filter parameter name (default: "q") */
  globalFilter?: string;
  /** Column filter prefix (default: "filter_") */
  columnFilterPrefix?: string;
}

/**
 * URL sync configuration
 */
export interface UrlSyncConfig {
  /** Enable URL synchronization (default: false) */
  enabled?: boolean;
  /** Custom parameter names */
  paramNames?: UrlParamNames;
  /** Debounce delay in milliseconds (default: 300) */
  debounceMs?: number;
  /** Features to sync (default: all) */
  features?: {
    pagination?: boolean;
    sorting?: boolean;
    filtering?: boolean;
  };
}

/**
 * Router adapter interface
 * Abstracts router-specific operations for SSR compatibility
 */
export interface RouterAdapter {
  /** Check if running on client */
  isClient(): boolean;
  /** Get current search params */
  getSearchParams(): URLSearchParams;
  /** Set search params */
  setSearchParams(params: URLSearchParams, options?: { replace?: boolean }): void;
}

/**
 * Default parameter names
 */
const DEFAULT_PARAM_NAMES: Required<UrlParamNames> = {
  page: "page",
  pageSize: "pageSize",
  sortColumn: "sort",
  sortDir: "sortDir",
  globalFilter: "q",
  columnFilterPrefix: "filter_",
};

/**
 * Parse pagination state from URL search params
 */
function parsePaginationFromUrl(
  params: URLSearchParams,
  paramNames: Required<UrlParamNames>
): Partial<PaginationState> {
  const pageParam = params.get(paramNames.page);
  const pageSizeParam = params.get(paramNames.pageSize);

  const pagination: Partial<PaginationState> = {};

  if (pageParam) {
    const pageIndex = parseInt(pageParam, 10);
    if (!isNaN(pageIndex) && pageIndex >= 0) {
      pagination.pageIndex = pageIndex;
    }
  }

  if (pageSizeParam) {
    const pageSize = parseInt(pageSizeParam, 10);
    if (!isNaN(pageSize) && pageSize > 0) {
      pagination.pageSize = pageSize;
    }
  }

  return pagination;
}

/**
 * Parse sorting state from URL search params
 */
function parseSortingFromUrl(
  params: URLSearchParams,
  paramNames: Required<UrlParamNames>
): Partial<SortState> {
  const columnId = params.get(paramNames.sortColumn);
  const direction = params.get(paramNames.sortDir);

  if (!columnId) {
    return {};
  }

  const validDirections = ["asc", "desc"];
  const sortDirection =
    direction && validDirections.includes(direction.toLowerCase())
      ? (direction.toLowerCase() as "asc" | "desc")
      : null;

  return {
    columnId,
    direction: sortDirection,
  };
}

/**
 * Parse filtering state from URL search params
 */
function parseFilteringFromUrl(
  params: URLSearchParams,
  paramNames: Required<UrlParamNames>
): Partial<FilterState> {
  const globalFilter = params.get(paramNames.globalFilter) || "";
  const columnFilters: Record<string, string> = {};

  // Parse column filters (filter_<columnId>=value)
  params.forEach((value, key) => {
    if (key.startsWith(paramNames.columnFilterPrefix)) {
      const columnId = key.slice(paramNames.columnFilterPrefix.length);
      if (columnId && value) {
        columnFilters[columnId] = value;
      }
    }
  });

  return {
    globalFilter,
    columnFilters: Object.keys(columnFilters).length > 0 ? columnFilters : {},
  };
}

/**
 * Parse table state from URL search params
 */
export function parseStateFromUrl(
  params: URLSearchParams,
  config: UrlSyncConfig
): Partial<TableState> {
  const paramNames = { ...DEFAULT_PARAM_NAMES, ...config.paramNames };
  const features = config.features ?? {
    pagination: true,
    sorting: true,
    filtering: true,
  };

  const state: Partial<TableState> = {};

  if (features.pagination !== false) {
    const pagination = parsePaginationFromUrl(params, paramNames);
    if (Object.keys(pagination).length > 0) {
      state.pagination = pagination as PaginationState;
    }
  }

  if (features.sorting !== false) {
    const sorting = parseSortingFromUrl(params, paramNames);
    if (Object.keys(sorting).length > 0) {
      state.sorting = sorting as SortState;
    }
  }

  if (features.filtering !== false) {
    const filtering = parseFilteringFromUrl(params, paramNames);
    if (
      filtering.globalFilter ||
      (filtering.columnFilters && Object.keys(filtering.columnFilters).length > 0)
    ) {
      state.filtering = filtering as FilterState;
    }
  }

  return state;
}

/**
 * Serialize pagination state to URL search params
 */
function serializePaginationToUrl(
  pagination: PaginationState,
  params: URLSearchParams,
  paramNames: Required<UrlParamNames>
): void {
  // Only serialize if not default values
  if (pagination.pageIndex > 0) {
    params.set(paramNames.page, String(pagination.pageIndex));
  } else {
    params.delete(paramNames.page);
  }

  if (pagination.pageSize !== 10) {
    params.set(paramNames.pageSize, String(pagination.pageSize));
  } else {
    params.delete(paramNames.pageSize);
  }
}

/**
 * Serialize sorting state to URL search params
 */
function serializeSortingToUrl(
  sorting: SortState,
  params: URLSearchParams,
  paramNames: Required<UrlParamNames>
): void {
  if (sorting.columnId) {
    params.set(paramNames.sortColumn, sorting.columnId);
    if (sorting.direction) {
      params.set(paramNames.sortDir, sorting.direction);
    } else {
      params.delete(paramNames.sortDir);
    }
  } else {
    params.delete(paramNames.sortColumn);
    params.delete(paramNames.sortDir);
  }
}

/**
 * Serialize filtering state to URL search params
 */
function serializeFilteringToUrl(
  filtering: FilterState,
  params: URLSearchParams,
  paramNames: Required<UrlParamNames>
): void {
  if (filtering.globalFilter) {
    params.set(paramNames.globalFilter, filtering.globalFilter);
  } else {
    params.delete(paramNames.globalFilter);
  }

  // Remove existing column filters
  params.forEach((_, key) => {
    if (key.startsWith(paramNames.columnFilterPrefix)) {
      params.delete(key);
    }
  });

  // Add current column filters
  if (filtering.columnFilters) {
    Object.entries(filtering.columnFilters).forEach(([columnId, value]) => {
      if (value) {
        params.set(`${paramNames.columnFilterPrefix}${columnId}`, value);
      }
    });
  }
}

/**
 * Serialize table state to URL search params
 */
export function serializeStateToUrl(
  state: TableState,
  currentParams: URLSearchParams,
  config: UrlSyncConfig
): URLSearchParams {
  const paramNames = { ...DEFAULT_PARAM_NAMES, ...config.paramNames };
  const features = config.features ?? {
    pagination: true,
    sorting: true,
    filtering: true,
  };

  // Create a copy to avoid mutating the original
  const params = new URLSearchParams(currentParams);

  if (features.pagination !== false && state.pagination) {
    serializePaginationToUrl(state.pagination, params, paramNames);
  }

  if (features.sorting !== false && state.sorting) {
    serializeSortingToUrl(state.sorting, params, paramNames);
  }

  if (features.filtering !== false && state.filtering) {
    serializeFilteringToUrl(state.filtering, params, paramNames);
  }

  return params;
}

/**
 * Create a debounced function
 */
export function createDebouncedFunction<T extends (...args: any[]) => void>(
  fn: T,
  delayMs: number
): T & { cancel: () => void } {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const debounced = ((...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = null;
    }, delayMs);
  }) as T & { cancel: () => void };

  debounced.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return debounced;
}

/**
 * Browser history API adapter
 * Works with standard browser history API (no framework required)
 */
export function createBrowserRouterAdapter(): RouterAdapter {
  return {
    isClient(): boolean {
      return typeof window !== "undefined";
    },
    getSearchParams(): URLSearchParams {
      if (typeof window === "undefined") {
        return new URLSearchParams();
      }
      return new URLSearchParams(window.location.search);
    },
    setSearchParams(params: URLSearchParams, options?: { replace?: boolean }): void {
      if (typeof window === "undefined") {
        return;
      }
      const url = new URL(window.location.href);
      url.search = params.toString();
      if (options?.replace) {
        window.history.replaceState({}, "", url);
      } else {
        window.history.pushState({}, "", url);
      }
    },
  };
}

/**
 * Next.js App Router adapter factory
 *
 * Next.js App Router's `useSearchParams()` returns a ReadonlyURLSearchParams-like object.
 * This adapter bridges it to our RouterAdapter interface.
 *
 * @example
 * ```tsx
 * import { useSearchParams, useRouter, usePathname } from 'next/navigation';
 *
 * const searchParams = useSearchParams();
 * const router = useRouter();
 * const pathname = usePathname();
 * const adapter = createNextAppRouterAdapter(searchParams, router, pathname);
 * ```
 *
 * TODO: Add Pages Router adapter
 * ```tsx
 * import { useRouter } from 'next/router';
 * const router = useRouter();
 * const adapter = createNextPagesRouterAdapter(router);
 * ```
 */
export function createNextAppRouterAdapter(
  searchParams: {
    get: (key: string) => string | null;
    getAll: (key: string) => string[];
    has: (key: string) => boolean;
    keys: () => IterableIterator<string>;
    values: () => IterableIterator<string>;
    entries: () => IterableIterator<[string, string]>;
    forEach: (callback: (value: string, key: string) => void) => void;
    toString: () => string;
  },
  router: { replace: (href: string) => void; push: (href: string) => void },
  pathname: string
): RouterAdapter {
  return {
    isClient(): boolean {
      return typeof window !== "undefined";
    },
    getSearchParams(): URLSearchParams {
      // Convert Next.js searchParams to URLSearchParams
      // Next.js searchParams is already URLSearchParams-like, but we need a mutable copy
      // Use toString() if available, otherwise iterate
      if (typeof searchParams.toString === "function") {
        return new URLSearchParams(searchParams.toString());
      }
      const params = new URLSearchParams();
      if (typeof searchParams.forEach === "function") {
        searchParams.forEach((value, key) => {
          params.set(key, value);
        });
      }
      return params;
    },
    setSearchParams(params: URLSearchParams, options?: { replace?: boolean }): void {
      const search = params.toString();
      const href = search ? `${pathname}?${search}` : pathname;
      if (options?.replace) {
        router.replace(href);
      } else {
        router.push(href);
      }
    },
  };
}

