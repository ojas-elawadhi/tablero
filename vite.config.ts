import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  root: "examples",
  resolve: {
    alias: {
      "@core": path.resolve(__dirname, "./packages/core"),
      "@react": path.resolve(__dirname, "./packages/react"),
      "@ui": path.resolve(__dirname, "./packages/ui"),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
});

