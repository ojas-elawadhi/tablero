import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    core: "packages/core/index.ts",
    react: "packages/react/index.ts",
    ui: "packages/ui/index.ts",
  },
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  splitting: false,
  sourcemap: true,
  treeshake: true,
  outDir: "dist",
  external: ["react", "react-dom"],
});
