/**
 * Column definitions and utilities
 *
 * Type-safe column definition API with extensibility for:
 * - Custom JSX renderers (via renderCell, renderHeader)
 * - Grouped headers (via parentId)
 * - Metadata extension (via meta)
 */

/**
 * Filter type configuration
 *
 * TODO: Extend to support more filter types:
 * - 'number' | 'date' | 'select' | 'range'
 */
export type FilterType = "text" | "none";

/**
 * Column accessor function type
 * Extracts a value from a data item
 */
export type AccessorFn<TData, TValue> = (data: TData) => TValue;

/**
 * Column accessor - either a key path or a function
 */
export type ColumnAccessor<TData, TValue> =
  | keyof TData
  | AccessorFn<TData, TValue>;

/**
 * Base column definition
 *
 * This is the serializable part of the column definition.
 * Renderers and other runtime functions are kept separate for serialization.
 *
 * TODO: Add support for:
 * - renderCell: (value: TValue, row: TData) => React.ReactNode
 * - renderHeader: () => React.ReactNode
 * - parentId?: string (for grouped headers)
 * - meta?: Record<string, unknown> (for extensible metadata)
 */
export interface ColumnDef<TData, TValue = unknown> {
  /** Unique column identifier - must be stable */
  id: string;

  /** Column header label */
  header?: string;

  /** Whether column is sortable */
  sortable?: boolean;

  /** Filter type for this column */
  filter?: FilterType;

  /** Column width in pixels */
  width?: number;

  /** Minimum column width */
  minWidth?: number;

  /** Maximum column width */
  maxWidth?: number;

  /** Whether column is visible by default */
  visible?: boolean;

  /** Column alignment */
  align?: "left" | "center" | "right";

  /** Accessor function or key path to extract value */
  accessor?: ColumnAccessor<TData, TValue>;

  /** Custom metadata for extensibility */
  meta?: Record<string, unknown>;

  // TODO: Add grouped header support
  // parentId?: string;

  // TODO: Add custom renderers (will be separate from serializable definition)
  // renderCell?: (value: TValue, row: TData) => React.ReactNode;
  // renderHeader?: () => React.ReactNode;
}

/**
 * Runtime column representation
 * Includes the definition plus computed properties
 */
export interface Column<TData> {
  /** Column definition */
  def: ColumnDef<TData>;

  /** Column ID (stable identifier) */
  id: string;

  /** Column header label */
  header: string;

  /** Whether column is sortable */
  sortable: boolean;

  /** Filter type */
  filter: FilterType;

  /** Column width */
  width?: number;

  /** Column alignment */
  align: "left" | "center" | "right";

  /** Accessor function to extract value from data */
  accessor: AccessorFn<TData, unknown>;
}

/**
 * Column definition builder options
 */
export interface ColumnOptions<TData, TValue> {
  header?: string;
  sortable?: boolean;
  filter?: FilterType;
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  visible?: boolean;
  align?: "left" | "center" | "right";
  accessor?: ColumnAccessor<TData, TValue>;
  meta?: Record<string, unknown>;
}

/**
 * Create a column definition from a key
 *
 * @param key - Column key (must exist on TData)
 * @param options - Column configuration options
 * @returns Column definition
 */
export function col<TData, TKey extends keyof TData>(
  key: TKey,
  options?: ColumnOptions<TData, TData[TKey]>
): ColumnDef<TData, TData[TKey]> {
  return {
    id: String(key),
    header: options?.header ?? String(key),
    sortable: options?.sortable ?? false,
    filter: options?.filter ?? "none",
    width: options?.width,
    minWidth: options?.minWidth,
    maxWidth: options?.maxWidth,
    visible: options?.visible ?? true,
    align: options?.align ?? "left",
    accessor: options?.accessor ?? key,
    meta: options?.meta,
  };
}

/**
 * Create a column definition with a custom accessor
 *
 * @param id - Unique column identifier
 * @param options - Column configuration options (must include accessor)
 * @returns Column definition
 */
