# tablero

A type-safe, framework-agnostic data table library with React bindings. Built with TypeScript for maximum type safety and developer experience.

## Features

- 🎯 **Type-safe** - Full TypeScript support with excellent type inference
- 🔄 **Framework-agnostic core** - Use the core logic with any framework
- ⚛️ **React hooks** - `useDataTable` hook for easy React integration
- 🎨 **Customizable UI** - Flexible, CSS-variable based styling
- 📊 **Sorting** - Single-column sorting (extensible to multi-column)
- 📄 **Pagination** - Client-side and server-side pagination support
- 🔍 **Filtering** - Global and column-specific text filtering
- ✅ **Row Selection** - Single and multi-select with select all support
- 🌐 **URL Sync** - Synchronize table state with URL search params
- 🖥️ **Server-side Mode** - Delegate sorting, filtering, and pagination to server
- 📌 **Sticky headers & columns** - Keep headers and first column visible while scrolling
- 🔧 **Column resizing** - Resize columns with pointer-based interaction
- 👁️ **Column visibility** - Show/hide columns dynamically
- 🔀 **Column reordering** - Reorder columns programmatically
- 🎭 **Custom renderers** - Customize cell, header, and row rendering
- ♿ **Accessible** - ARIA attributes and keyboard support
- 🎛️ **Controlled/Uncontrolled** - Flexible state management patterns

## Installation

```bash
npm install tablero
# or
pnpm add tablero
# or
yarn add tablero
```

## Quick Start

### Basic React Example

```tsx
import { useDataTable } from "tablero/react";
import { DataTable } from "tablero/ui";
import { defineColumns, col } from "tablero/core";

interface User {
  id: number;
  name: string;
  email: string;
  age: number;
}

const columns = defineColumns<User>()([
  col("name", { header: "Name", sortable: true }),
  col("email", { header: "Email", sortable: true, filter: "text" }),
  col("age", { header: "Age", sortable: true }),
]);

function MyTable() {
  const table = useDataTable({
    data: users,
    columns,
    pageSize: 10,
  });

  return (
    <DataTable
      table={table}
      stickyHeader
      bordered
      maxHeight={400}
      getRowKey={(row) => row.id}
    />
  );
}
```

## Packages

This library is organized into three packages:

- **`tablero/core`** - Framework-agnostic core logic (state management, sorting, filtering, pagination)
- **`tablero/react`** - React hooks (`useDataTable`) and URL sync utilities
- **`tablero/ui`** - React UI components (`DataTable`, `TableHeader`, `TableBody`, `TableCell`)

## Column Definitions

### Basic Column Definition

```tsx
import { defineColumns, col } from "tablero/core";

const columns = defineColumns<User>()([
  col("name", {
    header: "Name",
    sortable: true,
    filter: "text",
    width: 200,
    align: "left", // "left" | "center" | "right"
  }),
]);
```

### Column Options

- `header` - Column header text
- `sortable` - Enable sorting for this column
- `filter` - Filter type: `"text"` | `"none"` (default: `"none"`)
- `width` - Column width in pixels
- `minWidth` - Minimum column width
- `maxWidth` - Maximum column width
- `align` - Text alignment: `"left"` | `"center"` | `"right"`

### Custom Accessor

```tsx
import { colWithAccessor } from "tablero/core";

colWithAccessor("fullName", (user) => `${user.firstName} ${user.lastName}`, {
  header: "Full Name",
  sortable: true,
});
```

## Sorting

### Basic Sorting

```tsx
const table = useDataTable({
  data: users,
  columns,
});

// Access sort state
table.sorting.state; // { columnId: string | null, direction: "asc" | "desc" | null }

// Sort handlers
table.sorting.toggle("name"); // Toggle sort for column
table.sorting.set("name", "asc"); // Set explicit sort
table.sorting.clear(); // Clear sorting
```

### Initial Sort State

```tsx
const table = useDataTable({
  data: users,
  columns,
  state: {
    sorting: { columnId: "name", direction: "asc" },
  },
});
```

## Filtering

### Global Filter

```tsx
const table = useDataTable({
  data: users,
  columns,
});

// Set global filter
table.filtering.setGlobalFilter("search term");

// Access filter state
table.filtering.state.globalFilter; // string
```

### Column Filters

```tsx
// Set column-specific filter
table.filtering.setColumnFilter("email", "example.com");

// Clear column filter
table.filtering.clearColumnFilter("email");

// Clear all filters
table.filtering.clearAllFilters();

// Access filter state
table.filtering.state.columnFilters; // Record<string, string>
```

