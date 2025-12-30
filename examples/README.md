# Examples

This directory contains example files demonstrating how to use the table-x library.

## Quick Start - View the UI

To see the UI in action, run:

```bash
pnpm install  # if you haven't already
pnpm dev
```

This will start a development server at `http://localhost:3000` and open it in your browser.

## Basic Example (`basic-example.ts`)

Demonstrates core functionality without React:

- Column definitions
- Filtering (global and column-specific)
- Sorting
- Pagination
- Full data pipeline

Run with:

```bash
pnpm run example
# or
npx tsx examples/basic-example.ts
```

## React Example (`react-example.tsx`)

Demonstrates the `useDataTable` hook and `DataTable` UI component:

- Hook usage
- Interactive sorting
- Global search
- Pagination controls
- Real-time state updates
- Sticky header and first column
- Column resizing

View in browser:

```bash
pnpm dev
```

Or use in your own React app:

```tsx
import { DataTableExample } from "./examples/react-example";

function App() {
  return <DataTableExample />;
}
```

## Sample Data

Both examples use a `User` interface with the following structure:

- `id`: number
- `name`: string
- `email`: string
- `age`: number
- `role`: string (Admin, User, Manager)
- `active`: boolean

The sample data includes 12 users with various roles and statuses for testing filtering, sorting, and pagination.

## Styling

The `table-styles.css` file provides basic styling using CSS variables. You can customize the appearance by overriding these variables:

```css
:root {
  --table-x-bg: #ffffff;
  --table-x-header-bg: #f9fafb;
  --table-x-border-color: #e5e7eb;
  --table-x-hover-bg: #f3f4f6;
  /* ... more variables */
}
```
