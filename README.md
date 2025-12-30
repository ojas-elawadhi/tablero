# tablero

A type-safe, framework-agnostic data table library with React bindings. Built with TypeScript for maximum type safety and developer experience.

## Features

- 🎯 **Type-safe** - Full TypeScript support with excellent type inference
- 🔄 **Framework-agnostic core** - Use the core logic with any framework
- ⚛️ **React hooks** - `useDataTable` hook for easy React integration
- 🎨 **Customizable UI** - Flexible, CSS-variable based styling
- 📊 **Sorting** - Single-column sorting (extensible to multi-column)
- 📄 **Pagination** - Client-side pagination with configurable page sizes
- 🔍 **Filtering** - Global and column-specific text filtering
- 📌 **Sticky headers & columns** - Keep headers and first column visible while scrolling
- 🔧 **Column resizing** - Resize columns with pointer-based interaction
- 🎭 **Custom renderers** - Customize cell, header, and row rendering
- ♿ **Accessible** - ARIA attributes and keyboard support

## Installation

```bash
npm install tablero
# or
pnpm add tablero
# or
yarn add tablero
```

## Quick Start

### React Example

```tsx
import { useDataTable } from "tablero/react";
import { DataTable } from "tablero/ui";
import { defineColumns, col } from "tablero/core";
import "tablero/dist/ui.css"; // Optional: import default styles

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

  return <DataTable table={table} stickyHeader bordered maxHeight={400} />;
}
```

### Core Usage (Framework-agnostic)

```ts
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

## Packages

This library is organized into three packages:

- **`tablero/core`** - Framework-agnostic core logic (state management, sorting, filtering, pagination)
- **`tablero/react`** - React hooks (`useDataTable`)
- **`tablero/ui`** - React UI components (`DataTable`, `TableHeader`, `TableBody`, `TableCell`)

## API Documentation

### Core API

See the [core package documentation](./packages/core/README.md) for detailed API documentation.

### React Hook

```tsx
const table = useDataTable({
  data: TData[],
  columns: ColumnDef<TData>[],
  pageSize?: number,
  state?: TableStateHandler | UncontrolledTableState,
});
```

### DataTable Component

```tsx
<DataTable
  table={table}
  bordered={true}
  stickyHeader={false}
  stickyFirstColumn={false}
  enableResizing={false}
  maxHeight?: number | string
  slots={{
    loader?: React.ComponentType,
    empty?: React.ComponentType<{ columns: Column[] }>,
    error?: React.ComponentType<{ error: Error | string }>,
  }}
  renderCell?: (value, row, column) => React.ReactNode
  renderHeader?: (column, sortState) => React.ReactNode
  renderRow?: (row, index, cells) => React.ReactNode
/>
```

## Styling

The library uses CSS variables for easy theming. Import the default styles or create your own:

```css
:root {
  --tablero-bg: #ffffff;
  --tablero-header-bg: #f9fafb;
  --tablero-border-color: #e5e7eb;
  --tablero-border-width: 1px;
  --tablero-hover-bg: #f3f4f6;
  --tablero-text-color: #111827;
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
```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