export function colWithAccessor<TData, TValue>(
  id: string,
  options: ColumnOptions<TData, TValue> & {
    accessor: ColumnAccessor<TData, TValue>;
  }
): ColumnDef<TData, TValue> {
  return {
    id,
    header: options.header ?? id,
    sortable: options.sortable ?? false,
    filter: options.filter ?? "none",
    width: options.width,
    minWidth: options.minWidth,
    maxWidth: options.maxWidth,
    visible: options.visible ?? true,
    align: options.align ?? "left",
    accessor: options.accessor,
    meta: options.meta,
  };
}

/**
 * Type-safe column definition array builder
 *
 * Provides type inference and validation for column definitions.
 *
 * @example
 * ```ts
 * const columns = defineColumns<User>()([
 *   col("name", { header: "Name", sortable: true }),
 *   col("email", { header: "Email", filter: "text" }),
 * ]);
 * ```
 */
export function defineColumns<TData>() {
  return <TColumns extends readonly ColumnDef<TData>[]>(
    columns: TColumns
  ): TColumns => columns;
}

/**
 * Normalize column accessor to a function
 */
export function normalizeAccessor<TData, TValue>(
  accessor: ColumnAccessor<TData, TValue>
): AccessorFn<TData, TValue> {
  if (typeof accessor === "function") {
    return accessor as AccessorFn<TData, TValue>;
  }

  // Key path accessor
  return (data: TData) => {
    return (data as Record<string, unknown>)[String(accessor)] as TValue;
  };
}

/**
 * Convert column definition to runtime column
 */
export function createColumn<TData>(def: ColumnDef<TData>): Column<TData> {
  const accessor = def.accessor
    ? normalizeAccessor(def.accessor)
    : () => undefined;

  return {
    def,
    id: def.id,
    header: def.header ?? def.id,
    sortable: def.sortable ?? false,
    filter: def.filter ?? "none",
    width: def.width,
    align: def.align ?? "left",
    accessor,
  };
}

/**
 * Convert array of column definitions to runtime columns
 */
export function createColumns<TData>(
  definitions: readonly ColumnDef<TData>[]
): Column<TData>[] {
  return definitions.map(createColumn);
}

/**
 * Get column by ID
 */
export function getColumnById<TData>(
  columns: Column<TData>[],
  id: string
): Column<TData> | undefined {
  return columns.find((col) => col.id === id);
}

/**
 * Get visible columns
 */
export function getVisibleColumns<TData>(
  columns: Column<TData>[],
  visibility: Record<string, boolean>
): Column<TData>[] {
  return columns.filter((col) => visibility[col.id] !== false);
}

/**
 * Get columns in specified order
 */
export function getOrderedColumns<TData>(
  columns: Column<TData>[],
  order: string[]
): Column<TData>[] {
  const columnMap = new Map(columns.map((col) => [col.id, col]));
  const ordered: Column<TData>[] = [];

  // Add columns in specified order
  for (const id of order) {
    const col = columnMap.get(id);
    if (col) {
      ordered.push(col);
      columnMap.delete(id);
    }
  }

  // Add any remaining columns not in order
  ordered.push(...columnMap.values());

  return ordered;
}

/**
 * Extract column IDs from definitions
 */
export function getColumnIds<TData>(
  definitions: readonly ColumnDef<TData>[]
): string[] {
  return definitions.map((def) => def.id);
}

/**
 * Validate column definitions
 * Ensures all columns have unique IDs
 */
export function validateColumns<TData>(
  definitions: readonly ColumnDef<TData>[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const ids = new Set<string>();

  for (const def of definitions) {
    if (!def.id || def.id.trim() === "") {
      errors.push(`Column definition missing required 'id' field`);
      continue;
    }

    if (ids.has(def.id)) {
      errors.push(`Duplicate column ID: ${def.id}`);
    }

    ids.add(def.id);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
