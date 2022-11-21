import { resolve } from "path";
import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";
import { bundleCssPlugin } from "../site-kit-vite-plugins/index.js";

export default defineConfig({
  plugins: [vue(), bundleCssPlugin({ fileName: "ESLintEditor.vue3" })],
  build: {
    outDir: __dirname,
    cssCodeSplit: false,
    lib: {
      // Could also be a dictionary or array of multiple entry points
      entry: resolve(__dirname, "ESLintEditor.vue"),
      name: "ESLintEditor",
      // the proper extensions will be added
      fileName: "ESLintEditor.vue3",
      formats: ["es"],
    },
    rollupOptions: {
      // make sure to externalize deps that shouldn't be bundled
      // into your library
      external: ["vue", "@ota-meshi/site-kit-monaco-editor"],
    },
  },
});
