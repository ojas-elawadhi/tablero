/**
 * React example demonstrating useDataTable hook with dummy data
 */

import React from "react";
import { defineColumns, col } from "../packages/core/index";
import { useDataTable } from "../packages/react/index";
import { DataTable } from "../packages/ui/index";
import "./table-styles.css";

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

/**
 * Example React component using useDataTable and DataTable UI
 */
export function DataTableExample() {
  const table = useDataTable({
    data: users,
    columns,
    pageSize: 5,
  });

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1>Data Table Example</h1>

      {/* Global Filter */}
      <div style={{ marginBottom: "20px" }}>
        <label>
          Global Search:{" "}
          <input
            type="text"
            value={table.filtering.state.globalFilter}
            onChange={(e) => table.filtering.setGlobalFilter(e.target.value)}
            placeholder="Search all columns..."
            style={{ padding: "8px", width: "300px" }}
          />
        </label>
      </div>

      {/* DataTable Component */}
      <DataTable
        table={table}
        stickyHeader
        stickyFirstColumn
        enableResizing
        maxHeight={400}
        bordered
        getRowKey={(row) => row.id}
        slots={{
          empty: ({ columns }) => (
            <div>
              <p>No data available</p>
              <p style={{ fontSize: "12px", opacity: 0.6 }}>
                {columns.length} columns configured
              </p>
            </div>
          ),
        }}
      />

      {/* Pagination Controls */}
      <div
        style={{
          marginTop: "20px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}
      >
        <button
          onClick={() => table.pagination.previousPage()}
          disabled={!table.hasPreviousPage}
          style={{ padding: "8px 16px" }}
        >
          Previous
        </button>
        <span>
          Page {table.pageIndex + 1} of {table.pageCount} (
          {table.filteredRowCount} total items)
        </span>
        <button
          onClick={() => table.pagination.nextPage()}
          disabled={!table.hasNextPage}
          style={{ padding: "8px 16px" }}
        >
          Next
        </button>
        <select
          value={table.pageSize}
          onChange={(e) => table.pagination.setPageSize(Number(e.target.value))}
          style={{ padding: "8px", marginLeft: "20px" }}
        >
          <option value={5}>5 per page</option>
          <option value={10}>10 per page</option>
          <option value={20}>20 per page</option>
        </select>
      </div>

      {/* Debug Info */}
      <div
        style={{
          marginTop: "20px",
          padding: "10px",
          backgroundColor: "#f9f9f9",
          fontSize: "12px",
        }}
      >
        <strong>Debug Info:</strong>
        <br />
        Filtered: {table.filteredRowCount} / {table.data.length}
        <br />
        Sort: {table.sorting.state.columnId || "none"}{" "}
        {table.sorting.state.direction || ""}
        <br />
        Page: {table.pageIndex + 1} / {table.pageCount}
      </div>
    </div>
  );
}

