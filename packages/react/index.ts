/**
 * React package entry point
 *
 * Exports React-specific functionality for data tables.
 */

export type {
  UseDataTableOptions,
  TableInstance,
  PerStateControl,
} from "./useDataTable";
export { useDataTable } from "./useDataTable";

// URL sync utilities
export {
  parseStateFromUrl,
  serializeStateToUrl,
  createDebouncedFunction,
  createBrowserRouterAdapter,
  createNextAppRouterAdapter,
} from "../utils/urlSync";
export type {
  RouterAdapter,
  UrlSyncConfig,
  UrlParamNames,
} from "../utils/urlSync";