### Filtering Example

```tsx
function FilteredTable() {
  const table = useDataTable({
    data: users,
    columns,
  });

  return (
    <div>
      <input
        type="text"
        value={table.filtering.state.globalFilter}
        onChange={(e) => table.filtering.setGlobalFilter(e.target.value)}
        placeholder="Search all columns..."
      />
      <DataTable table={table} />
    </div>
  );
}
```

## Pagination

### Basic Pagination

```tsx
const table = useDataTable({
  data: users,
  columns,
  pageSize: 10, // Default: 10
});

// Access pagination state
table.pageIndex; // Current page (0-based)
table.pageSize; // Items per page
table.pageCount; // Total pages
table.hasNextPage; // boolean
table.hasPreviousPage; // boolean

// Pagination handlers
table.pagination.nextPage();
table.pagination.previousPage();
table.pagination.goToPage(2);
table.pagination.setPageSize(20);
```

### Pagination Controls Example

```tsx
<div>
  <button
    onClick={() => table.pagination.previousPage()}
    disabled={!table.hasPreviousPage}
  >
    Previous
  </button>
  <span>
    Page {table.pageIndex + 1} of {table.pageCount}
  </span>
  <button
    onClick={() => table.pagination.nextPage()}
    disabled={!table.hasNextPage}
  >
    Next
  </button>
  <select
    value={table.pageSize}
    onChange={(e) => table.pagination.setPageSize(Number(e.target.value))}
  >
    <option value={10}>10 per page</option>
    <option value={20}>20 per page</option>
    <option value={50}>50 per page</option>
  </select>
</div>
```

## Row Selection

### Basic Selection

```tsx
const table = useDataTable({
  data: users,
  columns,
  getRowKey: (row) => row.id, // Required for selection
  selection: {
    enabled: true,
    mode: "multi", // or "single"
  },
});

// Access selection state
table.selection.selectedRowIds; // Set<string | number>
table.selection.selectedCount; // number
table.selection.isAllSelected; // boolean (all rows on current page)
table.selection.isIndeterminate; // boolean (some rows selected)

// Selection handlers
table.selection.select(rowId);
table.selection.deselect(rowId);
table.selection.toggle(rowId);
table.selection.selectAll(); // Select all rows on current page
table.selection.deselectAll(); // Deselect all rows on current page
table.selection.clear(); // Clear all selections
```

### Selection Example

```tsx
function SelectableTable() {
  const table = useDataTable({
    data: users,
    columns,
    getRowKey: (row) => row.id,
    selection: {
      enabled: true,
      mode: "multi",
    },
  });

  return (
    <div>
      <p>Selected: {table.selection.selectedCount} rows</p>
      <DataTable table={table} />
      {table.selection.selectedCount > 0 && (
        <button onClick={() => table.selection.clear()}>Clear Selection</button>
      )}
    </div>
  );
}
```

## Server-Side Mode

When using server-side data fetching, disable client-side transformations:

```tsx
const table = useDataTable({
  data: apiResponse, // Data already filtered/sorted/paginated by server
  columns,
  serverMode: {
    pagination: true, // Server handles pagination
    sorting: true, // Server handles sorting
    filtering: true, // Server handles filtering
  },
});
```

### Server-Side with Controlled State

```tsx
function ServerSideTable() {
  const [tableState, setTableState] = useState({
    pagination: { pageIndex: 0, pageSize: 10 },
    sorting: { columnId: null, direction: null },
    filtering: { globalFilter: "", columnFilters: {} },
  });

  const table = useDataTable({
    data: apiData,
    columns,
    serverMode: {
      pagination: true,
      sorting: true,
      filtering: true,
    },
    state: {
      pagination: tableState.pagination,
      sorting: tableState.sorting,
      filtering: tableState.filtering,
      onStateChange: (updates) => {
        setTableState((prev) => ({ ...prev, ...updates }));
        // Fetch new data from API with updated state
        fetchData(updates);
      },
    },
  });

  return <DataTable table={table} />;
}
```

## URL Synchronization

### Basic URL Sync (Browser History API)

```tsx
const table = useDataTable({
  data: users,
  columns,
  urlSync: {
    enabled: true,
    features: {
      pagination: true,
      sorting: true,
      filtering: true,
    },
    debounceMs: 300, // Optional: debounce URL updates
  },
});
```

### Next.js App Router

