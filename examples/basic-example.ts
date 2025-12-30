/**
 * Basic example demonstrating core table functionality with dummy data
 */

import {
  defineColumns,
  col,
  createColumns,
  createInitialTableState,
  applyFilters,
  applySort,
  getPaginatedData,
} from "../packages/core";

// Define a sample data type
interface User {
  id: number;
  name: string;
  email: string;
  age: number;
  role: string;
  active: boolean;
}

// Sample data
const users: User[] = [
  { id: 1, name: "Alice Johnson", email: "alice@example.com", age: 28, role: "Admin", active: true },
  { id: 2, name: "Bob Smith", email: "bob@example.com", age: 34, role: "User", active: true },
  { id: 3, name: "Charlie Brown", email: "charlie@example.com", age: 22, role: "User", active: false },
  { id: 4, name: "Diana Prince", email: "diana@example.com", age: 30, role: "Admin", active: true },
  { id: 5, name: "Eve Wilson", email: "eve@example.com", age: 26, role: "User", active: true },
  { id: 6, name: "Frank Miller", email: "frank@example.com", age: 45, role: "Manager", active: true },
  { id: 7, name: "Grace Lee", email: "grace@example.com", age: 29, role: "User", active: false },
  { id: 8, name: "Henry Davis", email: "henry@example.com", age: 31, role: "Admin", active: true },
  { id: 9, name: "Ivy Chen", email: "ivy@example.com", age: 24, role: "User", active: true },
  { id: 10, name: "Jack Taylor", email: "jack@example.com", age: 38, role: "Manager", active: true },
  { id: 11, name: "Kate Williams", email: "kate@example.com", age: 27, role: "User", active: true },
  { id: 12, name: "Liam Jones", email: "liam@example.com", age: 33, role: "Admin", active: false },
];

// Define columns
const columns = defineColumns<User>()([
  col("name", {
    header: "Name",
    sortable: true,
    filter: "text",
    width: 200,
  }),
  col("email", {
    header: "Email",
    sortable: true,
    filter: "text",
    width: 250,
  }),
  col("age", {
    header: "Age",
    sortable: true,
    filter: "none",
    width: 100,
    align: "right",
  }),
  col("role", {
    header: "Role",
    sortable: true,
    filter: "text",
    width: 120,
  }),
  col("active", {
    header: "Active",
    sortable: true,
    filter: "none",
    width: 100,
    align: "center",
  }),
]);

// Create runtime columns
const runtimeColumns = createColumns(columns);

// Create initial state
const columnIds = columns.map((col) => col.id);
const state = createInitialTableState(columnIds);

// Helper to get value from data item
const getValue = (item: User, columnId: string): unknown => {
  const column = runtimeColumns.find((col) => col.id === columnId);
  if (!column) return undefined;
  return column.accessor(item);
};

// Test 1: Basic filtering
console.log("=== Test 1: Filtering ===");
const filteredState = {
  ...state,
  filtering: {
    globalFilter: "admin",
    columnFilters: {},
  },
};
const filtered = applyFilters(users, filteredState.filtering, getValue);
console.log(`Filtered results (searching for "admin"):`, filtered.length);
console.log(filtered.map((u) => u.name));

// Test 2: Column-specific filtering
console.log("\n=== Test 2: Column Filtering ===");
const columnFilteredState = {
  ...state,
  filtering: {
    globalFilter: "",
    columnFilters: { role: "Admin" },
  },
};
const columnFiltered = applyFilters(users, columnFilteredState.filtering, getValue);
console.log(`Users with role "Admin":`, columnFiltered.length);
console.log(columnFiltered.map((u) => `${u.name} (${u.role})`));

// Test 3: Sorting
console.log("\n=== Test 3: Sorting ===");
const sortedState = {
  ...state,
  sorting: {
    columnId: "age",
    direction: "desc",
  },
};
const sorted = applySort(users, sortedState.sorting, getValue);
console.log("Sorted by age (descending):");
console.log(sorted.map((u) => `${u.name}: ${u.age}`));

// Test 4: Combined filtering and sorting
console.log("\n=== Test 4: Filter + Sort ===");
const combinedState = {
  ...state,
  filtering: {
    globalFilter: "",
    columnFilters: { role: "User" },
  },
  sorting: {
    columnId: "name",
    direction: "asc",
  },
};
const filtered2 = applyFilters(users, combinedState.filtering, getValue);
const sorted2 = applySort(filtered2, combinedState.sorting, getValue);
console.log("Users with role 'User', sorted by name:");
console.log(sorted2.map((u) => `${u.name} (${u.role})`));

// Test 5: Pagination
console.log("\n=== Test 5: Pagination ===");
const paginatedState = {
  ...state,
  pagination: {
    pageIndex: 0,
    pageSize: 5,
  },
};
const paginated = getPaginatedData(users, paginatedState.pagination);
console.log(`Page 1 (${paginatedState.pagination.pageSize} items):`);
console.log(paginated.map((u) => u.name));

const page2State = {
  ...state,
  pagination: {
    pageIndex: 1,
    pageSize: 5,
  },
};
const page2 = getPaginatedData(users, page2State.pagination);
console.log(`\nPage 2 (${page2State.pagination.pageSize} items):`);
console.log(page2.map((u) => u.name));

// Test 6: Full pipeline (filter -> sort -> paginate)
console.log("\n=== Test 6: Full Pipeline ===");
const fullPipelineState = {
  ...state,
  filtering: {
    globalFilter: "a", // Search for "a" in all fields
    columnFilters: {},
  },
  sorting: {
    columnId: "age",
    direction: "asc",
  },
  pagination: {
    pageIndex: 0,
    pageSize: 3,
  },
};
const step1 = applyFilters(users, fullPipelineState.filtering, getValue);
const step2 = applySort(step1, fullPipelineState.sorting, getValue);
const step3 = getPaginatedData(step2, fullPipelineState.pagination);
console.log("Users with 'a' in name/email, sorted by age, first 3:");
console.log(step3.map((u) => `${u.name} (age: ${u.age})`));

console.log("\n✅ All tests completed!");

