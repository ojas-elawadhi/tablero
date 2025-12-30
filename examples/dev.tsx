/**
 * Development entry point for testing the UI
 */

import React from "react";
import { createRoot } from "react-dom/client";
import { DataTableExample } from "./react-example";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found");
}

const root = createRoot(rootElement);
root.render(
  <React.StrictMode>
    <DataTableExample />
  </React.StrictMode>
);