```tsx
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useDataTable, createNextAppRouterAdapter } from "tablero/react";

function NextJsTable() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const table = useDataTable({
    data: users,
    columns,
    urlSync: {
      enabled: true,
      routerAdapter: createNextAppRouterAdapter(searchParams, router, pathname),
      paramNames: {
        page: "p",
        sortColumn: "sort",
        sortDir: "dir",
        globalFilter: "q",
      },
    },
  });

  return <DataTable table={table} />;
}
```

### Custom Parameter Names

```tsx
urlSync: {
  enabled: true,
  paramNames: {
    page: "page",
    pageSize: "size",
    sortColumn: "sort",
    sortDir: "direction",
    globalFilter: "search",
    columnFilterPrefix: "filter_",
  },
}
```

### URL Format

The URL will look like:

```
?page=1&pageSize=10&sort=name&sortDir=asc&q=search&filter_email=example.com
```

## Column Management

### Column Visibility

```tsx
// Toggle column visibility
table.columnManagement.toggleVisibility("email");

// Set column visibility
table.columnManagement.setVisibility("email", false);

// Access visibility state
table.state.columnVisibility; // Record<string, boolean>
```

### Column Reordering

```tsx
// Reorder columns
table.columnManagement.reorder(["name", "email", "age"]);

// Access column order
table.state.columnOrder; // string[]
```

## Custom Renderers

### Custom Cell Renderer

```tsx
<DataTable
  table={table}
  renderCell={(value, row, column) => {
    if (column.id === "active") {
      return <span>{value ? "✓" : "✗"}</span>;
    }
    return <span>{value}</span>;
  }}
/>
```

### Custom Header Renderer

```tsx
<DataTable
  table={table}
  renderHeader={(column, sortState) => {
    return (
      <div>
        {column.header}
        {sortState.columnId === column.id && (
          <span>{sortState.direction === "asc" ? "↑" : "↓"}</span>
        )}
      </div>
    );
  }}
/>
```

### Custom Row Renderer

```tsx
<DataTable
  table={table}
  renderRow={(row, index, cells) => {
    return <tr className={row.active ? "active-row" : ""}>{cells}</tr>;
  }}
/>
```

## UI Features

### Sticky Header

```tsx
<DataTable table={table} stickyHeader maxHeight={400} />
```

### Sticky First Column

```tsx
<DataTable table={table} stickyFirstColumn />
```

### Column Resizing

```tsx
<DataTable table={table} enableResizing />
```

### Borders

```tsx
<DataTable
  table={table}
  bordered // Default: true
/>
```

### Loading and Error States

```tsx
<DataTable
  table={table}
  isLoading={loading}
  error={error}
  slots={{
    loader: () => <div>Loading...</div>,
    empty: ({ columns }) => <div>No data available</div>,
    error: ({ error }) => <div>Error: {error}</div>,
  }}
/>
```

## State Management

### Uncontrolled (Default)

```tsx
const table = useDataTable({
  data: users,
  columns,
});
// All state managed internally
```

### Fully Controlled

```tsx
const [tableState, setTableState] = useState(
  createInitialTableState(columnIds)
);

const table = useDataTable({
  data: users,
  columns,
  state: {
    state: tableState,
    setState: setTableState,
  },
});
```

### Per-State Control

```tsx
const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
const [sorting, setSorting] = useState({ columnId: null, direction: null });

const table = useDataTable({
  data: users,
  columns,
  state: {
    pagination,
    sorting,
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
  },
});
```

## API Reference

### `useDataTable` Hook

```tsx
interface UseDataTableOptions<TData> {
  data: TData[];
  columns: readonly ColumnDef<TData>[];
  pageSize?: number;
  state?: TableStateHandler | UncontrolledTableState | PerStateControl;
  serverMode?: {
    pagination?: boolean;
    sorting?: boolean;
    filtering?: boolean;
  };
  selection?: {
    enabled?: boolean;
    mode?: "single" | "multi";
    initialSelectedRowIds?: (string | number)[];
  };
  getRowKey?: (row: TData, index: number) => string | number;
  urlSync?: {
    enabled?: boolean;
    paramNames?: UrlParamNames;
    debounceMs?: number;
    features?: {
      pagination?: boolean;
      sorting?: boolean;
      filtering?: boolean;
    };
    routerAdapter?: RouterAdapter;
  };
}
```

### `DataTable` Component

