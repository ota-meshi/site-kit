import { defineConfig } from "tsup";

export default defineConfig({
  clean: true,
  dts: true,
  entry: ["src/index.ts", "src/svelte.ts", "src/toml.ts"],
  format: ["cjs", "esm"],
  outDir: "lib",
});