```tsx
interface DataTableProps<TData> {
  table: TableInstance<TData>;
  slots?: {
    loader?: React.ComponentType;
    empty?: React.ComponentType<{ columns: Column<TData>[] }>;
    error?: React.ComponentType<{ error: Error | string }>;
  };
  renderCell?: (
    value: unknown,
    row: TData,
    column: Column<TData>
  ) => React.ReactNode;
  renderHeader?: (
    column: Column<TData>,
    sortState: SortState
  ) => React.ReactNode;
  renderRow?: (
    row: TData,
    index: number,
    cells: React.ReactNode[]
  ) => React.ReactNode;
  getRowKey?: (row: TData, index: number) => string | number;
  stickyHeader?: boolean;
  stickyFirstColumn?: boolean;
  enableResizing?: boolean;
  maxHeight?: number | string;
  bordered?: boolean;
  className?: string;
  isLoading?: boolean;
  error?: Error | string | null;
}
```

### `TableInstance` API

```tsx
interface TableInstance<TData> {
  // State
  state: TableState;
  columns: Column<TData>[];
  visibleColumns: Column<TData>[];

  // Data
  data: TData[];
  filteredData: TData[];
  sortedData: TData[];
  paginatedData: TData[];

  // Pagination
  pageIndex: number;
  pageSize: number;
  pageCount: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;

  // Handlers
  sorting: {
    state: SortState;
    toggle: (columnId: string) => void;
    set: (columnId: string | null, direction: "asc" | "desc" | null) => void;
    clear: () => void;
  };

  pagination: {
    state: PaginationState;
    nextPage: () => void;
    previousPage: () => void;
    goToPage: (pageIndex: number) => void;
    setPageSize: (pageSize: number) => void;
  };

  filtering: {
    state: FilterState;
    setGlobalFilter: (filter: string) => void;
    setColumnFilter: (columnId: string, filter: string) => void;
    clearColumnFilter: (columnId: string) => void;
    clearAllFilters: () => void;
  };

  columnManagement: {
    toggleVisibility: (columnId: string) => void;
    setVisibility: (columnId: string, visible: boolean) => void;
    reorder: (columnOrder: string[]) => void;
  };

  selection: {
    state: SelectionState;
    enabled: boolean;
    mode: "single" | "multi";
    selectedRowIds: Set<string | number>;
    selectedCount: number;
    isSelected: (rowId: string | number) => boolean;
    select: (rowId: string | number) => void;
    deselect: (rowId: string | number) => void;
    toggle: (rowId: string | number) => void;
    selectAll: () => void;
    deselectAll: () => void;
    clear: () => void;
    isAllSelected: boolean;
    isIndeterminate: boolean;
  };
}
```

## Styling

The library uses CSS variables for easy theming. Import default styles or create your own:

```css
:root {
  --table-x-bg: #ffffff;
  --table-x-header-bg: #f9fafb;
  --table-x-sticky-bg: #ffffff;
  --table-x-border-color: #e5e7eb;
  --table-x-border-width: 1px;
  --table-x-hover-bg: #f3f4f6;
  --table-x-text-color: #111827;
}
```

### Custom Styles

```css
.table-x-header-cell {
  background-color: var(--table-x-header-bg, #f9fafb);
  border: var(--table-x-border-width, 1px) solid var(
      --table-x-border-color,
      #e5e7eb
    );
}

.table-x-cell {
  padding: 12px;
}

.table-x-checkbox {
  cursor: pointer;
}
```

## TypeScript Support

Full TypeScript support with excellent type inference:

```tsx
// Column keys are type-checked
const columns = defineColumns<User>()([
  col("name", { ... }), // ✅ Type-safe
  col("invalid", { ... }), // ❌ Type error
]);

// Row data is typed
const table = useDataTable({
  data: users, // TData inferred from columns
  columns,
});

// Access typed data
table.paginatedData.forEach((user) => {
  user.name; // ✅ Type-safe
  user.invalid; // ❌ Type error
});
```

## Core Usage (Framework-agnostic)

```tsx
import {
  defineColumns,
  col,
  createColumns,
  createInitialTableState,
  applyFilters,
  applySort,
  getPaginatedData,
} from "tablero/core";

const columns = defineColumns<User>()([
  col("name", { header: "Name", sortable: true }),
  col("email", { header: "Email" }),
]);

const runtimeColumns = createColumns(columns);
const state = createInitialTableState(columns.map((c) => c.id));

// Apply filters
const filtered = applyFilters(data, state.filtering, getValue);

// Apply sorting
const sorted = applySort(filtered, state.sorting, getValue);

// Paginate
const paginated = getPaginatedData(sorted, state.pagination);
```

## Examples

See the [examples](./examples/) directory for complete working examples:

- `react-example.tsx` - Full-featured React example with all features
- `basic-example.ts` - Core usage example

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
